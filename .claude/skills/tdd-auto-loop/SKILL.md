---
name: tdd-auto-loop
description: GitHub 이슈 **한 개**를 받아 이 저장소의 TDD 7단계(사전 점검 → test-scenarios → tdd-red → tdd-green → ac-verifier → tdd-refactor → security-review → create-pr)를 **사람 승인 없이 끝까지 자율 완주**시키는 오케스트레이터 스킬. 각 단계를 **Task subagent로 격리 실행**하고, 하위 스킬의 승인 게이트는 subagent가 스스로 통과시키며, 단계마다 **정해진 JSON 한 블록**만 받아 `[단계명] OK/STOP` 한 줄로 진행을 표시한다. `/tdd-auto-loop <이슈번호>`로 호출하며, 사용자가 "이슈 N 자동으로 끝까지", "무인 TDD 루프", "승인 없이 완주", "auto loop N", "tdd-auto-loop N", "이슈 N 알아서 PR까지" 같은 요청을 하면 — 'tdd-auto-loop'를 직접 언급하지 않더라도 — 이 스킬을 사용할 것. **⚠️ 이 스킬은 사람 승인 없이 코드·커밋·PR을 만든다.** 단계마다 멈춰 사람이 검토·승인하며 진행하고 싶으면 이 스킬이 아니라 HITL 컨테이너 `tdd-loop`를 쓴다. 특정 한 단계만 원하면(예: "GREEN만") 해당 단계 스킬을 직접 쓴다.
---

# tdd-auto-loop

하나의 GitHub 이슈를 **계약 확정 → 테스트 → 구현 → AC 검증 → 정리 → 점검 → PR**까지 **사람 개입 없이**
밀어붙이는 자율 오케스트레이터다. HITL 컨테이너 [`tdd-loop`]와 같은 7단계·같은 순서를 돌지만, 세 가지가 다르다:

1. **격리 실행** — 각 단계를 Skill 도구(메인 대화)가 아니라 **Task subagent**로 spawn한다. 메인은
   **코드/테스트 본문을 직접 읽거나 쓰지 않고**, subagent가 반환한 **JSON만** 소비한다.
2. **자율 모드 강제** — subagent가 따르는 하위 스킬의 승인 게이트("이 시그니처로 확정할까요?" 등)를
   **subagent가 스스로 판단해 통과**시킨다. 사람에게 묻지 않고, 모호하면 STOP한다.
3. **결정적 리포트** — 각 단계는 아래 §단계별 JSON 스키마의 **한 블록만** 반환하고, 메인은 `[단계명] OK`
   또는 `[단계명] STOP(사유)` 한 줄로만 진행을 표시한다. STOP 시 이슈에 코멘트를 남기고 루프를 끝낸다.

> **이건 위험한 자동화다.** 사람 승인 없이 브랜치를 만들고 커밋하고 PR을 연다. 승인 게이트를 유지한 채
> 돌리려면 `tdd-loop`를 써라. 이 스킬은 결과를 사람이 사후 검토한다는 전제로만 쓴다.

## 입력

- `$ARGUMENTS` = **GitHub 이슈 번호** 하나(선행 정수만 파싱, `"5 가보자"` → `5`). 예: `/tdd-auto-loop 5`.
- 이슈는 origin **`kamser0415/ccwork`** 기준 — 조회는 항상 `gh ... --repo kamser0415/ccwork`로 명시한다
  (gh 기본 repo가 upstream으로 드리프트하면 엉뚱한 옛 이슈를 읽는다).
- base `feature/<spec>`는 인자로 받지 않는다 — **0단계에서 자동 추론**한다.

## 산출물

- 하위 스킬들이 만드는 산출물이 순서대로 쌓이고, 마지막에 **base가 `feature/<spec>`이고 본문에 `Closes #N`을
  담은 PR**이 열린다.
- 오케스트레이터 자신은 **단계별 JSON 로그 + `[단계명] OK/STOP` 한 줄 + (STOP 시) 이슈 코멘트**만 출력한다.

## 비협상 제약 (오케스트레이터가 반드시 지킬 것)

- **메인은 코드/테스트 본문을 직접 읽거나 수정하지 않는다.** 파일 변경은 전부 subagent가 한다. 메인이 직접
  하는 것은 git/gh 오케스트레이션(`status`·`branch`·`commit`·`issue view/comment`)과 **subagent JSON 파싱**뿐이다.
- **AC 검증(4단계)은 3단계 GREEN을 수행한 subagent와 반드시 다른 에이전트**(`ac-verifier`)로 실행한다.
  같은 subagent가 자기 구현을 자기가 검증하게 두지 않는다.
- **사람에게 묻지 않는다.** 하위 게이트는 subagent가 자체 통과하고, 모호하면 STOP한다.
- **STOP은 정상 동작이다.** 실패를 삼키고 다음 단계로 넘어가지 않는다. 순서를 바꾸거나 단계를 건너뛰지 않는다.
- `git push --force`(및 `--force-with-lease`), `npm audit fix --force`, **E2E 코드를 고쳐 통과시키는 회피**는
  금지한다(하위 스킬 제약 승계).

## 자율 모드 override 블록

**모든 subagent spawn 프롬프트의 맨 끝에 아래를 글자 그대로 붙인다.** 이게 하위 스킬의 승인 게이트를
자율로 통과시키고, 출력을 JSON 한 블록으로 강제하는 장치다.

```
[자율 모드 — 반드시 준수]
- 이 작업엔 사람이 없다. 네가 따르는 스킬 문서의 승인 게이트(예: "이 시그니처로 확정할까요?",
  "이 항목들을 리팩토링할까요?", "즉시 수정 항목을 처리할까요?", "이 내용으로 PR을 만들까요?")는
  사람에게 묻지 말고 네가 스스로 판단해 승인하고 계속 진행한다.
- 사람에게 어떤 질문도 하지 않는다. 결정에 필요한 정보가 부족하거나 서로 모순되면(진짜 RED 불가,
  시그니처 도출 불가, 시나리오·시그니처 충돌 등) 추측하지 말고 STOP한다 — 아래 JSON에서 "ok":false 와
  "stop_reason"에 한 줄 사유를 담아 반환한다.
- 추측 금지. 스킬 문서·이슈 AC·기존 코드로 확정할 수 있는 것만 한다.
- 출력은 아래 지정된 JSON "한 블록"만. 그 외 서문·설명·마크다운·코드펜스 바깥 텍스트를 절대 출력하지 않는다.
  JSON 스키마의 키 이름과 구조를 변형하지 않는다(값만 실제 결과로 채운다).
```

## 7단계 파이프라인 맵

| #   | 단계          | spawn                              | 읽을 SKILL.md (수행 지침 정본)                  | STOP 조건                                                 |
| --- | ------------- | ---------------------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| 0   | 사전 점검     | **메인 직접** (subagent 아님)      | —                                               | 이슈/AC 없음·git 미청결·base 추론 실패·작업 브랜치 기존재 |
| 1   | 계약+시나리오 | Task `general-purpose`             | `.claude/skills/test-scenarios/SKILL.md`        | 시그니처/시나리오 도출 불가                               |
| 2   | RED           | Task `general-purpose`             | `.claude/skills/tdd-red/SKILL.md`               | 진짜 RED 불가(false RED만 남음)                           |
| 3   | GREEN         | Task `general-purpose` (최대 3회)  | `.claude/skills/tdd-green/SKILL.md`             | 3회로도 전체 GREEN 실패                                   |
| 4   | AC 검증       | Task **`ac-verifier`** (agentType) | `.claude/agents/ac-verifier.md` (에이전트 정의) | AC 미충족/부분충족(갭 존재)                               |
| 5   | REFACTOR      | Task `general-purpose`             | `.claude/skills/tdd-refactor/SKILL.md`          | 롤백 불가/구조 개선 중 초록 깨짐 지속                     |
| 6   | 보안 점검     | Task `general-purpose`             | `.claude/skills/security-review/SKILL.md`       | 🔴을 해소해 클린 만들지 못함                              |
| 7   | 통합(PR)      | Task `general-purpose`             | `.claude/skills/create-pr/SKILL.md`             | E2E 실패·commitlint 위반·push/pr 실패                     |

> 경로는 **현재 작업 트리 기준 절대경로**로 넘긴다(프로젝트 루트 = `git rev-parse --show-toplevel`).
> subagent는 그 파일을 `Read`로 읽고 절차를 그대로 수행한다. 4단계만 스킬이 아니라 `ac-verifier`
> 에이전트 정의를 쓰므로, `subagent_type: ac-verifier`로 spawn하고 프롬프트에 이슈 번호와 반환 JSON 스키마만 넣는다.

---

## 실행 절차

### 0. 사전 점검 (메인이 직접 수행) — 하나라도 실패하면 STOP

subagent를 하나도 띄우기 전에, 파이프라인을 안전하게 시작할 수 있는 상태인지 메인이 직접 확인한다.

1. **이슈/AC 존재** — `gh issue view N --repo kamser0415/ccwork`로 본문과 **AC(수용 기준 체크박스)**를 읽는다.
   이슈가 없거나 조회 실패거나 **AC 섹션이 비어 있으면** STOP.
2. **git 청결** — `git status --porcelain`이 **비어 있어야** 한다. 미커밋 변경이 있으면 STOP(사유에
   "커밋/스태시 후 재실행" 안내). 파이프라인이 만들 변경과 기존 변경이 섞이면 롤백·리뷰가 오염된다.
3. **base = `feature/<spec>` 자동 추론** — 현재 브랜치에서 통합 기준 스펙 브랜치를 뽑는다. 우선순위:
   1. 현재 브랜치가 `feature/*`면 그것을 base로, `<spec>` = `feature/` 뒤 문자열.
   2. 아니면 `git rev-parse --abbrev-ref --symbolic-full-name @{u}` 및 로컬 `feature/*` 브랜치들과의
      `git merge-base`로 분기 원점을 찾아 `feature/<spec>`을 추론.
   - `feature/*`를 하나로 확정하지 못하거나 후보가 여럿이라 애매하면 **STOP**(추측 금지).
   - 확정된 `<spec>`을 5·7단계 base로 쓴다(예: `tag-create`).
4. **작업 브랜치 `feat/<issue-slug>`** — 이슈 번호+제목에서 짧은 kebab 슬러그를 만든다(예: `feat/5-remove-tag`).
   - **이미 존재하면**(로컬 또는 origin) → 동일 이슈 재실행 신호. 브랜치 덮어쓰기는 파괴적이라 자율 모드가
     임의로 결정하지 않는다 → **STOP**(사유에 "기존 `feat/<slug>` 정리 후 재호출" 안내).
   - **없으면** → `feature/<spec>`에서 `feat/<issue-slug>`로 **분기 + 체크아웃**한다.
5. 통과 시 `[0/7 사전 점검] OK` 한 줄 + precheck JSON을 로그로 남기고 1단계로 진행한다.

### 1~7. 각 단계 — Task subagent로 격리 실행

각 단계는 아래 **공통 골격**으로 subagent를 spawn한다. `<STEP_SKILL_PATH>`·`<단계명>`·`<N/7>`·`<STEP_SCHEMA>`만
단계별로 바꾸고, **override 블록은 항상 맨 끝에** 붙인다.

```
너는 tdd-auto-loop의 [<N>/7] "<단계명>" 단계를 격리 실행하는 subagent다. 대상 GitHub 이슈 번호 = <N>.

1) <STEP_SKILL_PATH> 를 Read로 읽고, 그 문서의 절차를 이슈 <N>에 대해 처음부터 끝까지 그대로 수행하라.
2) 이슈·PR 조회는 반드시 `gh <cmd> --repo kamser0415/ccwork`로 한다.
3) 이 저장소의 CLAUDE.md 코드 컨벤션/커밋 규약을 준수한다.
4) 수행을 마치면 아래 스키마와 "정확히 일치"하는 JSON 한 블록만 반환한다(키·구조 불변, 값만 실제 결과로):

<STEP_SCHEMA>

<자율 모드 override 블록>
```

단계별로 달라지는 부분:

- **[1/7] 계약+시나리오** — `<STEP_SKILL_PATH>` = `test-scenarios/SKILL.md`. 산출물 `docs/features/tag/issue-{N}.md`
  (시그니처·시나리오). 스킬 내부의 **시그니처 승인·시나리오 승인 두 게이트를 subagent가 자체 통과**한다.
- **[2/7] RED** — `tdd-red/SKILL.md`. 승인된 시나리오를 **실행되며 올바른 이유로 빨간** 테스트로 옮긴다
  (대상 파일 없을 때만 `throw` 골격). import 오류 등 false RED만 남아 진짜 RED가 안 되면 `ok:false`.
- **[3/7] GREEN** — `tdd-green/SKILL.md`. **재시도 로직은 아래 §재시도 정책 참고**(메인이 최대 3회 재spawn).
  전부 통과하면 `commit_subject`(commitlint 형식)를 함께 반환한다.
- **[4/7] AC 검증** — `subagent_type: ac-verifier`로 spawn. `<STEP_SKILL_PATH>` 대신 프롬프트에 "이슈 <N>의
  AC 충족 여부를 독립 판정하라. 읽기 전용 — 코드/테스트를 고치지 마라."를 넣고 JSON 스키마와 override를 붙인다.
  **3단계 subagent와 다른 에이전트**이므로 자기검증이 아니다.
- **[5/7] REFACTOR** — `tdd-refactor/SKILL.md`. **리팩토링 대상 목록 승인 게이트를 subagent가 자체 통과**한다.
  변경 한 건마다 `npm test`로 초록 유지, 깨지면 즉시 롤백. 구조 개선분은 `commit_subject`로 반환.
- **[6/7] 보안 점검** — `security-review/SKILL.md`. `tsc --noEmit`·`npm audit`·`.env` 노출을 3분류하고,
  **"즉시 수정 필요" 처리 승인 게이트를 subagent가 자체 통과**해 🔴만 고친 뒤 재스캔으로 클린 확인.
- **[7/7] 통합(PR)** — `create-pr/SKILL.md`. **PR 초안·base 승인 게이트를 자체 통과**하고, base는
  0단계의 `feature/<spec>`, 본문에 `Closes #N` 포함. `npm run test:e2e`를 통과할 때만 push + PR 생성.
  (§PR 단계 세부 참고.)

각 단계가 끝나면 메인은 반환 JSON을 파싱해 로그로 남기고 `[<단계명>] OK` 한 줄을 출력한 뒤 다음 단계로 넘어간다.
`ok:false`거나 재시도 소진이면 §STOP 처리로 간다.

### 커밋 전략 (메인이 git 오케스트레이션)

subagent들은 파일만 바꾸고 **커밋하지 않는다.** 커밋은 메인이 낸다(git은 코드 본문 읽기가 아님):

- **3단계(GREEN) 통과 직후** → `git add -A && git commit -m "<step3.commit_subject>"`.
  (tdd-refactor가 롤백 기준으로 삼을 GREEN 커밋을 만든다.)
- **5단계(REFACTOR) 후 변경이 있으면** → `<step5.commit_subject>`로 커밋.
- 커밋은 pre-commit 훅(lint-staged·`check-design.mjs`·commitlint)을 태운다 — **훅이 커밋을 막으면 STOP**한다
  (빌드/디자인/커밋메시지 규칙 위반을 삼키고 진행하지 않는다). `--no-verify`로 우회하지 않는다.
- `commit_subject`는 subagent가 commitlint 형식(`type: 한국어 subject`, 100자 이내, 대문자 영문 시작 금지)으로 제안한다.

### 재시도 정책

- **3단계 GREEN만 최대 3회.** subagent가 `all_green:false`를 반환하거나 JSON 스키마를 위반하면,
  **새 subagent로 재spawn**하되 프롬프트에 "직전 시도에서 아직 빨간 테스트: <목록/메시지>"를 덧붙인다.
  누적 3회로도 전체 GREEN이 안 되면 STOP. (`attempts`에 실제 시도 횟수를 기록.)
- **그 외 모든 단계(0 제외).** 반환이 **스키마 위반(파싱 불가/키 불일치)일 때만 1회 재spawn**한다.
  재시도 후에도 위반이면 STOP. **유효한 JSON인데 `ok:false`면 재시도 없이 즉시 STOP**한다
  (예: 진짜 RED 불가, AC 갭, 보안 미클린, E2E 실패 — 이건 사람 판단이 필요한 정상 정지점이다).

### PR 단계 세부 (7단계)

- **base** = 0단계에서 뽑은 `feature/<spec>`.
- PR 본문에 **`Closes #N`** 포함(create-pr 템플릿의 "## 관련 이슈").
- **PR 제목은 commitlint/Conventional Commits 형식** — 위반이면 STOP.
- **E2E(`npm run test:e2e`) 실패 → PR을 만들지 않고 STOP.** E2E 코드를 고쳐 통과시키는 회피는 하지 않는다
  (통합 seam 원인은 프로덕션 코드에서 고치도록 보고만).
- base가 `feature/<spec>`(비-기본 브랜치)면 GitHub 자동 클로즈가 안 걸린다 → 결과에 `manual_close_needed:true`로
  표시하고 "머지 후 `gh issue close N` 필요"를 안내한다. **루프는 PR 오픈에서 종료**한다 —
  머지·이슈 클로즈는 사람/CI 몫이다.

---

## 단계별 JSON 스키마 (예시값과 함께 고정 — 키·구조 변형 금지)

subagent는 아래 스키마의 **값만** 실제 결과로 채운다. STOP은 어느 단계든 `"ok":false` + `"stop_reason":"<한 줄 사유>"`
(나머지 값은 가능한 만큼 채운다).

```json
// [0/7] 사전 점검 (메인이 생성)
{"step":0,"name":"precheck","ok":true,"issue":5,"spec":"tag-create",
 "base_branch":"feature/tag-create","work_branch":"feat/5-remove-tag",
 "checks":{"ac_present":true,"git_clean":true,"on_base_branch":true,"branch_ready":true},
 "stop_reason":null}

// [1/7] test-scenarios
{"step":1,"name":"test-scenarios","ok":true,"issue":5,
 "artifact":"docs/features/tag/issue-5.md",
 "signatures":["removeTag(tags: string[], target: string): string[]"],
 "scenario_count":3,"ac_mapped":true,"stop_reason":null}

// [2/7] tdd-red
{"step":2,"name":"tdd-red","ok":true,"issue":5,
 "test_files":["src/lib/tags.test.ts"],"red_count":3,"all_red":true,
 "false_red":false,"stop_reason":null}

// [3/7] tdd-green
{"step":3,"name":"tdd-green","ok":true,"issue":5,"attempts":1,"all_green":true,
 "test_total":43,"test_passed":43,"impl_files":["src/lib/tags.ts"],
 "commit_subject":"feat: 태그 개별 삭제 (removeTag)","stop_reason":null}

// [4/7] ac-verifier
{"step":4,"name":"ac-verifier","ok":true,"issue":5,
 "ac_total":4,"ac_passed":4,"ac_partial":0,"ac_failed":0,"gaps":[],"stop_reason":null}

// [5/7] tdd-refactor
{"step":5,"name":"tdd-refactor","ok":true,"issue":5,"targets":["src/lib/tags.ts"],
 "changes":2,"all_green":true,"commit_subject":"refactor: tags 중복 로직 정리","stop_reason":null}

// [6/7] security-review
{"step":6,"name":"security-review","ok":true,"issue":5,
 "red":0,"yellow":1,"white":3,"clean":true,"stop_reason":null}

// [7/7] create-pr
{"step":7,"name":"create-pr","ok":true,"issue":5,"e2e_passed":true,
 "base":"feature/tag-create","pr_url":"https://github.com/kamser0415/ccwork/pull/11",
 "closes":5,"commitlint_ok":true,"manual_close_needed":true,"stop_reason":null}
```

---

## 진행 메시지 형식

각 단계 종료 후 **한 줄만** 출력한다:

```
[1/7 계약+시나리오] OK
[2/7 RED] OK
[3/7 GREEN] OK (attempts=1)
...
```

중단 시:

```
[3/7 GREEN] STOP(5회 루프로도 3개 테스트 미통과)
```

장황한 서술은 금지한다 — 상세는 각 단계의 JSON 로그가 담는다. 각 단계 subagent의 내부 작업 내역은 격리돼
있으므로 메인이 가로채거나 재요약하지 않는다.

## STOP 처리 (사람에게 묻지 않음)

어느 단계든 `ok:false`(또는 재시도 소진)로 끝나면 메인은 **다음 단계를 시작하지 말고**:

1. 진행 로그에 `[<단계명>] STOP(<stop_reason>)` 한 줄을 출력한다.
2. 이슈에 코멘트를 남긴다 — `gh issue comment N --repo kamser0415/ccwork --body "<정형 코멘트>"`:

   ```
   🤖 tdd-auto-loop STOP — [3/7] GREEN
   - 원인: <stop_reason>
   - 브랜치: feat/5-remove-tag (base feature/tag-create)
   - 마지막 성공 단계: [2/7] RED
   - 다음 행동: 사람이 <무엇을 확인/결정>한 뒤 재개
   ```

3. **루프를 종료한다.** 다음 단계 진행·자동 복구·질문은 없다.

다음은 **STOP이 정상 동작**이다(버그가 아니다):

- **0단계** 이슈/AC 없음·git 미청결·base 추론 실패·작업 브랜치 기존재 → 시작 자체를 막는다.
- **2단계** 진짜 RED 불가(시나리오·시그니처 모순 의심) → 1단계 재고가 필요.
- **3단계** 3회 재시도로도 미통과 → 테스트/구현 모순을 사람에게.
- **4단계** AC 갭 → 임의 보강 금지, 사람이 tdd-red 복귀 여부 결정.
- **6단계** 🔴을 클린으로 못 만듦 → 커밋/PR 금지.
- **7단계** E2E 실패 → PR 미생성, 통합 seam 원인을 프로덕션 코드에서 고치도록.

## 하지 않는 것 (경계)

- **순서 변경·단계 건너뛰기 금지.** 0→1→…→7 고정.
- **오케스트레이터가 새 로직·테스트·리팩토링을 직접 하지 않는다.** 전부 subagent에 위임한다(메인은 git/gh만).
- **AC 갭을 임의 보강하지 않는다.** 4단계 갭은 `ok:false`로 STOP.
- **머지·이슈 클로즈를 자동으로 하지 않는다.** 루프는 PR 오픈에서 끝난다.
- `git push --force`, `npm audit fix --force`, `git commit --no-verify`, E2E 코드 수정 회피 — 모두 금지.
