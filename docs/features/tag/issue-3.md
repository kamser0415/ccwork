# 이슈 #3 — [tag] 쉼표 다중 입력 + 길이/빈값 정규화 (parseTagInput)

> TDD 준비 산출물(`/test-scenarios 3`). 상단=확정 시그니처(게이트1 승인 완료), 하단=테스트 시나리오(게이트2).
> 계약 정본은 `spec-fixed.md` §5, 상위 맥락은 `prd.md`·`issues.md`. GitHub 이슈: origin #3.

## 확정 시그니처

### 순수 함수 (`src/lib/tags.ts`) — 시그니처 불변, 동작만 확장

```ts
parseTagInput(input: string): string[]
// #2 동작: input.trim() → 빈값이면 [] / 아니면 [trimmed]  (0~1개)
// #3 동작: spec-fixed §5의 1~4단계로 확장 (0~N개)
//   1) ',' 로 split
//   2) 각 조각 trim()
//   3) 빈 문자열 제거        → "a,,b", "a, , b" ⇒ ["a","b"]
//   4) 길이 검사 1~20자      → 20자 초과 조각은 "무시 + console.error", 나머지는 추가
//                             (하한 1자는 3단계에서 이미 보장 → 실질 검사는 상한 20자)
// #3 범위 아님: 대소문자 무시 중복 제거(§5 5단계) → 이슈 #4
```

### 에러 / 경계 동작 (#3 범위)

- **20자 초과 조각** → **무시 + `console.error('태그는 20자 이하만 가능합니다')`** (throw 아님, `alert` 금지 컨벤션).
  다른 조각은 정상 추가. **초과 조각마다** `console.error` 1회.
- **빈/공백/쉼표만** 입력 → 3단계 빈 조각 제거로 `[]` 반환(무동작).
- **정확히 20자** 조각 → 통과(상한 포함). **21자** 조각 → 무시+error.
- **중복** → #3에서는 제거하지 않음(#2처럼 허용). 대소문자 무시 중복 제거는 **#4**.

### 변경 범위

- **`src/lib/tags.ts`의 `parseTagInput` 본문만** 확장 + `tags.test.ts` 케이스 추가.
- `useTagInput`·`TagInput`·`TagChipList`·`NotesContext`·`api`·Props는 **변경 없음**(모두 `parseTagInput` 경유,
  `commit`의 `[...prev, ...parsed]` 스프레드가 이미 N개를 처리 → 다중 추가 자동 반영).

## 테스트 시나리오

> 형식: `[정상|경계|예외] parseTagInput - should [기대동작] when [조건]`. 계약(§5 1~4단계)에서 도출, #3 범위 한정.
> 모든 시나리오는 `src/lib/tags.test.ts` 케이스다(AC6). `console.error`는 `vi.spyOn(console, 'error')`로 단언.

### 정상

- [정상] parseTagInput - should return `["react","study"]` when input is `"react, study"` (쉼표로 여러 태그 분리) ✅
- [정상] parseTagInput - should return `["react"]` when input is `"react"` (단일 태그 — #2 동작 유지) ✅ <!-- #2 기존 테스트가 커버 -->
- [정상] useTagInput.commit - should append both tags (N=2) and clear tagInput when committing `"react, study"` ✅ <!-- AC1 갭 봉합: 커밋 스프레드 N=2 검증 -->

### 경계

- [경계] parseTagInput - should return `["a","b"]` when input is `"a,,b"` (연속 쉼표의 빈 조각 제거) ✅
- [경계] parseTagInput - should return `["a","b"]` when input is `"a, , b"` (공백-only 조각 제거) ✅
- [경계] parseTagInput - should return `["react","study"]` when input is `" react , study "` (조각별 앞뒤 공백 trim) ✅
- [경계] parseTagInput - should return `["tag"]` when input is `"  tag  "` (단일 조각 앞뒤 공백 trim) ✅ <!-- #2 "  react  " 테스트가 커버 -->
- [경계] parseTagInput - should return `[]` when input is `""` (빈 문자열) ✅ <!-- #2 기존 테스트가 커버 -->
- [경계] parseTagInput - should return `[]` when input is `"   "` (공백만) ✅ <!-- #2 기존 테스트가 커버 -->
- [경계] parseTagInput - should return `[]` when input is `","` (쉼표만 → 모든 조각 빈) ✅
- [경계] parseTagInput - should keep the chunk when a chunk is exactly 20 chars (상한 경계 20자 통과) ✅
- [경계] parseTagInput - should return `["a","a"]` when input is `"a,a"` (중복 미제거 — #4 소관, #3은 허용) ✅

### 예외

- [예외] parseTagInput - should ignore the >20-char chunk and console.error while keeping valid chunks when input is `"<21자>, ok"` → `["ok"]` (+ console.error 1회) ✅
- [예외] parseTagInput - should return `[]` and console.error when the only chunk exceeds 20 chars (긴 조각만 → `[]`) ✅
- [예외] parseTagInput - should console.error once per over-length chunk when input has two >20-char chunks (초과 조각마다 에러) ✅

### AC ↔ 시나리오 매핑

| AC 항목                                         | 커버 시나리오                                                                                                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 `"react, study"`+Enter → 칩 2개             | [정상] parseTagInput `"react, study"`→`["react","study"]` + [정상] useTagInput.commit **N=2 반영**(커밋 스프레드 검증) + `TagChipList` 2칩 렌더(#2) |
| AC2 `"a,,b"`·`"a, , b"` → `["a","b"]`           | [경계] `"a,,b"` + [경계] `"a, , b"`                                                                                                                 |
| AC3 앞뒤 공백 `"  tag  "` → `"tag"`             | [경계] `"  tag  "` + [경계] `" react , study "`                                                                                                     |
| AC4 빈/공백/쉼표만 → 추가 없음                  | [경계] `""` + [경계] `"   "` + [경계] `","`                                                                                                         |
| AC5 20자 초과 무시+`console.error`, 나머지 추가 | [예외] mixed(`<21>, ok`) + [예외] only-long + [예외] two-long                                                                                       |
| AC6 `tags.test.ts` 전수 단위테스트              | (구조적) 위 정상/경계/예외 전부가 `tags.test.ts` 케이스                                                                                             |

> 6개 AC 전부 ≥1 시나리오로 커버. #3은 `parseTagInput` 단위에 집중(이슈 명시: 훅·컴포넌트 변경 최소).
> AC1의 "칩 2개"는 파싱이 2개를 반환하면 #2에서 이미 통과한 `commit` 스프레드+`TagChipList` 렌더로 구성됨.
