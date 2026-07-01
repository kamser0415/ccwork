# 이슈 #2 — [tag] 기반: 단일 태그 추가·표시·저장 + 기존 노트 호환 (Walking Skeleton)

> TDD 준비 산출물(`/test-scenarios 2`). 상단=확정 시그니처(게이트1 승인 완료), 하단=테스트 시나리오(게이트2).
> 계약 정본은 `spec-fixed.md`, 상위 맥락은 `prd.md`(ADR-008)·`issues.md`. GitHub 이슈: origin #2.

## 확정 시그니처

### 1) 타입 (`src/types/note.ts`)

```ts
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[]; // ← 추가 (required, 항상 배열; 없으면 [])
  createdAt: string;
  updatedAt: string;
}
```

### 2) API 계층 (`src/api/notes.ts`)

```ts
fetchNotes(): Promise<Note[]>
//   내부 동작만 추가(경계 정규화): return notes.map((n) => ({ ...n, tags: n.tags ?? [] }))

createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note>
//   시그니처 텍스트 변경 없음. 단 Note.tags가 required가 되며 입력에 tags 필수화

updateNote(id: string, updates: Partial<Note>): Promise<Note>  // 변경 없음(Partial에 tags? 포함)
deleteNote(id: string): Promise<void>                          // 변경 없음
```

### 3) Context 액션 (`src/context/NotesContext.tsx`)

```ts
createNote: (title: string, content: string, tags: string[]) => Promise<void>; // tags 파라미터 추가
updateNote: (id: string, updates: Partial<Note>) => Promise<void>; // 변경 없음
// 구현: api.createNote({ title, content, tags }) 호출, setNotes((prev) => [...prev, newNote]) 함수형 업데이트
```

### 4) lib 순수 함수 (`src/lib/tags.ts`, 신설)

```ts
parseTagInput(input: string): string[]
// #2 동작: input.trim() → 빈 문자열이면 [], 아니면 [trimmed] (0개 또는 1개)
// #2 아님: 쉼표 split·길이 1~20자·console.error(#3), 대소문자 무시 중복 제거(#4)
//          → 시그니처(string → string[])는 그대로 두고 동작만 후속 이슈에서 확장
```

### 5) 훅 (`src/hooks/useTagInput.ts`, 신설)

```ts
function useTagInput(initialTags?: string[]): UseTagInputResult;

interface UseTagInputResult {
  tags: string[]; // 현재 태그 배열
  tagInput: string; // 입력창 값
  setTagInput: (value: string) => void; // 입력창 onChange용
  commit: () => void; // Enter 단일 추가: parseTagInput → append → 입력창 비움
  reset: (initialTags: string[]) => void; // 폼 동기화: tags=initialTags, tagInput=''
}
// #2는 commit·reset만. remove(#5)·flush(#6)는 후속 이슈에서 이 인터페이스에 추가
```

### 6) 컴포넌트 Props (무상태)

```ts
// src/components/TagInput.tsx (신설)
interface TagInputProps {
  value: string;
  onChange: (value: string) => void; // 훅의 setTagInput 연결
  onCommit: () => void; // Enter 커밋(훅의 commit). isComposing 가드는 내부 onKeyDown에서 처리
}
// 고정값: aria-label="태그 입력", placeholder="태그 입력 (쉼표로 구분)"

// src/components/TagChipList.tsx (신설)
interface TagChipListProps {
  tags: string[]; // flex flex-wrap gap-2 칩 렌더, key={tag}
  // onRemove?: (tag: string) => void;  ← × 삭제 버튼은 #5 (이번 이슈 없음)
}
```

### 7) 에러 / 경계 동작 (#2 범위)

- **빈/공백 입력 + Enter** → `parseTagInput`이 `[]` 반환, 아무 태그도 안 들어감(throw 아님). 근거 spec-fixed §5·§10.
- **한글 IME 조합 중 Enter** → `e.nativeEvent.isComposing` 가드로 commit 안 함. 근거 §6·§8.
- **`tags` 없는 기존 노트** → `fetchNotes` 정규화로 `[]` 보장, 무오류. 근거 §4.
- **throw/`console.error` 없음** — 20자 초과 `console.error`는 #3, 중복은 #4 소관이라 #2엔 등장하지 않음. `alert` 금지.

### 결정 / 주의 (게이트1 확정)

- **(A) 상태 소유 위치**: spec-fixed §6은 `NoteEditor` 인라인 `useState` 예시지만, 이슈/PRD **ADR-008(훅 아키텍처)**을 채택한다(확정 결정). spec-fixed §6 인라인 코드는 동작 예시로 간주.
- **(B) `parseTagInput` 범위**: #2는 **trim + 빈값 가드까지만**. §5의 split·길이·중복은 #3/#4.
- **(C) `parseTagInput` 위치**: `NoteEditor` 인라인이 아니라 **`src/lib/tags.ts`로 추출**(ADR-008).
- **(D)** `Note.tags` required화로 기존 `api.createNote({ title, content })`가 컴파일 에러 → (3) Context 변경이 이를 해소.

## 테스트 시나리오

> 형식: `[정상|경계|예외] 단위 - should [기대동작] when [조건]`. 시그니처/계약에서 도출, #2 범위 한정.

### 정상

- [정상] parseTagInput - should return `["react"]` when input is `"react"` ✅
- [정상] useTagInput.commit - should append the parsed tag and clear tagInput when tagInput is `"react"` ✅
- [정상] useTagInput.reset - should set tags to initialTags and clear tagInput when called with `["react","study"]` ✅
- [정상] TagInput - should call onCommit when Enter is pressed and not composing ✅
- [정상] TagInput - should call onChange with the new value when the user types ✅
- [정상] TagChipList - should render one chip per tag (key={tag}) when tags=`["react","study"]` ✅
- [정상] NotesContext.createNote - should call api.createNote with `{ title, content, tags }` when creating a note ✅
- [정상] NoteEditor(저장·영속) - should persist tags and show them on reopen when a tag is added and saved ✅

### 경계

- [경계] parseTagInput - should return `[]` when input is `""` (빈 문자열) ✅
- [경계] parseTagInput - should return `[]` when input is `"   "` (공백만) ✅
- [경계] parseTagInput - should return `["react"]` when input is `"  react  "` (앞뒤 공백 trim) ✅
- [경계] useTagInput.commit - should leave tags unchanged when tagInput is blank/whitespace ✅
- [경계] useTagInput.commit - should append a duplicate (no dedup in #2) when the same tag is committed twice (중복 방지는 #4) ✅
- [경계] useTagInput.reset - should clear tags to `[]` when called with `[]` (tags 없는 기존 노트) ✅
- [경계] TagInput - should NOT call onCommit when Enter is pressed during IME composition (`isComposing`) ✅
- [경계] TagChipList - should render nothing when tags=`[]` (빈 배열) ✅
- [경계] fetchNotes - should default tags to `[]` when a fetched note has no tags field ✅
- [경계] NoteEditor(취소 폐기) - should discard added tags when canceled without saving ✅
- [경계] 기존 노트 호환 - should save without error and start with tags=`[]` when opening a legacy note (no tags) and editing the title ✅
- [경계] NoteEditor(IME 통합) - should not add a chip when Enter is pressed during IME composition ✅ <!-- AC 검증 보강: 통합 레벨 IME 가드 -->
- [경계] NoteEditor(레거시 저장) - should call updateNote with `tags=[]` when saving a legacy note without adding tags ✅ <!-- AC 검증 보강: AC3 영속 인자까지 단언 -->

### 예외

- **#2 범위에는 throw/에러 경로가 없다.** 입력 검증 실패는 "무시·무동작"으로 흡수되고(빈값→`[]`), 20자 초과 `console.error`는 #3, 대소문자 중복은 #4 소관이다. 따라서 함수 레벨 예외 시나리오는 #2에 없음(지어내지 않음).

### AC ↔ 시나리오 매핑

| AC 항목                                                       | 커버 시나리오                                                                                  |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| AC1 단일 태그 Enter→칩 표시                                   | [정상] TagInput onCommit + [정상] useTagInput.commit + [정상] TagChipList render               |
| AC2 저장 후 재진입 시 유지                                    | [정상] NoteEditor(저장·영속)                                                                   |
| AC3 기존 노트 무오류·`[]` 시작                                | [경계] 기존 노트 호환 + [경계] fetchNotes 정규화                                               |
| AC4 저장 안 하고 취소 시 폐기                                 | [경계] NoteEditor(취소 폐기)                                                                   |
| AC5 `src/lib`·`src/hooks` + TagInput·TagChipList 신설         | (구조적 AC) parseTagInput·useTagInput·TagInput·TagChipList 시나리오가 곧 해당 파일 신설을 전제 |
| AC6 `tags.test.ts` + `useTagInput` renderHook 단위테스트 통과 | [정상/경계] parseTagInput(단일값·빈값·공백) + [정상/경계] useTagInput.commit/reset             |

> 6개 AC 전부 ≥1 시나리오로 커버. AC5만 동작이 아닌 구조 요건이라 별도 동작 시나리오 대신 다른 시나리오들의 전제 파일로 충족.
