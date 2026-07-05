# 태그 기능 PRD

> 상위 레벨 제품 요구 문서(뼈대). 구현 계약 수준의 상세·근거는 [`spec-fixed.md`](./spec-fixed.md),
> 원본 정의서는 [`spec-original.md`](./spec-original.md) 참고.
> 상태: **초안** · §3(기술 결정)은 추후 ADR로 채움.

## 1. 개요

노트에 **태그를 추가·삭제**하고, 노트 편집 화면(`NoteEditor`)에서 **칩(chip) 목록으로 확인**할 수 있다.
이 앱에는 별도 읽기 전용 상세 화면이 없어 `NoteEditor`가 상세/편집을 겸하므로, "상세에서 확인" 요구는
편집 화면 내 칩 목록으로 충족한다.

- **배경**: 강의/실습용 노트 앱의 CRUD를 한 단계 확장한다. 태그는 타입 → API → Context → 컴포넌트
  **전 계층을 함께 손봐야 하는** 실습 소재다.
- **성공 기준(요약)**: 편집 화면에서 태그를 추가·삭제하고 저장하면 영속되며, 중복·빈 값은 들어가지 않는다.
  세부 인수 조건은 [spec-fixed.md §10](./spec-fixed.md)을 정본으로 한다.

## 2. 사용자 스토리

> 형식: _As a 노트 작성자, I want …, so that …_ + 수용 기준(체크박스).

**US-1 — 태그 다중 추가**
As a 노트 작성자, I want 쉼표로 구분해 여러 태그를 한 번에 입력하고 싶다, so that 빠르게 분류할 수 있다.

- [ ] `"react, study"` + Enter → 칩 2개가 추가된다.
- [ ] 빈 조각(`"a,,b"`)·앞뒤 공백은 정리되어 들어간다.

**US-2 — 태그 확인**
As a 노트 작성자, I want 노트에 달린 태그를 칩 목록으로 보고 싶다, so that 어떤 태그가 붙었는지 한눈에 안다.

- [ ] 편집 화면 내용 아래에 현재 태그가 칩으로 표시된다.

**US-3 — 개별 삭제**
As a 노트 작성자, I want 칩의 `×`로 태그를 하나씩 지우고 싶다, so that 잘못 단 태그를 정리한다.

- [ ] 칩의 `×` 클릭 → 해당 태그만 제거되고 저장 시 반영된다.

**US-4 — 중복 방지**
As a 노트 작성자, I want 같은 태그가 중복으로 쌓이지 않길 바란다, so that 목록이 깔끔하게 유지된다.

- [ ] 대소문자만 다른 중복(`React`/`react`)은 추가되지 않는다(첫 입력 원형 유지).

**US-5 — 저장 영속**
As a 노트 작성자, I want "저장"을 누르면 태그가 노트와 함께 보관되길 바란다, so that 다시 열어도 그대로다.

- [ ] 저장 후 재진입 시 태그가 동일하게 보인다.
- [ ] 입력창에 글자를 남긴 채 저장해도 그 입력이 태그로 반영된다(flush).
- [ ] "저장"하지 않고 나가면 태그 변경도 폐기된다(제목·내용과 동일).

**US-6 — 기존 노트 호환**
As a 노트 작성자, I want 태그가 없던 기존 노트도 문제없이 열고 싶다, so that 데이터 마이그레이션 없이 쓸 수 있다.

- [ ] `tags` 필드가 없던 노트를 열고 수정·저장해도 오류가 없다(빈 태그로 시작).

## 3. 기술 결정 (ADR)

> 각 ADR은 `Context / Decision / Alternatives / Consequences` 4파트로 기록한다.
> **ADR-008(태그 UI 아키텍처)은 작성 완료(Accepted)**, ADR-001~007은 추후 작성(근거 요약은
> [spec-fixed.md §2·§3](./spec-fixed.md) 참고).

### ADR-001 — 데이터 구조 (`Note.tags: string[]`)

- **Context**: TODO
- **Decision**: TODO
- **Alternatives**: TODO
- **Consequences**: TODO

### ADR-002 — 저장 시점 (폼 통합 — 저장 버튼 PATCH)

- **Context**: TODO
- **Decision**: TODO
- **Alternatives**: TODO
- **Consequences**: TODO

### ADR-003 — 입력 방식 (쉼표 구분 입력 + 삭제 칩)

- **Context**: TODO
- **Decision**: TODO
- **Alternatives**: TODO
- **Consequences**: TODO

### ADR-004 — 타입 required + `fetchNotes` 경계 정규화

- **Context**: TODO
- **Decision**: TODO
- **Alternatives**: TODO
- **Consequences**: TODO

### ADR-005 — 중복 정책 (대소문자 무시 비교, 원형 유지)

- **Context**: TODO
- **Decision**: TODO
- **Alternatives**: TODO
- **Consequences**: TODO

### ADR-006 — 커밋 트리거 (Enter 전용 + 저장 시 flush)

- **Context**: TODO
- **Decision**: TODO
- **Alternatives**: TODO
- **Consequences**: TODO

### ADR-007 — 태그 제약 (길이 1~20자 / 허용 문자 / 개수 상한 없음)

- **Context**: TODO
- **Decision**: TODO
- **Alternatives**: TODO
- **Consequences**: TODO

### ADR-008 — 태그 UI 아키텍처: 커스텀 훅 + 순수 모듈 합성 (안 C)

- **Status**: Accepted (2026-06-27)

- **Context**:
  태그 입력·정규화·중복·flush 로직과 칩 UI를 어디에 둘지 결정해야 한다. 세 방식을 8개 기준(데이터 구조 /
  API / 상태관리 / 즉시 저장 / 컴포넌트 구조 / 기존 패턴 일관성 / 단위·e2e 테스트 / Playwright)으로 비교했다:
  **(A)** `NoteEditor` 인라인, **(B)** Context `addTag`/`removeTag`로 즉시 저장, **(C)** 커스텀 훅 + 순수
  모듈로 분리. 이 앱은 학습용이며 현재 테스트 0개·fetch 모킹 없음·테스트 선택자 없음 상태다. 팀(사용자)은
  **커스텀 훅 기반의 합성형(composition) 컴포넌트**와 **React 순수 API의 적극적 활용**을 선호하며,
  앞으로도 컴포넌트 로직을 훅으로 추출해 가는 방향을 원한다.

- **Decision**:
  **안 C를 채택한다.** 태그 도메인 로직을 두 계층으로 분리한다 —
  ① `src/lib/tags.ts`: 순수 함수(`parseTagInput` / `mergeTags` / `removeTag`),
  ② `src/hooks/useTagInput.ts`: 상태(`tags`, `tagInput`)와 핸들러(`commit` / `remove` / `flush` / `reset`)를
  캡슐화한 커스텀 훅.
  컴포넌트는 무상태 프레젠테이셔널(`TagInput`, `TagChipList`)을 두고, `NoteEditor`가 **훅 + 프레젠테이셔널을
  합성**한다. 저장은 spec-fixed.md대로 **폼 통합**(저장 버튼 시 `title`·`content`·`tags` PATCH)을 기본으로 하되,
  훅에 `onTagsChange` 콜백을 주입하면 즉시 저장으로 확장할 수 있는 여지를 남긴다.

- **Alternatives**:
  - **안 A (NoteEditor 인라인)**: 변경 최소·기존 패턴 일관성 ★★★. 그러나 로직이 컴포넌트에 묶여 단위 테스트가
    렌더·모킹에 의존한다.
  - **안 B (Context 액션 즉시 저장)**: 즉시 저장 UX를 유일하게 만족. 그러나 낙관적 갱신/롤백·생성 모드 분기로
    복잡도가 크고, "저장 버튼서 1회 PATCH"라는 기존 패턴과 어긋난다.
  - **안 C (채택)**: 저장 모델은 A와 동일(일관성 유지)하면서, 로직을 순수 함수·훅으로 분리해 테스트 용이성을
    극대화한다.

- **Consequences**:
  - (+) 정규화·중복·flush 규칙(spec §5)을 **UI·fetch 없이** `tags.test.ts`(순수)·`renderHook`(훅)으로 전수
    단위 테스트할 수 있다 — 팀의 테스트 선호와 일치.
  - (+) 합성형이라 `NoteEditor`는 얇아지고, 훅·프레젠테이셔널은 재사용·교체가 쉽다. 외부 상태 라이브러리 없이
    **React 순수 API(useState·커스텀 훅)** 만으로 구성된다.
  - (+) 즉시 저장이 필요해지면 훅의 `onTagsChange` 주입만으로 안 B 방향으로 점진 이동할 수 있다.
  - (−) `src/lib`·`src/hooks` 디렉터리를 신설한다 — 기존 코드베이스에 없던 추상화 한 단계가 늘어, 학습용
    단순함과는 트레이드오프가 있다.
  - (→) **선례화**: 앞으로 컴포넌트 로직은 커스텀 훅으로 추출하는 합성 패턴을 **기본 방향**으로 삼는다.

## 4. Out of Scope

이번 스코프에서 **명시적으로 제외**하는 항목. 아래 항목을 이번 이터레이션에서 구현하거나 대비한 설계를 미리 넣지 않는다.

### 검색/필터

- 태그 기반 노트 검색 UI 및 API.
- 다중 태그 AND/OR 필터링.
- 태그 클릭 시 해당 태그가 달린 노트만 보여주는 뷰.
- 제목/본문/태그를 결합한 통합 검색.

### 전역 태그 관리

- 전체 태그 목록(vocabulary)을 조회/관리하는 별도 화면.
- 태그 이름 일괄 변경(rename) 및 병합(merge).
- 태그 삭제 시 모든 노트에서 동시 제거(전역 cascade 삭제).
- 사용 중인 태그 수 집계/통계(most used, unused 등).

### 자동완성 및 추천

- 입력 중 기존 태그 목록 기반 autocomplete drop-down.
- 본문/제목을 분석한 태그 자동 제안(AI 추천 포함).
- 최근 사용 태그 빠른 선택 칩.

### 데이터 정규화 및 마이그레이션

- 별도 `tags` 컬렉션/테이블로의 정규화.
- 태그 ID 부여 및 참조 기반 저장 구조.
- 기존 노트를 대상으로 한 태그 데이터 이관 스크립트(`fetchNotes`의 빈 배열 기본값 외).

### 표시/스타일

- 사이드바(`NoteList`/`NoteItem`)에 태그 표시.
- 태그 색상·커스텀 스타일.
- 읽기 전용 별도 상세 화면(`NoteDetail`) 신설.

### 입력 UX 확장 (이번엔 제외)

- 결합형 Chip Input(텍스트 input과 칩 목록을 한 컨테이너로 결합) — 이번엔 `TagInput`·`TagChipList`를 분리.
- 쉼표(`,`) 입력 즉시 확정 — 이번엔 쉼표는 구분자, 확정은 `Enter`.
- Backspace로 마지막 칩 삭제 — 이번엔 칩 `×` 클릭으로만 삭제.
- 즉시 저장(칩 조작 시 바로 PATCH) — 폼 통합 저장 유지(ADR-008대로 훅 콜백으로 추후 확장 가능).

## 5. 용어 정의

| 용어                       | 정의                                                                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 태그(Tag)                  | 노트를 분류하기 위해 부여하는 짧은 문자열. `Note.tags: string[]`에 저장된다. trim된 비어있지 않은 문자열이며 쉼표(`,`)는 포함할 수 없다.                 |
| 칩(Chip)                   | 확정된 태그 1개를 시각적으로 표현하는 pill(`rounded-full`) 형태의 UI 요소. 우측 `×` 버튼으로 삭제한다.                                                   |
| 태그 입력(TagInput)        | 태그 텍스트를 입력받는 무상태 컴포넌트(`src/components/TagInput.tsx`). `aria-label="태그 입력"`, Enter로 확정. 칩 목록과 분리된 별도 컴포넌트.           |
| 칩 목록(TagChipList)       | 현재 `tags`를 칩으로 렌더하는 무상태 컴포넌트(`src/components/TagChipList.tsx`). 각 칩에 삭제 버튼을 둔다.                                               |
| 확정(Commit)               | 입력 중인 텍스트를 파싱해 `tags` 배열에 추가하는 동작. 트리거는 `Enter`(IME 조합 중 Enter는 무시). `useTagInput.commit()`.                               |
| 구분자(Delimiter)          | 한 번의 입력으로 여러 태그를 넣기 위한 구분 문자 `,`(쉼표). 예: `"react, study"` → 2개로 분리. 쉼표 자체는 태그에 포함되지 않는다.                       |
| 입력 정규화(parseTagInput) | 입력 문자열 → 태그 배열 변환 순수 함수(`src/lib/tags.ts`): `split(',')` → 각 `trim` → 빈 문자열 제거 → 길이 검사 → 같은 입력 내 대소문자 무시 중복 제거. |
| trim                       | 각 태그 조각 양끝의 공백 제거. trim 결과가 빈 문자열이면 확정하지 않는다.                                                                                |
| 최대 길이                  | 태그 1개당 허용되는 최대 문자 수. 20자. 초과 조각은 무시 + `console.error`(나머지 조각은 정상 추가).                                                     |
| 최대 개수                  | 노트 1개당 허용되는 최대 태그 수. 상한 없음(이번 스코프에서 의도적으로 두지 않음).                                                                       |
| 중복(Duplicate)            | 대소문자를 무시한 비교(`toLowerCase()`)에서 이미 존재하는 태그. 추가 시 무시하며, 먼저 입력된 원형(casing)을 유지한다.                                   |
| flush                      | 저장 시점에 입력창에 남은 미확정 텍스트를 파싱·병합해 누락을 막는 처리. `useTagInput.flush()`가 최종 `tags` 배열을 반환한다.                             |
| 폼 통합 저장               | 태그를 로컬 상태로 들고 "저장" 버튼을 누를 때 `title`·`content`와 함께 PATCH하는 방식(즉시 저장 아님).                                                   |
| useTagInput                | 태그 상태(`tags`, `tagInput`)와 핸들러(`commit`/`remove`/`flush`/`reset`)를 캡슐화한 커스텀 훅(`src/hooks/useTagInput.ts`).                              |
| 경계 정규화                | API 응답을 `tags: n.tags ?? []`로 보정해 모든 노트가 `tags` 배열을 갖게 하는 처리(`src/api/notes.ts`의 `fetchNotes`). 기존 `tags` 없는 노트와 호환.      |
| Placeholder                | 태그가 입력되지 않았을 때 input에 표시되는 안내 문구(`태그 입력 (쉼표로 구분)`).                                                                         |
| NoteEditor                 | 노트 생성/편집 폼 컴포넌트(`src/components/NoteEditor.tsx`). 태그 UI(칩 목록 + 입력)가 배치되는 위치이며 상세/편집을 겸한다.                             |
| createNote / updateNote    | 노트 생성/수정 API 함수(`src/api/notes.ts`). 태그는 이 호출에 포함되어 저장된다(`createNote(title, content, tags)`, `updateNote(id, { …, tags })`).      |
| 데이터 정규화(Normalize)   | 태그를 별도 `tags` 컬렉션/테이블로 분리해 ID로 참조하는 저장 구조. 이번 스코프에서는 사용하지 않는다(노트에 `string[]` 직접 보유).                       |
