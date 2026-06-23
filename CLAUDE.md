# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 목적

강의/실습용 **노트 앱**. React 19 + TypeScript + Vite로 CRUD 흐름을 학습하는 것이 목적이며,
프로덕션 앱이 아니다. 일부 기능은 강의 진행 중 직접 추가하도록 **의도적으로 비워져 있다**:

- `src/types/note.ts`의 `Note`에는 `tags` 필드가 없다 (주석으로 "강의에서 추가할 것" 명시).
  태그 기능을 구현하려면 타입 → API → Context → 컴포넌트 순서로 전 계층을 손봐야 한다.
- 테스트 파일이 아직 하나도 없다 (Vitest 환경만 구성됨).

## 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | Vite(5173) + JSON Server(3001) **동시 실행** (concurrently) |
| `npm run server` | JSON Server만 실행 — 앱은 이게 떠 있어야 동작 |
| `npm run build` | `tsc` 타입체크 후 Vite 빌드 |
| `npm run lint` | ESLint 실행 (**`--fix` 포함** — 자동 수정됨) |
| `npm run format` | Prettier 전체 포맷 |
| `npm test` | Vitest 1회 실행 / `npm run test:watch` 워치 모드 |

단일 테스트 실행: `npx vitest run src/path/to/file.test.tsx` 또는 `npx vitest -t "테스트명"`.

## 아키텍처

데이터 흐름은 단방향이며 계층이 뚜렷하다. 한 기능을 바꾸려면 보통 여러 계층을 함께 봐야 한다:

```
db.json  ──(JSON Server :3001)──  src/api/notes.ts  ──  NotesContext  ──  컴포넌트
  (저장소)         REST API           fetch CRUD        전역 상태       useNotes()
```

**1. API 계층 (`src/api/notes.ts`)** — `fetch` 기반 순수 함수 4개(fetch/create/update/delete).
`API_URL`은 `http://localhost:3001` 하드코딩. `createdAt`/`updatedAt` ISO 타임스탬프를
**서버가 아닌 이 계층에서** 생성한다. 응답 `res.ok` 검사 후 `Error`를 throw.

**2. 상태 계층 (`src/context/NotesContext.tsx`)** — 노트 데이터의 **단일 출처(single source of truth)**.
- `notes`, `loading`, `error` 상태 + `createNote`/`updateNote`/`deleteNote` 액션을 제공.
- 마운트 시 `fetchNotes()` 1회 로드. 각 액션은 API 호출 **응답으로 받은 노트**로 로컬 `setNotes`를
  갱신한다(재요청 없음). 데이터에 접근하려면 항상 `useNotes()` 훅을 쓴다 — Provider 밖에서 호출 시 throw.

**3. UI 선택 상태는 Context가 아니라 `App.tsx`가 소유한다.** `selectedNoteId`, `isCreating`을
`useState`로 들고 있다가 props로 내려준다. 즉 **"어떤 노트가 선택됐나"(App) 와 "노트 데이터"(Context)는
분리**되어 있다. 새 기능 추가 시 이 경계를 지킬 것.

**4. 컴포넌트 (`src/components/`)** — 거의 프레젠테이셔널. `Layout`은 `sidebar`/`main` 슬롯을
props로 받는 구조. `NoteEditor`는 `selectedNoteId`/`isCreating` 변화에 맞춰 `useEffect`로 폼 상태를
동기화하며, 이 effect는 의도적으로 `exhaustive-deps`를 비활성화했다(주석 참고).

## 코드 컨벤션

기존 코드에서 일관되게 반복되는 규칙이다. 새 코드도 이 패턴을 따를 것.

### 네이밍

- **컴포넌트**: named export(`export function Xxx`). 단 `App.tsx`만 `export default`. 파일명은 PascalCase(`NoteItem.tsx`), API/타입 파일은 camelCase(`notes.ts`).
- **Props 타입**: 컴포넌트 바로 위에 `interface XxxProps` 선언하고 시그니처에서 구조분해
  (`function NoteItem({ note, isSelected }: NoteItemProps)`). 인라인 타입·`React.FC` 안 씀.
- **이벤트 핸들러**: 컴포넌트 내부 함수는 `handleXxx`(`handleSave`), 부모에서 받는 콜백 prop은 `onXxx`(`onSelect`).
  즉 `onXxx` prop을 `handleXxx`가 호출/구현하는 방향.
- **불리언**: `isCreating`/`isSelected`처럼 `is` 접두사. 단 진행 상태 플래그는 접두사 없이 `loading`/`saving`.
- **API ↔ Context 동사 통일**: API 함수와 Context 액션은 **같은 동사**를 쓴다 —
  `createNote`/`updateNote`/`deleteNote`. (Context는 `import * as api`로 임포트하므로 로컬 `createNote`와 `api.createNote`가 충돌하지 않는다.)
  읽기는 API의 `fetchNotes`뿐이며 Context는 마운트 시 1회 로드하므로 액션으로 노출하지 않는다.
  `delete`는 예약어라 단독 사용이 불가하므로 동사에 항상 `Note` 접미사를 붙인다.
- **map 콜백 인자**: 컴포넌트 JSX에서는 풀네임(`notes.map((note) => ...)`),
  Context의 `setNotes` 업데이터에서는 짧게(`prev.map((n) => ...)`).

### 컴포넌트 구현

- **컴포넌트 파일 맨 위 주석에 생성 날짜를 적는다**: 첫 줄에 `// 생성: YYYY-MM-DD` 형식으로
  그 파일을 만든 날짜를 적는다(예: `// 생성: 2026-06-23`). 새 컴포넌트를 만들 때 이 주석부터 작성한다.
- 함수형 컴포넌트 + 화살표 핸들러. 노트 데이터는 `useNotes()`로 가져오고, 선택 상태는 props로 받는다(§아키텍처 3).
- **가드 절(early return)을 맨 위에 모은다**: `loading → error → empty → 빈 선택` 순으로 각각 별도 JSX를 return하고,
  정상 JSX는 마지막에. (`NoteList`, `NoteEditor` 참고.)
- JSX 블록은 한글 주석으로 구획한다(`{/* 헤더 */}`, `{/* 제목 입력 */}`).
- 빈 값은 fallback 문자열로 표시(`note.title || '(제목 없음)'`).
- 카드 내부의 삭제 버튼 등 중첩 클릭은 `e.stopPropagation()`으로 부모 핸들러를 막는다.
- 리스트 렌더는 `key={note.id}`. 사용자 노출 텍스트·`alert`·주석은 모두 한국어.

### 상태 / 비동기

- 폼 입력은 컴포넌트 로컬 `useState`(`title`/`content`), 제출 중 플래그는 `saving`.
- 비동기 액션은 `try/catch/finally`로 감싸고 `finally`에서 플래그 해제.
  실패는 **`console.error`로만** 처리한다(`alert` 금지). Context의 마운트 로드 실패만 `setError`로 따로 처리.
- 상태 갱신은 항상 함수형 업데이트(`setNotes((prev) => ...)`).
- 입력 검증은 제출 시점에(`if (!title.trim()) { console.error(...); return; }`).

### API 호출

- 모든 함수 `async` + 반환 타입 `Promise<T>` 명시. 쓰기 요청은 `headers: { 'Content-Type': 'application/json' }` + `JSON.stringify` body.
- 타임스탬프는 API 계층에서 주입: POST는 `createdAt`/`updatedAt` 둘 다, PATCH는 `updatedAt`만 (`new Date().toISOString()`).
- 응답마다 `if (!res.ok) throw new Error('Failed to ...')` 후 `res.json()`. delete는 반환 `Promise<void>`.
- Context는 `import * as api from '../api/notes'` 네임스페이스 임포트로 `api.createNote(...)`처럼 호출.
- 입력 타입은 생성 `Omit<Note, 'id' | 'createdAt' | 'updatedAt'>`, 수정 `Partial<Note>` 패턴을 따른다.

## 스타일링 (Tailwind CSS v4)

- 별도 `tailwind.config.js` 없음. `@tailwindcss/vite` 플러그인 사용.
- 색상/폰트/반경 토큰은 `src/index.css`의 `@theme` 블록에 정의된 **시맨틱 토큰**으로 쓴다:
  `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-destructive` 등.
  raw 색상값(`bg-gray-100` 등) 대신 이 토큰을 사용할 것.

## 테스트 환경

Vitest + Testing Library, `vite.config.ts`에 통합 설정(`globals: true`, `jsdom`,
`setupFiles: ./src/test-setup.ts` → jest-dom matcher). 현재 API mocking 설정은 없으므로
Context/컴포넌트 테스트 시 `src/api/notes.ts`의 fetch를 직접 모킹해야 한다.
