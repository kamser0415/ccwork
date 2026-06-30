# 태그 기능 정의서 (확정본)

> 원본: [`spec-original.md`](./spec-original.md) — 본 문서는 Q&A 협의 + 코드베이스 대조 검토를 거쳐
> **구현 계약(implementation contract)** 수준으로 구체화한 확정본이다. 구현 시 이 문서를 따른다.

## 1. 기능 개요

노트에 태그를 추가·삭제하고, **노트 편집 화면(`NoteEditor`)에서 태그 목록을 확인**할 수 있다.
이 앱에는 별도의 읽기 전용 "상세 화면"이 없으므로 `NoteEditor`가 상세/편집을 겸한다 →
스펙의 "상세 화면에서 확인" 요구는 **`NoteEditor` 내 칩 목록 표시**로 충족한다.

## 2. 협의로 확정된 결정

| #   | 항목        | 결정                                                                        | 이유                                             |
| --- | ----------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| 1   | 데이터 구조 | `Note.tags: string[]` (노트 객체에 직접 보유)                               | 기존 단일 CRUD 흐름·JSON Server에 가장 단순      |
| 2   | 저장 시점   | **폼 통합** — "저장" 버튼 시 `title`·`content`·`tags`를 함께 PATCH          | 기존 폼·저장 흐름 유지, 새 API 액션 불필요       |
| 3   | 입력 방식   | **쉼표 구분 한 줄 입력**으로 추가 + 기존 태그는 **삭제 가능한 칩**으로 표시 | 빠른 다중 입력 + 스펙의 개별 삭제 요구 동시 충족 |

## 3. 보완 결정 (위임받아 결정한 나머지 — 근거 포함)

| 항목                   | 결정                                                                                       | 근거                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| 타입 required/optional | `tags: string[]` **required**로 두고, `fetchNotes`가 로드 시 `tags: n.tags ?? []`로 정규화 | 다운스트림에서 `note.tags` 항상 배열 보장, 방어 코드 최소화 |
| 대소문자 중복          | **대소문자 무시** 비교로 중복 차단, **저장은 첫 입력 원형(casing) 유지**                   | 사용자 입력 존중 + "React/react" 동시 저장 방지             |
| 커밋 트리거            | **Enter 키로만** 커밋. blur는 사용 안 함. 단 **저장 시 미커밋 입력값을 flush**해 누락 방지 | blur+Enter 이중 append 회피, 입력 손실도 방지               |
| 개별 태그 길이         | trim 후 **1~20자**. 20자 초과는 **무시 + `console.error`**                                 | 레이아웃 깨짐 방지, alert 금지 컨벤션 준수                  |
| 허용 문자              | 쉼표(`,`)를 제외한 임의 문자 허용(한글·영문·숫자·이모지 등). 별도 화이트리스트 없음        | 스펙은 "문자열로 저장"만 요구 — 문자 제한은 범위 외         |
| 태그 개수 상한         | **두지 않음**                                                                              | 학습용 범위 유지, 과한 제약 회피                            |
| `updatedAt` 갱신       | 태그만 바뀌어도 PATCH 시 `updatedAt` 갱신(기존 `updateNote` 동작 그대로)                   | 단순·기존 구현과 일치                                       |

## 4. 데이터 모델

```ts
// src/types/note.ts
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[]; // ← 추가 (항상 배열; 태그 없으면 [])
  createdAt: string;
  updatedAt: string;
}
```

- `db.json`의 각 note에 `"tags": ["react", "study"]` 형태로 함께 저장된다.
- **'문자열로 저장' 해석**: 각 태그는 `string`, 전체는 `string[]`(JSON 배열)로 저장한다.

### 기존 데이터 호환 (중요)

현재 `db.json`의 5개 노트에는 `tags` 필드가 없다. 타입은 `required`지만 서버 응답엔 없으므로,
**API 계층(`fetchNotes`)에서 경계 정규화**해 모든 노트가 `tags` 배열을 갖도록 보장한다
(타임스탬프를 API 계층에서 주입하는 기존 철학과 동일):

```ts
// src/api/notes.ts — fetchNotes
const notes: Note[] = await res.json();
return notes.map((n) => ({ ...n, tags: n.tags ?? [] }));
```

- 저장(생성·수정)은 항상 `tags` 배열을 보낸다 → 한 번 저장되면 `db.json`에 필드가 영속된다.
- PATCH 시에도 `NoteEditor`가 **현재 태그 배열 전체**를 보내므로 부분 갱신으로 인한 태그 손실은 없다.
- `db.json` 시드에 `"tags": []`를 미리 채워 넣는 것은 **선택**이다(정규화로 이미 안전함).

## 5. 정규화 · 중복 · 검증 규칙

태그 **추가 시점**(Enter 커밋 / 저장 시 flush)에 입력 문자열을 다음 순서로 처리한다.
이 로직은 순수 함수로 추출해 두 경로에서 재사용한다(예: `NoteEditor` 내 `parseTagInput`).

1. 쉼표(`,`)로 `split`
2. 각 조각 `trim()`
3. 빈 문자열 제거 → `"a,,b"`, `"a, , b"`는 `["a","b"]`
4. 길이 검사: 1~20자. 20자 초과 조각은 **무시 + `console.error('태그는 20자 이하만 가능합니다')`**
5. 중복 제거: **대소문자 무시** 비교로 (a) 같은 입력 내 중복, (b) 기존 `tags`와의 중복을 모두 제거.
   첫 등장의 **원형 문자열**을 유지(소문자 강제 변환 안 함). 예: 기존 `["React"]` + 입력 `"react, vue"` → `["React", "vue"]`

추가 결과는 `setTags((prev) => [...prev, ...신규])` 형태의 **함수형 업데이트**로 반영한다.

## 6. UI / 동작 (`NoteEditor`)

- **위치**: 내용(`textarea`) 아래, 버튼 영역 위에 `{/* 태그 */}` 구획을 둔다.
- **칩 목록**: 현재 `tags`를 `flex flex-wrap gap-2`로 렌더. 각 칩은 시맨틱 토큰 재사용
  (`bg-muted text-muted-foreground rounded-xl px-3 py-1` 등), 우측에 `×` 삭제 버튼. 키는 `key={tag}`.
- **추가 입력**: 한 줄 `<input>` (`placeholder="태그 입력 (쉼표로 구분)"`). `onKeyDown`에서 **Enter** 시
  §5로 파싱→병합→`setTagInput('')`. (한글 IME 조합 중 Enter는 `e.nativeEvent.isComposing` 가드 권장.)
- **삭제**: 칩의 `×` 클릭 → `handleRemoveTag(tag)`가 `setTags((prev) => prev.filter((t) => t !== tag))`.
  카드 내부 중첩 클릭이므로 부모 핸들러가 있으면 `e.stopPropagation()`.
- **상태**: `const [tags, setTags] = useState<string[]>([])`, `const [tagInput, setTagInput] = useState('')`.
- **폼 동기화**: 기존 `useEffect`(exhaustive-deps 비활성 유지)에 추가 —
  선택 노트면 `setTags(selectedNote.tags ?? [])`, 생성 모드면 `setTags([])`, 둘 다 `setTagInput('')`.
- **저장(`handleSave`)**: 저장 직전 **미커밋 `tagInput`을 flush**(파싱→병합)한 최종 배열을 사용한다.
  - 생성: `createNote(title, content, finalTags)`
  - 수정: `updateNote(selectedNoteId, { title, content, tags: finalTags })`
- **핸들러 네이밍**: `handleAddTags`(Enter), `handleRemoveTag`(칩 삭제) — `handleXxx` 컨벤션.
- **가드 절 순서**(빈 선택 등)는 기존 구조 그대로 유지.

## 7. 계층별 변경 상세

| 계층                            | 변경                                                                                                                                                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/note.ts`             | `tags: string[]` 추가.                                                                                                                                                                                                 |
| `src/api/notes.ts`              | `fetchNotes`에 정규화(`tags ?? []`) 추가. `createNote` 입력은 `Omit<Note,'id'\|'createdAt'\|'updatedAt'>`라 `tags` 자동 포함. `updateNote`는 `Partial<Note>`라 변경 없음.                                              |
| `src/context/NotesContext.tsx`  | `createNote` 시그니처를 `(title, content, tags: string[]) => Promise<void>`로 확장(타입+구현 모두), `api.createNote({ title, content, tags })` 호출. `updateNote`는 그대로(이미 `Partial<Note>`). 동사 통일 규칙 준수. |
| `src/components/NoteEditor.tsx` | §6대로 상태·핸들러·렌더·저장 구현.                                                                                                                                                                                     |

**호출처 검증(확인 완료)**: `createNote`/`updateNote`는 `NoteEditor`에서만 호출된다.
`NoteList`는 `{ notes, loading, error, deleteNote }`만 구독하므로 시그니처 확장의 영향이 없다.

## 8. 엣지케이스 처리표

| 입력/상황                             | 처리                                                           |
| ------------------------------------- | -------------------------------------------------------------- |
| `"a,,b"`, `"a, , b"` (빈 조각)        | trim 후 빈 문자열 제거 → `["a","b"]`                           |
| 앞뒤 공백 `"  tag  "`                 | `trim()` → `"tag"`                                             |
| 같은 입력 내 중복 `"a, A"`            | 대소문자 무시 중복 제거 → `["a"]`                              |
| 기존 태그와 중복 (`React`+`react`)    | 무시(추가 안 함)                                               |
| 20자 초과 태그                        | 무시 + `console.error` (다른 조각은 정상 추가)                 |
| 생성 모드(아직 id 없음)에서 태그 추가 | 로컬 `tags` 상태에만 쌓였다가 저장 시 `createNote`로 함께 전송 |
| `tags` 없는 기존 노트 열기/수정       | `fetchNotes` 정규화로 `[]` 보장 → 무오류                       |
| 저장 안 하고 "취소"                   | `title`/`content`와 동일하게 태그 변경도 폐기(의도된 동작)     |
| 한글 IME 조합 중 Enter                | `isComposing` 가드로 오커밋 방지                               |

## 9. 범위 외 (이번 스펙 아님)

- 태그로 **검색/필터링**, 전역 태그 **자동완성**, **사이드바(`NoteList`/`NoteItem`)에 태그 표시**,
  태그 **색상**, 태그 **개수 상한** 강제, 읽기 전용 별도 상세 화면(`NoteDetail`) 신설.

## 10. 인수 조건 (Acceptance)

- [ ] 편집 화면에서 쉼표 구분 입력 + Enter로 1개 이상 태그를 추가하고, 저장 후 다시 열면 그대로 보인다.
- [ ] 칩의 `×`로 개별 태그를 삭제하고 저장하면 반영된다.
- [ ] 같은 노트에 대소문자만 다른 중복 태그는 추가되지 않는다.
- [ ] 빈/공백/쉼표만으로는 태그가 추가되지 않는다.
- [ ] 20자 초과 태그는 추가되지 않고 콘솔에 에러만 남는다(앱은 정상 동작).
- [ ] 입력창에 글자를 남긴 채 "저장"해도 그 입력이 태그로 반영된다(flush).
- [ ] `tags` 필드가 없던 기존 노트를 열고 수정·저장해도 오류 없이 동작한다.
- [ ] "저장"을 누르지 않고 나가면 태그 변경도 폐기된다.

## 11. 검토 메모 (의도적으로 반영하지 않은 지적)

- **Context 액션 try/catch 부재**: 기존 `createNote`/`updateNote`/`deleteNote`는 try/catch 없이 에러를
  전파하고, `NoteEditor.handleSave`의 try/catch가 `console.error`로 처리하는 **기존 패턴을 그대로 따른다**.
  태그 때문에 Context에 try/catch를 새로 넣지 않는다.
- **`NoteItem`의 "삭제" 버튼 ↔ 태그 삭제 혼동, "취소" 용어**: 기존 UX 영역이며 이번 범위 밖이라 변경하지 않는다.
- **허용 문자 화이트리스트·태그 개수 제한**: 학습용 범위를 넘는 제약이라 의도적으로 두지 않는다(§3 근거).
