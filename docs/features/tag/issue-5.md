# 이슈 #5 — [tag] 칩 × 개별 삭제 (removeTag)

> TDD 준비 산출물(`/test-scenarios 5`). 상단=확정 시그니처(게이트1 승인 완료), 하단=테스트 시나리오(게이트2).
> 계약 정본은 `spec-fixed.md` §6, 상위 맥락은 `prd.md`·`issues.md`. GitHub 이슈: origin #5.
> ⚠️ 문서 번호 스큐: `issues.md`는 이 작업을 로컬 #4("칩 × 개별 삭제")로 부르지만, 파일명은 GitHub 번호(#5)를 따른다. 내용 충돌 아님(issue-4.md와 동일한 스큐 규약).

## 확정 시그니처

### 순수 함수 (`src/lib/tags.ts`) — 신규 추가

```ts
removeTag(tags: string[], target: string): string[]
// 순수 함수(부수효과 없음). tags를 변형하지 않고 target을 제외한 새 배열 반환.
// 삭제 규칙(spec-fixed §6):
//   tags.filter((t) => t !== target)  — 정확 일치(===/!==, 대소문자 구분) 비교로 target만 제거.
//   근거: 칩은 이미 저장된 원형(canonical) 태그를 보유하므로, 칩의 정확한 값으로 제거하면 모호함이 없다.
//   parseTagInput/mergeTags의 대소문자-무시 규칙(§5)은 '추가' 경로 소관이며 '삭제'에는 적용하지 않는다.
// 반환:
//   - target이 tags에 있으면 그 원소만 빠진 새 배열.
//   - target이 없으면 원소 그대로인(동일 내용) 새 배열.
```

### 훅 확장 (`src/hooks/useTagInput.ts`) — 반환 타입에 `remove` 추가

```ts
export interface UseTagInputResult {
  tags: string[];
  tagInput: string;
  setTagInput: (value: string) => void;
  commit: () => void;
  remove: (tag: string) => void; // ← 이번 이슈 추가
  reset: (initialTags: string[]) => void;
}
// remove: (tag: string) => void
//   본문: setTags((prev) => removeTag(prev, tag))  — 함수형 업데이트로 해당 태그만 제거.
//   (spec §6의 setTags((prev) => prev.filter((t) => t !== tag))를 removeTag 순수 함수로 추출해 재사용.)
```

### 컴포넌트 Props (`src/components/TagChipList.tsx`) — `onRemove` 추가

```ts
export interface TagChipListProps {
  tags: string[];
  onRemove?: (tag: string) => void; // ← 이번 이슈 추가(선택적). 넘기면 각 칩에 × 버튼 렌더.
}
// - 각 칩 우측에 × 삭제 버튼을 두고, 클릭 시 onRemove(tag) 호출.
// - 중첩 클릭 가드: 버튼 onClick에서 e.stopPropagation() 후 onRemove(tag) 호출
//   (카드 내부라 부모 클릭 핸들러 전파 차단 — CLAUDE.md 중첩 클릭 컨벤션).
// - onRemove 미전달 시 × 버튼 없이 기존 무상태 표시(하위호환).
// - 내부 핸들러 네이밍: handleRemove(handleXxx 컨벤션), prop은 onRemove(onXxx 컨벤션).
```

### Context 액션 / 타입 — 변경 없음

- **없음.** 삭제는 로컬 `tags` 상태 조작(`removeTag`)일 뿐이며, 영속 반영은 기존 `updateNote({ tags })`
  저장 경로를 그대로 탄다(별도 API/Context 액션 신설 불필요). `Note` 타입·`api/notes.ts`·`NotesContext` 무변경.

### 에러 / 경계 동작

- **예외 경로 없음**: `removeTag`는 throw 하지 않고 `console.error`도 하지 않는다. 존재하지 않는 `target`을
  넘겨도 조용히 원본과 동일 내용의 배열을 반환한다(근거: spec-fixed §6은 삭제에 검증/에러 동작을 규정하지 않음).
- **불변성**: 입력 `tags` 배열을 변형하지 않고 항상 새 배열을 반환(순수 함수).
- **경계**: `([], "x")→[]` · `(["x"], "x")→[]` · `(["a","b"], "z")→["a","b"]`(변화 없는 새 배열).
- **대소문자 구분**: `(["React"], "react")→["React"]` — 삭제는 정확 일치라 대소문자 다르면 제거 안 함(추가 경로의 §5 규칙과 대비).

## 테스트 시나리오

> 형식: `[정상|경계|예외] removeTag - should [기대동작] when [조건]`. 계약(spec §6)에서 도출, #5 범위 한정.
> 핵심 3개 시나리오는 `src/lib/tags.test.ts`의 `removeTag` 단위 케이스(AC4). 컴포넌트/배선 AC(× 전파 차단·삭제 영속)는
> issue-4.md 규약과 동일하게 tdd-red 단계에서 `TagChipList.test.tsx`/`NoteEditor.test.tsx` 컴포넌트 테스트로 검증한다(아래 AC 매핑 참조).

### 정상

- [정상] removeTag - should return `["study"]` when tags=`["react","study"]`, target=`"react"` ✅
  (해당 태그만 제거되고 나머지는 순서 유지 — 이슈 시나리오 "개별 삭제" 직접 대응)

### 경계

- [경계] removeTag - should return `["a","b"]` (동일 내용 새 배열) when tags=`["a","b"]`, target=`"z"` (없는 태그 → 변화 없음) ✅
  · 겸: `(["x"], "x")→[]`(마지막 태그 제거 시 빈 배열) / `([], "x")→[]`(빈 입력) 경계도 함께 커버

### 예외

- [예외] removeTag - should NOT remove and return `["React"]` when tags=`["React"]`, target=`"react"` ✅
  (대소문자만 다른 target은 정확 일치가 아니므로 제거하지 않음 — 삭제는 case-sensitive, 추가의 §5 case-insensitive와 대비)
  · `removeTag`는 실패 경로(throw/`console.error`)가 없는 순수 함수이므로, 시그니처에 없는 에러 동작은 지어내지 않는다(근거: spec §6).

### AC ↔ 시나리오 매핑

| AC 항목 (이슈 #5 완료조건)                        | 커버 시나리오                                                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| AC1 칩의 `×`를 누르면 해당 태그만 제거된다        | [정상] `["react","study"]`,`"react"`→`["study"]` (순수 함수) + `TagChipList.test.tsx` `onRemove(tag)` 호출 검증(tdd-red) |
| AC2 삭제 후 저장하면 영속에 반영된다              | (배선) 삭제된 `tags` 배열이 기존 `updateNote({ tags })` 저장 경로로 전송됨 — `NoteEditor.test.tsx`로 검증(tdd-red)       |
| AC3 `×` 클릭이 부모 카드 핸들러로 전파되지 않는다 | (컴포넌트) `TagChipList`의 × 버튼 `e.stopPropagation()` — `TagChipList.test.tsx` 전파 차단 검증(tdd-red)                 |
| AC4 `removeTag` 단위테스트가 통과한다             | (구조적) 위 정상/경계/예외 3개 전부가 `src/lib/tags.test.ts`의 `removeTag` 케이스                                        |

> 4개 AC 전부 ≥1 시나리오/검증으로 커버. #5는 `removeTag` 순수 함수 단위(정상·경계·예외 3개)에 집중하고,
> 칩 × 렌더·전파 차단(AC3)과 삭제 영속(AC2)은 컴포넌트/배선 테스트로 tdd-red 단계에서 봉합한다(issue-4.md와 동일 분업).
