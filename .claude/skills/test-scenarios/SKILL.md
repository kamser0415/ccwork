---
name: test-scenarios
description: GitHub 이슈(기능) 단위로 ① 함수·Context 액션·컴포넌트 Props **시그니처를 확정**하고 ② 그로부터 **정상·경계·예외 테스트 시나리오를 도출**해 `docs/features/tag/issue-{N}.md`에 기록하는 TDD 준비 스킬. 구현 코드·테스트 코드는 절대 쓰지 않는다(계약과 시나리오만). `/test-scenarios <이슈번호>`로 호출하며, 사용자가 "이슈 N번 시그니처 확정", "테스트 시나리오 도출", "TDD 준비", "이 기능 계약부터 잡자", "AC를 시나리오로 뽑아줘" 같은 요청을 하면 — 'test-scenarios'를 직접 언급하지 않더라도 — 이 스킬을 사용할 것. **시그니처 승인**과 **시나리오 승인** 두 번의 사람 승인 게이트가 있고, 승인 없이는 다음 단계로 넘어가지 않는다.
---

# test-scenarios

하나의 GitHub 이슈(=구현할 기능 한 덩어리)를 **TDD로 들어가기 직전 단계**까지 준비한다.
순서는 늘 **시그니처 확정 → (승인) → 테스트 시나리오 도출 → (승인)** 이다.

**왜 시그니처를 먼저 박나?** 테스트는 "무엇을(계약)"에 대해 쓰는 것이지 "어떻게(구현)"에 대해 쓰는 게 아니다.
함수 이름·파라미터·반환 타입·에러 조건이 흔들리면 시나리오와 그 뒤의 red/green 사이클이 전부 흔들린다.
그래서 계약을 먼저 고정하고 사람이 승인한 뒤에야 시나리오를 뽑는다.

**이 스킬은 코드를 만들지 않는다.** 구현 함수 본문도, 테스트 코드도 쓰지 않는다.
산출물은 오직 **타입 수준 시그니처 선언**과 **자연어 시나리오 목록**뿐이다(실제 테스트 코드는 이후 TDD 단계에서).

## 입력

- `$ARGUMENTS` = **GitHub 이슈 번호** (origin `kamser0415/ccwork` 기준).
  태그 기능 이슈는 **#2~#6** 이다(#2=Walking Skeleton … #6=저장 flush). 예: `/test-scenarios 2`.
  `$ARGUMENTS`에서 **선행 정수만** 이슈 번호로 파싱한다(예: `"2 실행해보자"` → `2`). 뒤따르는 토큰은 무시.
- 이슈는 항상 `--repo kamser0415/ccwork`로 조회한다. `gh` 기본 repo가 upstream(`frongt`)으로
  드리프트하면 엉뚱한 옛 이슈를 읽으므로, **이 스킬의 모든 `gh` 호출엔 `--repo`를 명시**한다.

## 산출물

`docs/features/tag/issue-{N}.md` 한 파일 — **상단=확정 시그니처, 하단=테스트 시나리오**.
파일이 이미 있으면 해당 섹션만 갱신한다(이슈 본문/다른 메모는 보존).

## 전체 흐름

```
/test-scenarios N
  └─ 0. 준비: 이슈 N 조회·검증
     │
     ├─ 1. [fork] 시그니처 조사·확정  ──► 메인이 결과 수령
     │        (이슈 + prd.md + spec-fixed.md + 코드베이스 패턴)
     │
     ├─ ▣ 게이트 1: 시그니처를 개발자에게 제시 → 승인/수정 대기 ◀── 승인 전 정지
     │
     ├─ 2. 승인된 시그니처를 issue-{N}.md 상단에 기록
     │
     ├─ 3. 시그니처 → 시나리오 도출 (정상/경계/예외)
     ├─ 4. AC 대조: gh issue view의 AC가 전부 ≥1 시나리오로 커버되는지 확인·보강
     ├─ 5. 시나리오를 issue-{N}.md 하단에 기록
     │
     └─ ▣ 게이트 2: 시나리오를 개발자에게 제시 → 승인/수정 대기 ◀── 승인 전 종료 안 함
```

두 게이트는 사람과의 대화형 확인이므로 **이 스킬을 실행하는 메인 에이전트(오케스트레이터)가 직접** 잡는다.
무거운 코드베이스 조사만 fork에 위임해 메인 컨텍스트를 깨끗하게 유지한다.

---

## 0. 준비 — 이슈 조회·검증

```bash
N=$(printf '%s' "$ARGUMENTS" | grep -oE '^[0-9]+')   # 선행 정수만 이슈 번호로 추출
gh issue view "$N" --repo kamser0415/ccwork --json number,title,body,state
```

- 이슈가 없거나 `state`가 `CLOSED`거나 태그 기능(#2~#6)이 아니면 **진행하지 말고** 사용자에게
  무엇이 이상한지 알리고 멈춘다(잘못된 repo·번호일 가능성).
- 이슈 본문의 **AC(Acceptance Criteria) 체크박스 목록**을 그대로 보관한다 — §4에서 대조에 쓴다.

## 1. 시그니처 확정 — fork에 위임

`Agent` 도구를 `subagent_type: "fork"`로 띄워 아래를 시킨다. fork는 파일을 많이 읽되,
**돌려주는 것은 시그니처 제안뿐**이다(읽은 파일 덤프를 메인으로 가져오지 않는다).

fork에게 줄 지시(요지):

> 이슈 #N 구현에 필요한 **시그니처만** 확정해 돌려줘. 구현 코드·테스트 코드는 절대 쓰지 마.
> 근거 자료를 먼저 읽어라:
>
> - `gh issue view N --repo kamser0415/ccwork` (구현 범위·AC)
> - `docs/features/tag/prd.md`, `docs/features/tag/spec-fixed.md` (계약 정본 — 충돌 시 spec-fixed 우선)
> - `docs/features/tag/issues.md`의 해당 이슈 절 (계층별 변경 목록)
> - 기존 패턴: `src/api/notes.ts`, `src/context/NotesContext.tsx`, `src/components/*.tsx`, `src/types/note.ts`
>   그 다음 아래를 산출:
> - **함수 시그니처**: 이름·파라미터 타입·반환 타입 (예: `parseTagInput(input: string): string[]`)
> - **에러/경계 동작**: 어떤 입력에서 throw 하는지, 혹은 throw 대신 무시+`console.error`인지 (spec 근거 명시)
> - **컴포넌트 Props 타입**: `interface XxxProps { ... }` 형태 선언만
> - **Context 액션 시그니처 변경**: 예 `createNote(title, content, tags: string[]): Promise<void>`
>   산출은 §"시그니처 작성 규칙"의 기존 패턴을 반드시 따른다.

fork가 돌려준 제안을 메인이 수령한다. 부족하면 fork에 `SendMessage`로 보완 요청.

## ▣ 게이트 1 — 시그니처 승인

확정 시그니처를 **코드블록으로 보기 좋게** 사용자에게 제시하고, 명시적으로 묻는다:
"이 시그니처로 확정할까요? 수정할 부분 있으면 알려주세요." **승인(또는 수정 반영 후 재승인) 전까지
2단계로 넘어가지 않는다.** 수정 요청이 오면 반영해 다시 제시한다.

## 2. 시그니처 기록

승인된 시그니처를 `docs/features/tag/issue-{N}.md` **상단** `## 확정 시그니처` 섹션에 기록한다(아래 템플릿).

## 3. 시나리오 도출

확정된 **시그니처를 기준으로** 시나리오를 뽑는다(구현이 아니라 계약에서 출발). 각 시나리오는 한 줄:

```
[정상|경계|예외] 함수명 - should [기대 동작] when [조건]
```

- **정상(normal)**: 대표적인 happy path. 시그니처가 의도대로 동작하는 기본 경우.
- **경계(boundary)**: 한계값·빈 입력·최대 길이·중복 직전 등 "가장자리". (예: 빈 문자열, 20자/21자, 앞뒤 공백, 빈 배열)
- **예외(exception)**: 잘못된 입력/실패 경로 — throw 하거나 무시+`console.error` 하는 경우. (spec의 에러 동작과 일치)

함수마다 세 분류를 골고루 덮되, **시그니처에 없는 동작은 지어내지 않는다.** 근거가 spec/AC에 있어야 한다.

## 4. AC 대조 (누락 방지)

§0에서 보관한 AC 목록과 도출 시나리오를 대조한다:

- AC 항목 하나하나가 **최소 1개 이상의 시나리오로 커버**되는지 확인.
- 커버 안 된 AC가 있으면 그 AC를 위한 시나리오를 추가한다.
- 대조 결과를 issue-{N}.md의 시나리오 섹션 끝에 **AC↔시나리오 매핑 표**로 남겨 추적성을 확보한다.

## 5. 시나리오 기록

도출·보강된 시나리오를 `docs/features/tag/issue-{N}.md` **하단** `## 테스트 시나리오` 섹션에 기록한다.

## ▣ 게이트 2 — 시나리오 승인

전체 시나리오 목록과 AC 매핑 표를 사용자에게 제시하고 승인을 받는다. **승인 전까지 마무리하지 않는다.**
수정 요청은 반영 후 재제시. 승인되면 이번 이슈의 TDD 준비 완료를 보고한다(다음은 별도 TDD 단계).

---

## 시그니처 작성 규칙 (기존 패턴 준수)

이 저장소의 일관된 패턴을 그대로 따른다(CLAUDE.md §코드 컨벤션 근거):

- **API 함수**(`src/api/notes.ts` 패턴): `async` + 반환 `Promise<T>` 명시. 생성 입력은
  `Omit<Note, 'id' | 'createdAt' | 'updatedAt'>`, 수정은 `Partial<Note>`. 실패는 `throw new Error('Failed to ...')`.
- **Context 액션**(`src/context/NotesContext.tsx`): API와 **동사 통일**(`createNote`/`updateNote`/`deleteNote`).
  `useNotes()`로 접근. 시그니처 변경 시 타입+구현 시그니처 양쪽을 함께 적는다.
- **컴포넌트 Props**: 컴포넌트 바로 위 `interface XxxProps` 선언, 시그니처에서 구조분해. 인라인 타입·`React.FC` 금지.
  콜백 prop은 `onXxx`, 내부 핸들러는 `handleXxx`. 불리언은 `isXxx`, 진행 플래그는 `loading`/`saving`.
- **순수 함수**(`src/lib/tags.ts` 신설분): 입력→출력이 명확한 시그니처. 부수효과(예: `console.error`)가
  있으면 시그니처 설명에 명시.
- **훅**(`src/hooks/useTagInput.ts` 신설분): 반환 객체의 필드(상태+핸들러) 타입을 나열.

에러 케이스는 **"무엇이 throw인지 / 무엇이 무시+`console.error`인지"**를 spec 근거와 함께 분명히 구분한다
(이 프로젝트는 검증 실패를 대체로 `console.error`로 처리하고 `alert`은 쓰지 않는다).

## issue-{N}.md 템플릿

````markdown
# 이슈 #N — {제목}

> TDD 준비 산출물. 상단=확정 시그니처(게이트1 승인), 하단=테스트 시나리오(게이트2 승인).
> 계약 정본은 `spec-fixed.md`, 상위 맥락은 `prd.md`·`issues.md`.

## 확정 시그니처

### 함수 / 순수 함수

```ts
// 예: src/lib/tags.ts
parseTagInput(input: string): string[]
```

### Context 액션

```ts
// 예: src/context/NotesContext.tsx
createNote(title: string, content: string, tags: string[]): Promise<void>
```

### 컴포넌트 Props

```ts
interface TagInputProps {
  // ...
}
```

### 에러 / 경계 동작

- `parseTagInput`: 20자 초과 조각은 **무시 + `console.error('태그는 20자 이하만 가능합니다')`** (spec §5)
- ...

## 테스트 시나리오

### 정상

- [정상] parseTagInput - should return ["react"] when input is "react"

### 경계

- [경계] parseTagInput - should return [] when input is "" (빈 문자열)

### 예외

- [예외] parseTagInput - should ignore the chunk and console.error when a chunk exceeds 20 chars

### AC ↔ 시나리오 매핑

| AC 항목      | 커버 시나리오 |
| ------------ | ------------- |
| (AC1 텍스트) | [정상] ...    |
````

## 주의

- 구현 코드/테스트 코드 **금지**. 발견한 버그·개선점은 시그니처 노트로만 남긴다.
- 승인 게이트 2개를 건너뛰지 않는다 — 사람 승인이 이 스킬의 핵심 안전장치다.
- 시그니처는 **spec-fixed.md가 정본**이다. 코드/issues.md와 충돌하면 spec-fixed를 따르고, 충돌 사실을 게이트에서 알린다.
