---
name: create-pr
description: 이슈 TDD 파이프라인의 **마지막 "통합" 단계**를 자동화하는 스킬 — 현재 브랜치의 커밋된 변경을 요약해 PR 제목·본문 초안을 만들고, 개발자 승인 후 **`npm run test:e2e`를 게이트로 세워** 통과할 때만 `git push` + `gh pr create`로 PR을 연다. E2E가 깨지면 PR을 **중단**하고 "단위 테스트 Red 재현 → 프로덕션 Green" 복구 절차를 안내한다(E2E 코드를 고쳐 통과시키는 회피는 금지). `/create-pr [기능명|이슈번호]`로 호출하며, 사용자가 "PR 만들어줘", "PR 올려줘", "PR 보내줘", "이거 머지하자", "create-pr", "지금 변경 PR로 올려줘", "이슈 N번 PR 생성" 같은 요청을 하면 — 'create-pr'를 직접 언급하지 않더라도 — 이 스킬을 사용할 것. 짝꿍 스킬 `security-review`의 클린 결과를 입력으로 받는 파이프라인 마지막 자리이며, **PR 초안·base 브랜치 승인** 1회 게이트를 거친다. 강제 푸시(`--force`)는 절대 쓰지 않고, 실패하면 임의로 복구하지 않고 개발자에게 보고한다.
---

# create-pr

이슈 단위 TDD 파이프라인(test-scenarios → tdd-red → tdd-green → ac-verifier → tdd-refactor →
security-review)의 **마지막 "통합" 단계**다. security-review까지 통과해 커밋된 변경을,
**PR로 올리기 직전에 한 번 더 거른다.** 핵심은 "그냥 PR을 여는 것"이 아니라 **E2E를 PR 직전 게이트로
세우는 것**이다.

**왜 E2E가 PR 직전 게이트인가?** 단위 테스트(`src/**/*.test.*`)는 `src/api/notes.ts`의 fetch를
모킹하므로 **API↔Context↔컴포넌트가 실제로 이어지는 통합 seam**을 건너뛴다. 그 seam은 실제 브라우저 +
실제 JSON Server로 도는 E2E만 잡는다. 단위가 전부 초록이어도 통합이 깨진 채 PR이 올라갈 수 있으므로,
PR을 만들기 전에 `npm run test:e2e`로 마지막 관문을 통과시킨다. **E2E가 깨지면 PR을 열지 않고**,
근본 원인을 단위 테스트로 되돌려 재현·수정하게 안내한다 — E2E 코드를 손봐서 초록으로 만드는 건 원인 회피다.

## 입력

- `$ARGUMENTS` = **기능명 또는 이슈 번호**(선택). PR 본문의 `Closes #N`·맥락 파악에 쓴다.
  숫자면 이슈 번호로, 그 외면 기능명으로 해석한다. 비어 있어도 동작한다(브랜치·커밋에서 유추).
- 실제 입력은 **현재 브랜치의 커밋된 변경**이다(security-review가 클린 처리한 상태를 전제).

## 산출물

- **PR 초안**: 현재 브랜치 변경 요약 → PR 제목(commitlint 형식)·본문 + 추론한 **base 브랜치**.
- E2E 통과 시 **생성된 PR URL**과, base가 main이 아닐 때의 **수동 이슈 클로즈 안내**.
- E2E 실패 시 **PR 미생성** + 근본 원인 복구 절차 안내.

## 비협상 제약

- **E2E 실패 시 PR을 만들지 않는다.** 그리고 **E2E 테스트 코드(`e2e/**`)를 고쳐 통과시키지 않는다\*\* —
  깨진 E2E는 통합 seam이 실제로 깨졌다는 신호이므로, 원인을 프로덕션 코드에서 고쳐야 한다(§3단계).
- **`git push --force`(및 `--force-with-lease`) 금지.** 히스토리를 덮어써 협업 브랜치를 깨뜨린다.
  푸시가 거부되면 임의로 강제하지 말고 개발자에게 보고한다.
- **PR 제목은 commitlint(Conventional Commits) 형식**을 지킨다 — 이 저장소는 **squash merge**라
  PR 제목이 곧 머지 커밋 subject가 되기 때문이다. `type: 한국어 subject`, 100자 이내(§환경).
- **실패 시 임의 복구 금지.** push·`gh pr create`가 실패하면(인증 누락, 충돌, 네트워크 등) 원인을
  그대로 보고하고 개발자 판단을 받는다. 리베이스·리셋·강제 재시도를 스스로 하지 않는다.

## 이 저장소의 맥락 (꼭 반영)

- **origin이 기본 repo다.** origin = `kamser0415/ccwork`(개인 fork), gh가 origin으로 set-default 되어
  있다(`gh-resolved = base`). PR은 origin 기준으로 생성된다. upstream(`frongt/ccwork`)으로 잘못 열지 않도록,
  `gh pr create` 시 base/head가 origin을 향하는지 확인한다.
- **E2E는 `npm run test:e2e` 하나면 된다.** `playwright.config.ts`의 webServer 설정이 Vite(5173)와
  JSON Server(3001)를 **자동 기동**한다(`reuseExistingServer` — 이미 떠 있으면 재사용). 별도로 `npm run dev`를
  띄울 필요 없다. 실패 리포트는 `npm run test:e2e:report`(= `playwright show-report`)로 연다.
- **PR base 관례**: 이슈 작업은 `--base feature/<spec>`(스펙/베이스 브랜치)로 PR → squash merge → 이슈 클로즈.
  최종 통합만 `main`. base는 **추론해서 제안하고 게이트에서 확인**한다(§1단계).
- **⚠️ 자동 이슈 클로즈는 "main 머지 + `Closes #N`"일 때만** 걸린다. base가 `feature/<spec>`(비-기본
  브랜치)면 자동 클로즈가 안 되므로, 머지 후 `gh issue close N` **수동 종료**를 안내한다.
- **커밋/PR 제목 형식**: `@commitlint/config-conventional`. 허용 type = `feat`/`fix`/`docs`/`style`/
  `refactor`/`perf`/`test`/`build`/`ci`/`chore`/`revert`. subject **한국어 허용**, header **100자 이내**,
  **대문자 영문으로 시작 금지**(한글 또는 소문자로).

---

## 실행 절차

### 1. 변경 요약 → PR 초안 (base 브랜치 추론 포함)

먼저 현재 상태와 base를 파악한다.

```bash
git branch --show-current                                  # 현재 브랜치
git status --short                                         # 미커밋 변경 유무
# base 추론: upstream 추적 브랜치 → 없으면 merge-base로 분기 지점 탐색
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "(추적 브랜치 없음)"
git branch -a                                              # 후보 base 브랜치 목록
```

- **base 브랜치 추론**: 현재 브랜치가 분기된 지점을 찾아 base를 **제안**한다.
  - 현재 브랜치가 이슈 브랜치(예: `feature/tag-create`)면 → 스택된 스펙 브랜치(예: `feature/tag-spec`)를 제안.
  - 현재 브랜치 자체가 스펙 브랜치(예: `feature/tag-spec`)면 → 최종 통합 대상 `main`을 제안.
  - 애매하면 `git merge-base HEAD <후보>`로 공통 조상을 비교해 가장 가까운 base를 고른다. **확정은 게이트에서.**
- **미커밋 변경이 있으면** 먼저 그 사실을 알린다. 이 스킬은 커밋된 변경을 PR로 만드는 자리이므로,
  미커밋 변경을 포함할지(commitlint 형식으로 커밋) / 제외할지 개발자에게 확인한다. **임의로 커밋하지 않는다.**
- 추론한 base 기준으로 이번 브랜치의 변경을 요약한다.

```bash
BASE=<추론한 base>            # 예: main 또는 feature/tag-spec
git log --oneline "$BASE"..HEAD                            # 이 브랜치의 커밋들
git diff --stat "$BASE"...HEAD                             # 변경 파일 개요
```

- **PR 제목 초안**: 브랜치의 핵심 변경을 commitlint 형식 한 줄로(예: `feat: 태그 쉼표 다중 입력·길이 정규화`).
  커밋이 하나면 그 subject를 재사용해도 좋다. **100자 이내, 대문자 영문 시작 금지.**
- **PR 본문 초안**: 아래 §PR 본문 템플릿을 채운다(개요·변경사항·테스트·관련 이슈).

### 2. ▣ 게이트 — PR 초안·base 승인

PR **제목 + 본문 + base 브랜치**를 함께 제시하고 묻는다:
"이 내용으로 PR을 만들까요? 제목/본문/**base 브랜치** 수정할 게 있으면 알려주세요."

**승인 전까지 push도 PR 생성도 하지 않는다.** base 브랜치는 잘못되면 엉뚱한 곳으로 머지되므로 반드시 확인받는다.
개발자가 수정을 요청하면 반영해 다시 제시한다.

### 3. E2E 실행 — `npm run test:e2e`

초안이 승인되면 PR을 만들기 **전에** 통합 관문을 통과시킨다.

```bash
npm run test:e2e
```

(Vite·JSON Server는 자동 기동되므로 별도 서버 실행 불필요 — §환경.)

- **전부 통과 →** 4단계로 진행.
- **하나라도 실패 →** **PR을 만들지 않고 중단**하고, 아래를 그대로 안내한다:

```
E2E 실패 — PR 생성을 중단합니다. 근본 원인을 고친 뒤 다시 /create-pr 하세요.

① 리포트 확인: npm run test:e2e:report → 실패 지점 확인
② 어느 레이어(API / 렌더링 / 로직)에서 깨졌는지 판별
③ 해당 단위 테스트에 케이스 추가 (Red)
④ 프로덕션 코드 수정 (Green) → 다시 /create-pr

⚠ E2E 코드를 고쳐 통과시키는 것은 금지 — 근본 원인 회피입니다.
```

여기서 스킬은 종료한다(수정은 tdd-red/tdd-green 사이클의 몫이다). E2E 코드를 손대지 않는다.

### 4. E2E 통과 → push & PR 생성

먼저 gh 인증·기본 repo를 확인한 뒤 push하고 PR을 연다.

```bash
gh auth status                                             # 인증 확인(실패 시 보고 후 중단)
git push -u origin HEAD                                    # 현재 브랜치 푸시(--force 금지)
gh pr create \
  --base "<승인된 base>" \
  --head "$(git branch --show-current)" \
  --title "<승인된 제목>" \
  --body "<승인된 본문>"
```

- push가 거부되면(예: 원격이 앞서 있음) **강제하지 말고** 원인을 보고한다(§제약).
- `gh pr create`가 실패하면(base 없음·권한 등) 명령과 에러를 그대로 보고한다.

### 5. 마무리 안내

- 생성된 **PR URL**을 보고한다.
- **base가 `main`이 아니면**: 자동 클로즈가 안 걸리므로 "머지 후 `gh issue close <N>`로 이슈를 수동
  종료하세요"를 안내한다(§환경). base가 `main`이고 본문에 `Closes #N`이 있으면 머지 시 자동 클로즈됨을 알린다.
- 다음 할 일(리뷰 요청·squash merge)을 한 줄로 짚는다.

## PR 본문 템플릿

```markdown
## 개요

<이 PR이 무엇을·왜 바꾸는지 1~3문장>

## 변경사항

- <핵심 변경 1>
- <핵심 변경 2>

## 테스트

- 단위: `npm test` 초록 (관련 테스트 <N>개)
- E2E: `npm run test:e2e` 통과

## 관련 이슈

Closes #<N>

<!-- base가 main이 아니면 자동 클로즈 안 됨 → 머지 후 `gh issue close <N>` 수동 종료 -->
```

## 주의

- **E2E는 통과의 증거이지 목표가 아니다.** 깨지면 프로덕션 코드를 고친다 — E2E나 단언을 느슨하게 바꿔
  초록으로 만들지 않는다(그러면 다음에 진짜 회귀를 놓친다).
- **base 브랜치 확인은 생략하지 않는다.** 스택 브랜치 전략에서 base를 틀리면 엉뚱한 브랜치로 머지된다.
- **`--force` 계열 push 금지**, 실패 시 임의 복구 금지 — 협업 히스토리를 지킨다.
- 한글 보고·PR 본문 등 `CLAUDE.md` 컨벤션을 지킨다.
