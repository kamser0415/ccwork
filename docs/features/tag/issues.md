# 태그 기능 이슈 (수직 슬라이싱)

> [`prd.md`](./prd.md)(상위 PRD)와 [`spec-fixed.md`](./spec-fixed.md)(구현 계약 정본)를 기반으로
> 태그 기능을 **수직 슬라이스 5개**로 분해한 실행 단위 문서다.
> 각 이슈는 "타입 → API → Context → lib/hook → 컴포넌트 → 영속"을 **관통**해, 사용자에게 보이는 능력
> 하나를 끝까지 전달한다(계층별 수평 분해 ❌). 첫 이슈는 walking skeleton이다.
> 인수 조건의 정본은 `spec-fixed.md` §5·§6·§8·§10이며, 충돌 시 spec-fixed가 우선한다.

## 개요

| 이슈 | 제목                                       | 핵심 산출물                                                                                          |
| ---- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| #1   | 기반: 단일 태그 추가·표시·저장 + 기존 호환 | `Note.tags`, `fetchNotes` 정규화, `lib/tags.ts`·`hooks/useTagInput.ts`·`TagInput`·`TagChipList` 골격 |
| #2   | 쉼표 다중 입력 + 길이/빈값 정규화          | `parseTagInput` 확장(split·trim·빈 제거·1~20자)                                                      |
| #3   | 대소문자 무시 중복 방지                    | `mergeTags`(원형 유지)                                                                               |
| #4   | 칩 × 개별 삭제                             | `removeTag` + 칩 `×` 버튼                                                                            |
| #5   | 저장 시 flush                              | `useTagInput.flush()` + `handleSave` 연결                                                            |

## 의존 순서

```
#1 기반(걷는 뼈대) ──┬─→ #2 쉼표/정규화 ──→ #3 중복 방지
                     ├─→ #4 칩 × 삭제 (독립)
                     └─→ #5 저장 flush (#2·#3 규칙 재사용)
```

- #1은 모든 이슈의 선행 조건이다(전 계층 골격을 신설).
- #3은 #2(`parseTagInput` 결과)를 전제로 한다. #4는 #1만 있으면 독립 진행 가능.
- #5는 #2·#3의 정규화·중복 규칙을 그대로 재사용한다.

## 커버리지 (추적성)

| 이슈 | User Story             | §10 인수 조건                                            | §8 엣지케이스                               |
| ---- | ---------------------- | -------------------------------------------------------- | ------------------------------------------- |
| #1   | US-2, US-5(폐기), US-6 | "기존 노트 열기/수정·저장 무오류", "저장 안 하면 폐기"   | 생성 모드 추가, `tags` 없는 노트, IME Enter |
| #2   | US-1                   | "쉼표+Enter 추가", "빈/공백/쉼표 불가", "20자 초과 불가" | `"a,,b"`·`"a, , b"`, 앞뒤 공백, 20자 초과   |
| #3   | US-4                   | "대소문자만 다른 중복 불가"                              | `"a, A"`, `React`+`react`                   |
| #4   | US-3                   | "칩 × 개별 삭제 후 저장 반영"                            | 카드 내 중첩 클릭 `stopPropagation`         |
| #5   | US-5                   | "입력 남긴 채 저장 시 flush 반영"                        | 미커밋 입력 병합                            |

> §10 인수 조건 8항목과 US-1~6이 모두 위 표에서 어떤 이슈엔가 매핑된다(누락 없음).

---

## 이슈 #1 — 기반: 단일 태그 추가·표시·저장 + 기존 노트 호환 (Walking Skeleton)

### 설명

태그 기능의 전 계층을 관통하는 최소 슬라이스. 단일 태그를 Enter로 추가 → 칩 표시 → 저장(폼 통합
PATCH/POST) → 재진입 시 그대로 보인다. `tags`가 없던 기존 노트는 `fetchNotes` 경계 정규화로 안전하게
열고, 저장하지 않고 취소하면 변경이 폐기된다. ADR-008 아키텍처 골격(`src/lib/tags.ts`,
`src/hooks/useTagInput.ts`, 무상태 `TagInput`·`TagChipList`)을 이 슬라이스에서 신설한다.
(쉼표 분리·길이·중복은 #2/#3, 칩 삭제는 #4, 저장 flush는 #5에서 확장한다.)

### 계층별 변경

- `src/types/note.ts`: `tags: string[]` **required** 추가.
- `src/api/notes.ts`: `fetchNotes`에 `return notes.map((n) => ({ ...n, tags: n.tags ?? [] }))` 경계 정규화.
  `createNote` 입력은 `Omit<Note, 'id' | 'createdAt' | 'updatedAt'>`라 `tags` 자동 포함, `updateNote`는 `Partial<Note>`라 변경 없음.
- `src/context/NotesContext.tsx`: `createNote` 시그니처를 `(title, content, tags: string[]) => Promise<void>`로
  확장(타입+구현), `api.createNote({ title, content, tags })` 호출. `updateNote`는 그대로.
- `src/lib/tags.ts`(신설): `parseTagInput`(이번엔 단일값 `trim` + 빈값 가드).
- `src/hooks/useTagInput.ts`(신설): 상태 `tags`/`tagInput`, 핸들러 `commit`(Enter 단일 추가)·`reset(initialTags)`.
- `src/components/TagInput.tsx`(신설, 무상태): `aria-label="태그 입력"`, `placeholder="태그 입력 (쉼표로 구분)"`,
  `onKeyDown` Enter commit + `e.nativeEvent.isComposing` 가드.
- `src/components/TagChipList.tsx`(신설, 무상태): `tags`를 `flex flex-wrap gap-2` 칩으로 렌더(`×` 버튼은 #4), `key={tag}`.
- `src/components/NoteEditor.tsx`: `useTagInput` 합성, 기존 `useEffect`(exhaustive-deps 비활성 유지)에서
  `reset(selectedNote?.tags ?? [])`, `handleSave`가 `createNote(title, content, tags)` /
  `updateNote(id, { title, content, tags })`.

### 완료조건 (Acceptance Criteria)

- [ ] 단일 태그를 Enter로 추가하면 칩으로 표시된다.
- [ ] 저장 후 재진입 시 태그가 그대로 보인다.
- [ ] `tags` 없던 기존 노트를 열고 수정·저장해도 오류가 없다(빈 배열로 시작).
- [ ] 저장하지 않고 취소하면 태그 변경이 폐기된다.
- [ ] `src/lib`·`src/hooks` 디렉터리와 `TagInput`·`TagChipList` 컴포넌트가 신설된다.
- [ ] `tags.test.ts`(`parseTagInput` 단일값/빈값) + `useTagInput` `renderHook`(commit/reset) 단위테스트가 통과한다.

### 시나리오 (Given–When–Then)

**추가·표시**

- **Given** 새 노트 편집 화면에서
- **When** `react`를 입력하고 Enter를 누르면
- **Then** `react` 칩 1개가 칩 목록에 표시된다.

**저장·영속**

- **Given** `react` 칩이 있는 편집 상태에서
- **When** "저장"을 누르고 그 노트를 다시 열면
- **Then** `react` 칩이 그대로 보인다.

**기존 노트 호환**

- **Given** `tags` 필드가 없는 기존 노트에서
- **When** 노트를 열어 제목을 수정하고 저장하면
- **Then** 오류 없이 저장되고 `tags`는 `[]`로 시작·영속된다.

**취소 폐기**

- **Given** 편집 중 `react` 칩을 추가한 상태에서
- **When** 저장하지 않고 "취소"를 누른 뒤 다시 열면
- **Then** 추가했던 태그가 사라져 있다.

**IME 가드**

- **Given** 한글 IME로 `리액트`를 조합 중일 때
- **When** 조합 확정용 Enter를 누르면
- **Then** 조합만 확정되고 태그로 커밋되지 않는다.

---

## 이슈 #2 — 쉼표 다중 입력 + 길이/빈값 정규화 (`parseTagInput` 확장)

### 설명

`parseTagInput`을 spec §5의 1~4단계로 확장한다 — 쉼표(`,`)로 `split` → 각 조각 `trim` → 빈 문자열 제거 →
길이 1~20자 검사(20자 초과 조각은 **무시 + `console.error('태그는 20자 이하만 가능합니다')`**, 나머지 조각은
정상 추가). 한 줄로 여러 태그를 동시에 추가할 수 있게 된다. (대소문자 무시 중복 제거는 #3.)

### 계층별 변경

- `src/lib/tags.ts`의 `parseTagInput`만 확장 + `tags.test.ts` 케이스 추가.
- 훅·컴포넌트는 이미 `parseTagInput`을 경유하므로 변경이 최소다.

### 완료조건 (Acceptance Criteria)

- [ ] `"react, study"` + Enter → 칩 2개가 추가된다.
- [ ] `"a,,b"`·`"a, , b"` → `["a", "b"]`(빈 조각 정리).
- [ ] 앞뒤 공백 `"  tag  "` → `"tag"`.
- [ ] 빈/공백/쉼표만 입력하면 아무 태그도 추가되지 않는다.
- [ ] 20자 초과 조각은 무시 + `console.error`만 남고 앱은 정상 동작한다(다른 조각은 추가).
- [ ] `tags.test.ts`에 위 케이스를 전수 단위테스트한다.

### 시나리오 (Given–When–Then)

**다중 추가**

- **Given** 편집 화면에서
- **When** `react, study`를 입력하고 Enter를 누르면
- **Then** 칩 2개(`react`, `study`)가 추가된다.

**빈 조각 정리**

- **Given** 편집 화면에서
- **When** `a,,b`(또는 `a, , b`)를 입력하고 Enter를 누르면
- **Then** 빈 조각은 제거되고 `["a", "b"]`만 추가된다.

**공백 trim**

- **Given** 편집 화면에서
- **When** `  tag  `를 입력하고 Enter를 누르면
- **Then** 양끝 공백이 제거된 `tag`가 추가된다.

**빈 입력 가드**

- **Given** 편집 화면에서
- **When** 빈 문자열/공백/`,`만 입력하고 Enter를 누르면
- **Then** 어떤 태그도 추가되지 않는다.

**길이 제약**

- **Given** 편집 화면에서
- **When** 21자 이상 조각과 정상 조각을 함께(`aaaaaaaaaaaaaaaaaaaaa, ok`) 입력하고 Enter를 누르면
- **Then** 긴 조각은 무시되고 `console.error`가 출력되며 `ok`만 추가된다.

---

## 이슈 #3 — 대소문자 무시 중복 방지 (`mergeTags`)

### 설명

spec §5 5단계. `mergeTags` 순수 함수로 (a) 같은 입력 내 중복과 (b) 기존 `tags`와의 중복을
**대소문자 무시**(`toLowerCase`) 비교로 제거한다. **첫 등장의 원형(casing)을 유지**하며(소문자 강제 변환 안 함),
반영은 함수형 업데이트 `setTags((prev) => [...prev, ...신규])`로 한다.

### 계층별 변경

- `src/lib/tags.ts`에 `mergeTags` 추가.
- 훅 `commit`이 `parseTagInput` → `mergeTags(prev, parsed)` 순서로 병합하도록 연결.
- `tags.test.ts`에 중복 케이스 추가.

### 완료조건 (Acceptance Criteria)

- [ ] 기존 `["React"]` + 입력 `"react, vue"` → `["React", "vue"]`(원형 유지, `react` 무시).
- [ ] 같은 입력 내 `"a, A"` → `["a"]`.
- [ ] 같은 노트에 대소문자만 다른 중복은 추가되지 않는다.
- [ ] `mergeTags` 단위테스트가 통과한다.

### 시나리오 (Given–When–Then)

**기존 태그 중복**

- **Given** 노트에 `React` 칩이 있는 상태에서
- **When** `react, vue`를 입력하고 Enter를 누르면
- **Then** `vue`만 추가되어 `["React", "vue"]`가 되고 `React`의 원형이 유지된다.

**입력 내 중복**

- **Given** 빈 태그 상태에서
- **When** `a, A`를 입력하고 Enter를 누르면
- **Then** 대소문자 무시 중복 제거로 `["a"]` 1개만 추가된다.

**대소문자 차이**

- **Given** 노트에 `study` 칩이 있는 상태에서
- **When** `STUDY`를 입력하고 Enter를 누르면
- **Then** 중복으로 간주되어 추가되지 않는다.

---

## 이슈 #4 — 칩 × 개별 삭제 (`removeTag`)

### 설명

spec §6 삭제. `TagChipList`의 각 칩 우측에 `×` 버튼을 두고, `handleRemoveTag(tag)`가
`setTags((prev) => prev.filter((t) => t !== tag))`로 해당 태그만 제거한다(순수 함수 `removeTag`로 추출).
칩은 카드 내부 중첩 클릭이므로 `e.stopPropagation()`으로 부모 핸들러를 막는다. 삭제 후 저장 시 영속에 반영된다.

### 계층별 변경

- `src/lib/tags.ts`에 `removeTag` 추가.
- `src/components/TagChipList.tsx`에 `×` 버튼 + `onRemove` prop.
- `src/hooks/useTagInput.ts`에 `remove` 구현, `NoteEditor`가 `onRemove`를 연결.
- `tags.test.ts`에 삭제 케이스 추가.

### 완료조건 (Acceptance Criteria)

- [ ] 칩의 `×`를 누르면 해당 태그만 제거된다.
- [ ] 삭제 후 저장하면 영속에 반영된다.
- [ ] `×` 클릭이 부모 카드 핸들러로 전파되지 않는다(`stopPropagation`).
- [ ] `removeTag` 단위테스트가 통과한다.

### 시나리오 (Given–When–Then)

**개별 삭제**

- **Given** `["react", "study"]` 칩이 있는 편집 상태에서
- **When** `react` 칩의 `×`를 누르면
- **Then** `react`만 제거되고 `["study"]`가 남는다.

**삭제 영속**

- **Given** 칩 하나를 `×`로 삭제한 상태에서
- **When** "저장"을 누르고 다시 열면
- **Then** 삭제가 영속에 반영돼 있다.

**이벤트 전파 차단**

- **Given** 칩이 카드 내부에 있는 상태에서
- **When** 칩의 `×`를 누르면
- **Then** 부모 클릭 핸들러가 호출되지 않는다.

---

## 이슈 #5 — 저장 시 flush (미커밋 입력 반영)

### 설명

spec §6 `handleSave`. 저장 직전 `useTagInput.flush()`로 미커밋 `tagInput`을 `parseTagInput` → `mergeTags`로
병합한 최종 배열(`finalTags`)을 반환받아 `createNote`/`updateNote`에 전달한다. `flush`는 입력창도 비운다.
flush 경로도 #2/#3의 정규화·중복 규칙을 동일하게 거친다.

### 계층별 변경

- `src/hooks/useTagInput.ts`의 `flush` 완성: 현재 `tags` + `parseTagInput(tagInput)`을 `mergeTags`로 병합해
  반환하고 `setTagInput('')`로 입력창을 비운다.
- `src/components/NoteEditor.tsx`의 `handleSave`가 `const finalTags = flush()` 후 `finalTags`로 전송.
- `useTagInput` `renderHook` 테스트에 flush 케이스 추가.

### 완료조건 (Acceptance Criteria)

- [ ] 입력창에 글자를 남긴 채 저장해도 그 입력이 태그로 반영된다.
- [ ] flush는 정규화·중복 규칙을 동일하게 거친다.
- [ ] flush 대상이 빈/공백이면 기존 `tags`가 그대로 유지된다.
- [ ] flush 단위테스트(`renderHook`)가 통과한다.

### 시나리오 (Given–When–Then)

**미커밋 반영**

- **Given** 칩 `["react"]`가 있고 입력창에 `study`가 미확정으로 남은 상태에서
- **When** Enter 없이 "저장"을 누르면
- **Then** `study`가 flush되어 `["react", "study"]`로 저장된다.

**flush 중복 처리**

- **Given** 입력창에 `react`(기존과 중복)가 남은 상태에서
- **When** 저장하면
- **Then** flush 시 중복 제거가 적용돼 중복이 추가되지 않는다.

**빈 flush**

- **Given** 입력창에 공백만 남은 상태에서
- **When** 저장하면
- **Then** 추가 없이 기존 `tags`만 저장된다.
