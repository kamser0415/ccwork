---
name: mermaid-diagram
description: 이 프로젝트의 src/ 구조를 정적 분석해 컴포넌트 의존성(가장 중요)과 상태 흐름을 Mermaid 다이어그램으로 시각화하고, docs/architecture/index.html로 저장한 뒤 브라우저로 자동으로 연다. 사용자가 "아키텍처/구조 시각화", "구조도", "컴포넌트 관계도", "의존성 그래프", "다이어그램으로 보고 싶다" 같은 요청을 하면 — 'mermaid'를 직접 언급하지 않더라도 — 이 스킬을 사용할 것.
---

# mermaid-diagram

`src/`를 분석해 **컴포넌트 의존성**과 **상태 흐름**을 Mermaid로 그린 단일 HTML(`docs/architecture/index.html`)을
만들고 브라우저로 연다. 결과는 코드에서 매번 새로 도출하므로, 코드가 바뀐 뒤 다시 실행하면 항상 최신 구조를 반영한다.

핵심 우선순위는 **컴포넌트 간 의존성 관계**이고, **상태 흐름**은 그 위에 얹는 보조 뷰다.

## 워크플로

### 1. src/ 분석

아래를 코드에서 직접 읽어 추출한다(하드코딩 금지 — 항상 실제 파일을 확인). 아래 "참조 다이어그램"은
현재 코드 기준 예상값일 뿐이니, 파일이 추가·삭제·이동됐는지 대조하고 차이가 있으면 갱신한다.

- **컴포넌트/모듈 목록**: `src/**/*.tsx`, `src/**/*.ts` (특히 `components/`, `App.tsx`, `main.tsx`, `context/`, `api/`, `types/`).
- **import & 렌더 관계**: 각 파일이 어떤 모듈을 import 하고 JSX로 렌더하는지. 이게 의존성 그래프의 엣지가 된다.
- **Context 구독**: `useNotes()`를 호출하는 컴포넌트 → Context로 향하는 점선 엣지.
- **상태 소유/전달**: `App.tsx`가 `useState`로 들고 있는 UI 선택 상태(`selectedNoteId`/`isCreating`)와
  props로 내려가는 값, `onXxx` 콜백으로 올라오는 이벤트.
- **데이터 경로**: `db.json` → JSON Server(:3001) → `api/notes.ts` → `NotesContext` → `useNotes()` → 컴포넌트.

> 빠른 추출 팁: `grep -rn "^import\|from '" src/`로 import 엣지를, `grep -rln "useNotes()" src/`로 Context 구독자를 모은다.

### 2. 다이어그램 작성 (2개)

둘 다 `flowchart`로 그린다. 계층은 `subgraph`로 묶어 가독성을 높인다.

1. **컴포넌트 의존성 (가장 중요)** — 노드는 파일/컴포넌트, 엣지는 관계로 구분한다:
   - 실선 `-->` : import & 렌더
   - 점선 `-. useNotes .->` : Context 구독(`useNotes()`)
2. **상태 흐름** — 두 흐름을 색으로 구분하는 것이 포인트다(CLAUDE.md의 "데이터=Context vs 선택상태=App 소유 분리" 원칙을 그림으로 드러냄):
   - 데이터 상태: 저장소 → 서버 → API → Context → 컴포넌트 (아래로)
   - 액션: 컴포넌트 → Context 액션(`create/update/deleteNote`) (위로, 점선)
   - UI 선택 상태: `App` → props(아래로), 콜백(위로)

### 3. HTML 생성

`assets/template.html`을 읽어 두 자리표시자를 치환한 뒤 `docs/architecture/index.html`로 쓴다
(디렉토리가 없으면 만든다):

- `%%COMPONENT_DIAGRAM%%` → 의존성 다이어그램 본문
- `%%STATE_DIAGRAM%%` → 상태 흐름 다이어그램 본문

치환 값은 `flowchart ...`로 시작하는 Mermaid 본문만 넣는다(코드펜스 ``` 없이). 들여쓰기가 어긋나지
않도록 각 줄은 행 맨 앞에서 시작시킨다. 템플릿은 Mermaid를 CDN(ESM)으로 로드하므로 별도 설치가 없다.

### 4. 브라우저 실행

OS를 감지해 기본 브라우저로 연다. 현재 환경(macOS)에서는 `open`을 쓴다.

```bash
# macOS
open docs/architecture/index.html
# Linux
xdg-open docs/architecture/index.html
# Windows (Git Bash)
start docs/architecture/index.html
```

생성 경로와 "브라우저를 열었다"는 사실을 사용자에게 알린다.

## 참조 다이어그램 (현재 코드 기준 — 실제 src/와 대조 후 갱신)

실제 분석 결과가 아래와 다르면 **아래가 아니라 코드가 정답**이다. 차이를 반영해 수정한다.

### 컴포넌트 의존성

```
flowchart TD
  subgraph entry["진입점"]
    MAIN["main.tsx"]
    APP["App.tsx"]
  end
  subgraph state["상태 계층"]
    CTX["context/NotesContext.tsx<br/>NotesProvider · useNotes"]
  end
  subgraph apilayer["API 계층"]
    API["api/notes.ts"]
    TYPE["types/note.ts"]
  end
  subgraph ui["컴포넌트"]
    LAYOUT["components/Layout.tsx"]
    LIST["components/NoteList.tsx"]
    ITEM["components/NoteItem.tsx"]
    EDITOR["components/NoteEditor.tsx"]
  end

  MAIN --> APP
  APP --> CTX
  APP --> LAYOUT
  APP --> LIST
  APP --> EDITOR
  LIST --> ITEM
  LIST -. useNotes .-> CTX
  EDITOR -. useNotes .-> CTX
  CTX --> API
  API --> TYPE
  ITEM --> TYPE
```

### 상태 흐름

```
flowchart TD
  DB[("db.json")]
  SERVER["JSON Server :3001"]
  API["api/notes.ts<br/>fetch · create · update · deleteNote"]
  CTX["NotesContext<br/>notes · loading · error"]
  HOOK["useNotes()"]
  LIST["NoteList"]
  EDITOR["NoteEditor"]
  APP["App.tsx<br/>selectedNoteId · isCreating"]

  DB <--> SERVER
  SERVER -->|fetch CRUD| API
  API -->|응답 노트| CTX
  CTX --> HOOK
  HOOK -->|notes| LIST
  HOOK -->|notes| EDITOR

  EDITOR -. create/updateNote .-> CTX
  LIST -. deleteNote .-> CTX

  APP -->|"props: selectedNoteId"| LIST
  APP -->|"props: selectedNoteId · isCreating"| EDITOR
  LIST -. onSelect .-> APP
  EDITOR -. onDone .-> APP

  classDef data fill:#1f3a5f,stroke:#7aa2f7,color:#e6e8ec;
  classDef uiState fill:#3a2f1f,stroke:#f7c97a,color:#e6e8ec;
  class DB,SERVER,API,CTX,HOOK data;
  class APP uiState;
```

## 주의사항

- **항상 src/를 다시 분석**한다. 위 참조도는 출발점일 뿐, 진실의 출처가 아니다.
- Mermaid 노드 라벨의 줄바꿈은 `\n`이 아니라 `<br/>`를 쓴다.
- 특수문자(`·`, `:`, `/`)가 든 엣지 라벨은 `|"..."|`처럼 따옴표로 감싼다.
- 인터넷 연결이 필요하다(Mermaid CDN). 오프라인 환경이면 사용자에게 알리고 로컬 번들 방식을 제안한다.
