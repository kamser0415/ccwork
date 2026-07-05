# 이슈 #4 — [tag] 대소문자 무시 중복 방지 (mergeTags)

> TDD 준비 산출물(`/test-scenarios 4`). 상단=확정 시그니처(게이트1 승인 완료), 하단=테스트 시나리오(게이트2).
> 계약 정본은 `spec-fixed.md` §5, 상위 맥락은 `prd.md`·`issues.md`. GitHub 이슈: origin #4.
> ⚠️ 문서 번호 스큐: `issues.md`/`issue-3.md` 계열은 이 작업을 로컬 #3으로 부르지만, 파일명은 GitHub 번호(#4)를 따른다. 내용 충돌 아님.

## 확정 시그니처

### 순수 함수 (`src/lib/tags.ts`) — 신규 추가

```ts
mergeTags(prev: string[], incoming: string[]): string[]
// 순수 함수(부수효과 없음). prev·incoming을 변형하지 않고 병합·중복제거된 새 배열 반환.
// prev    = 기존 태그(누적 결과, 이미 정규화됐다고 가정)
// incoming = 방금 parseTagInput으로 파싱한 신규 태그들
// 병합 규칙(spec-fixed §5 5단계):
//   (a) incoming 내부의 대소문자-무시 중복 제거 (첫 등장 원형 유지)
//   (b) prev 와 대소문자-무시(toLowerCase 비교)로 겹치는 incoming 항목 제외
//   → casing: 소문자 강제 변환 안 함. prev 원형 보존, 새 항목은 incoming 원형 그대로.
```

### 에러 / 경계 동작

- **예외 경로 없음**: `mergeTags`는 throw 하지 않고 `console.error`도 하지 않는다. 입력 검증(길이 1~20자·빈값)은
  `parseTagInput`(#3) 소관이고, `mergeTags`는 항상 정규화된 배열을 반환한다. 근거: spec-fixed §5(검증은 파싱 단계).
- **`prev` 재중복제거 안 함**: `prev`는 이미 중복 없는 누적 결과라고 가정. `mergeTags`는 `prev`를 그대로 두고
  `incoming`만 필터링해 뒤에 붙인다(구현 선택이며 계약엔 영향 없음).
- **경계**: `([], [])→[]` · `(["x"], [])→["x"]`(변화 없는 새 배열) · 중복 없으면 그대로 이어붙임.

### 연결 지점 (`src/hooks/useTagInput.ts`의 `commit`) — 시그니처 **불변**

```ts
// commit: () => void  (훅 반환 타입 UseTagInputResult 불변)
// 본문만 교체:
//   setTags((prev) => [...prev, ...parsed])        // 현재
//   setTags((prev) => mergeTags(prev, parsed))     // #4
// parseTagInput(input: string): string[] — issue-3 확정, 불변
```

### 새 컴포넌트 Props / Context 액션

- **없음.** 이 이슈 범위는 `mergeTags` 추가 + `commit` 본문 연결 + `tags.test.ts` 케이스뿐.
  `TagInput`/`TagChipList` Props, `NotesContext` 액션, `Note` 타입은 손대지 않는다.
  (`flush` 경로의 `mergeTags` 재사용은 이슈 #5(로컬)/GitHub #6 소관 — 범위 밖.)

## 테스트 시나리오

> 형식: `[정상|경계|예외] mergeTags - should [기대동작] when [조건]`. 계약(§5 5단계)에서 도출, #4 범위 한정.
> 모든 시나리오는 `src/lib/tags.test.ts` 케이스(AC4). AC가 원문(raw string)으로 기술한 케이스는
> `parseTagInput` 파싱을 거쳐 `mergeTags`의 배열 입력으로 매핑된다(연결은 `commit` 시나리오가 검증).

### 정상

- [정상] mergeTags - should return `["React","vue"]` when prev=`["React"]`, incoming=`["react","vue"]`
  (기존과 대소문자만 다른 `react` 무시, `React` 원형 유지, `vue` 추가) ✅
- [정상] mergeTags - should return `["a","b"]` when prev=`["a"]`, incoming=`["b"]` (중복 없는 일반 병합) ✅
- [정상] useTagInput.commit - should apply `mergeTags(prev, parseTagInput(input))` so committing `"react, vue"` with existing chips `["React"]` yields `["React","vue"]` (파싱→병합 연결 검증) ✅

### 경계

- [경계] mergeTags - should return `[]` when prev=`[]`, incoming=`[]` (양쪽 빈) ✅
- [경계] mergeTags - should return `["x"]` when prev=`["x"]`, incoming=`[]` (추가 없음, 새 배열) ✅
- [경계] mergeTags - should return `["a"]` when prev=`[]`, incoming=`["a","A"]` (입력 내부 대소문자 중복 제거, 첫 등장 `a` 유지) ✅
- [경계] mergeTags - should return `["study"]` when prev=`["study"]`, incoming=`["STUDY"]` (기존과 대소문자만 다른 중복 미추가) ✅
- [경계] mergeTags - should not mutate `prev` or `incoming` (순수 함수 — 원본 배열 불변, 새 배열 반환) ✅

### 예외

- **해당 없음** — `mergeTags`는 실패 경로가 없는 순수 함수(검증은 `parseTagInput` 소관). 시그니처에 없는
  throw/`console.error` 동작을 지어내지 않는다(근거: spec-fixed §5).

### AC ↔ 시나리오 매핑

| AC 항목                                            | 커버 시나리오                                                                       |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| AC1 `["React"]`+`"react, vue"` → `["React","vue"]` | [정상] prev=`["React"]`,incoming=`["react","vue"]` + [정상] `commit` 파싱→병합 연결 |
| AC2 `"a, A"` → `["a"]`                             | [경계] prev=`[]`,incoming=`["a","A"]` (원문 `"a, A"`는 `parseTagInput`→`["a","A"]`) |
| AC3 같은 노트에 대소문자만 다른 중복 미추가        | [경계] prev=`["study"]`,incoming=`["STUDY"]`                                        |
| AC4 `mergeTags` 단위테스트 통과                    | (구조적) 위 정상/경계 전부가 `src/lib/tags.test.ts` 케이스                          |

> 4개 AC 전부 ≥1 시나리오로 커버. #4는 `mergeTags` 순수 함수 단위에 집중하고, `commit` 연결 시나리오 1개로
> 파싱→병합 배선(AC1의 raw-string 경로)을 봉합한다.
