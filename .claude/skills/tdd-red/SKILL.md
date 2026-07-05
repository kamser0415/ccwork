---
name: tdd-red
description: 승인된 테스트 시나리오(`docs/features/tag/issue-{N}.md`)를 **실행되며 실패하는(RED) 테스트 코드**로 옮기는 TDD 1단계 스킬. Vitest + React Testing Library로 시나리오 1개당 테스트 1개를 작성하고, **테스트가 실제로 실행되어 명확한 이유로 빨개지는지** 확인한다. 대상 파일이 없을 때만 `throw new Error('not implemented')` 골격을 만들고(실제 구현 로직은 쓰지 않음), 이미 있는 파일은 건드리지 않는다. `/tdd-red <이슈번호>`로 호출하며, 사용자가 "실패하는 테스트부터 짜자", "TDD red", "시나리오를 테스트로", "이슈 N번 테스트 코드 작성"(아직 구현 전) 같은 요청을 하면 — 'tdd-red'를 직접 언급하지 않더라도 — 이 스킬을 사용할 것. 짝꿍 스킬 `test-scenarios`가 만든 시나리오를 입력으로 받는다(시나리오가 없으면 먼저 그쪽을 돌릴 것).
---

# tdd-red

TDD의 **RED** 단계만 담당한다. 승인된 시나리오를 **지금은 반드시 실패하는** 테스트로 옮긴다.
실제 구현(GREEN)은 다음 단계의 몫이며, 이 스킬은 동작 로직을 쓰지 않는다.

**왜 실패부터 쓰나?** 테스트가 "올바른 이유로" 빨갛게 떠야, 그 테스트가 ①행동이 아직 없음을 확인하고
②**테스트 자체가 믿을 만함**(배선·단언이 옳아서, 행동이 생기면 통과할 것)을 증명한다. 구현부터 짜면
테스트가 구현을 베껴 "항상 통과"하는 가짜가 되기 쉽다. 그래서 시나리오를 테스트로 옮기고 → 실행해
실패를 눈으로 확인하고 → 그 실패가 "행동 미구현" 때문인지(테스트 버그가 아닌지) 검증하는 순서를 지킨다.

## 입력

- `$ARGUMENTS` = **GitHub 이슈 번호**. 선행 정수만 파싱한다(예: `"2 해줘"` → `2`).
- 입력 정본: `docs/features/tag/issue-{N}.md`의 **`## 확정 시그니처`**(대상 파일·타입)와
  **`## 테스트 시나리오`**(정상/경계/예외 불릿). 이 파일이 없으면 멈추고 `test-scenarios`부터 돌리라고 안내한다.

## RED의 의미 — "테스트가 실행되어, 올바른 이유로 실패"

좋은 RED는 단순한 "빨강"이 아니라 **테스트가 실제로 실행된 뒤 명확한 이유로 실패**한 것이다.

그래서 **import 오류(모듈 부재)는 RED의 최종 상태로 두지 않는다.** 테스트가 한 줄도 실행되지 않으면
"행동이 없어서 빨강"인지 "테스트가 틀려서 빨강"인지 구분할 수 없고, 단언이 옳은지도 검증 못 한다.
대상 파일이 없으면 **throw 골격을 만들어 테스트가 실행되게** 한 뒤(§골격 규칙), 다음 둘 중 하나로 실패시킨다:

1. **`Error: not implemented`** — 골격(미구현)을 호출해서 던짐. 가장 흔한 RED.
2. **단언 실패** — 이미 존재하는 파일이 동작을 아직 안 해서 `expect`가 깨짐(예: `fetchNotes` 정규화 미적용).

**false RED**(고쳐야 할 것)는 테스트 자체 버그(오타·잘못된 import 경로·셀렉터 오타)다. 진짜 RED는
`not implemented`/단언 실패처럼 _예측한_ 이유로, false RED는 _예상 밖_ 에러/스택으로 떠서 구분된다.
매 실행마다 실패 메시지를 읽고 둘을 가른다.

(참고: 이 프로젝트는 Vitest가 esbuild로 타입만 제거하므로 타입 에러로는 실패하지 않는다. 실패는 런타임 호출/단언에서 난다.)

## throw 골격(skeleton) 규칙

테스트가 가리키는 대상 단위가 **아직 없을 때만** 최소 골격을 만든다 — 매번 만들지 않는다.

- **대상 파일이 없으면**: 확정 시그니처대로 파일을 만들고 본문은 `throw new Error('not implemented')`.

  ```ts
  // src/lib/tags.ts (RED 골격 — 행동 없음)
  export function parseTagInput(_input: string): string[] {
    throw new Error('not implemented');
  }
  ```

  ```tsx
  // 훅·컴포넌트도 호출/렌더 시 던지게 둔다
  export function useTagInput(_initialTags?: string[]): never {
    throw new Error('not implemented');
  }
  export function TagInput(_props: TagInputProps) {
    throw new Error('not implemented');
  }
  ```

- **반드시 throw, 기본값 반환 금지**: `return []` 같은 기본값은 일부 시나리오를 *우연히 통과*시켜
  false GREEN을 만든다(예: `parseTagInput('') === []`가 빈-반환 스텁에 통과). throw는 전부 실패시켜 이를 막는다.
- **이미 있는 파일은 손대지 않는다**: 그 단위는 테스트가 실행되며 단언에서 빨개진다(이미 진짜 RED).
  (드물게 파일은 있는데 export 심볼만 없으면, 그 심볼의 throw 스텁만 추가한다 — 같은 원리.)
- **타입 선언 추가는 허용**(`Note.tags: string[]` 등). 행동이 아니라 **계약 표면**이라 RED에 둬도 된다.

골격은 버리는 scaffolding이 아니다. **GREEN에서 이 파일의 throw 본문을 실제 로직으로 교체**하면 그대로
실제 파일이 된다(파일·시그니처는 유지, 본문만 바뀜). 즉 RED→GREEN은 "삭제 후 재생성"이 아니라 **"본문 채우기"** 다.

## 비협상 제약

- **생성 대상은 ①테스트 파일 + ②없는 대상 파일의 throw 골격 + ③필요한 타입 선언**뿐. 그 외 `src/`는 안 건드린다.
- 골격·스텁 본문은 **반드시 `throw`**, 실제 동작 로직은 쓰지 않는다(그건 GREEN).
- **이미 존재하는 파일의 동작/시그니처는 수정하지 않는다.**
- 시나리오 **1개 ↔ 테스트 1개**로 추적성 유지. 시나리오에 없는 동작은 테스트하지 않는다(지어내기 금지).

## 테스트 파일 위치 (시그니처에서 도출)

테스트는 **대상 파일과 같은 디렉터리**에 `{파일명}.test.ts(x)`로 둔다. 위치는 **시그니처에 적힌
대상 파일을 보고 결정**한다(아래는 #2 기준 예시 — 하드코딩 말고 시그니처 따라갈 것).

| 시나리오의 단위                 | 대상 구현 파일(시그니처)         | 테스트 파일                           | 골격 필요?         |
| ------------------------------- | -------------------------------- | ------------------------------------- | ------------------ |
| `parseTagInput` 등 순수 함수    | `src/lib/tags.ts`                | `src/lib/tags.test.ts`                | 파일 없으면 O      |
| `useTagInput` 훅                | `src/hooks/useTagInput.ts`       | `src/hooks/useTagInput.test.ts`       | 파일 없으면 O      |
| `TagInput` 컴포넌트             | `src/components/TagInput.tsx`    | `src/components/TagInput.test.tsx`    | 파일 없으면 O      |
| `TagChipList` 컴포넌트          | `src/components/TagChipList.tsx` | `src/components/TagChipList.test.tsx` | 파일 없으면 O      |
| `fetchNotes`/`createNote` (API) | `src/api/notes.ts`               | `src/api/notes.test.ts`               | 존재 → X(단언 RED) |
| Context 액션                    | `src/context/NotesContext.tsx`   | `src/context/NotesContext.test.tsx`   | 존재 → X(단언 RED) |
| `NoteEditor` 통합 시나리오      | `src/components/NoteEditor.tsx`  | `src/components/NoteEditor.test.tsx`  | 존재 → X           |

- `describe` 블록은 **함수/컴포넌트 단위**로 묶는다: `describe('parseTagInput', () => { ... })`.
- `it`/`test` 이름은 시나리오의 **`should [기대동작] when [조건]`** 부분을 그대로 쓴다.
  카테고리(정상/경계/예외)는 필요하면 중첩 `describe` 또는 주석으로만 표기(테스트 이름엔 안 넣음).

## 이 프로젝트의 테스트 환경

- Vitest 3, `globals: true` → `describe`·`it`·`expect`·`vi`를 **import 없이** 쓴다(`vite.config.ts`).
- 환경 `jsdom`, setup은 `@testing-library/jest-dom`(`toBeInTheDocument` 등 사용 가능).
- **RTL 16 + user-event 14 설치됨.** `import { render, screen, renderHook, act } from '@testing-library/react'`,
  `import userEvent from '@testing-library/user-event'`.
- 실행: 단일 파일 `npx vitest run <파일>`, 전체 `npm test`(= `vitest run`). 워치는 `npm run test:watch`.
- **API mocking 설정이 없다.** 네트워크를 타는 단위는 직접 모킹해야 한다(§mock 레시피).

## 실행 절차

### 0. 준비

- `$ARGUMENTS`에서 N 파싱 → `docs/features/tag/issue-{N}.md`를 읽어 시그니처·시나리오를 확보.
- 시나리오를 **단위별로 그룹핑**하고, 각 단위의 대상 파일이 **존재하는지** 확인해 골격 필요 여부를 가른다.

### 1. 단위 단위로 작성 → 즉시 RED 확인 (반복)

한 단위(하나의 `describe`)마다:

1. 대상 구현 파일이 **없으면 throw 골격을 먼저 만든다**(§골격 규칙). 있으면 건드리지 않는다.
2. 시나리오대로 테스트를 작성한다.
3. 그 **파일만** 실행한다: `npx vitest run src/lib/tags.test.ts`
4. **테스트가 실행되어** `not implemented`(골격) 또는 단언 실패(기존 파일)로 빨간지 확인한다.
   import 오류·예상 밖 에러로 멈췄으면 골격/테스트를 고쳐 다시 실행한다(false RED 제거).

- 통과(GREEN)가 나오면 의심하라 — 골격이 `throw`가 아니거나 단언이 항상 참인 것이다. 바로잡는다.
- (시나리오를 "하나씩" 추가하며 확인해도 되지만, **파일 단위 실행**이 실무적으로 효율적이다.)

### 2. 전체 RED 확인

모든 단위를 옮긴 뒤 전체를 돌린다: `npm test`

- **새로 추가된 테스트가 전부 빨갛고**, 각 실패가 `not implemented`/단언 실패인지 본다.
- 통과가 하나라도 있으면 false GREEN을 색출해 고친다.

### 3. 보고

생성한 테스트 파일·골격 파일 목록, 단위별 테스트 수, "전부 RED", 그리고 **각 RED 이유(not implemented / 단언 실패)**
와 false RED·false GREEN이 없음을 요약한다. 다음 단계(GREEN: throw 본문 채우기 + 기존 파일 동작 변경)로 넘긴다.

## mock 레시피 (경계별 — 필요한 만큼만)

대부분의 단위는 **mock이 필요 없다.** 네트워크/Context를 타는 것만 모킹한다.

- **순수 함수·훅·프레젠테이셔널 컴포넌트**: mock 불필요. 콜백 prop은 `vi.fn()` 스파이로 넘겨 호출 여부 단언.
- **API 계층(`src/api/notes.ts`)**: `fetch`를 stub.

  ```ts
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  // (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => [...] })
  ```

- **Context / `NoteEditor` 통합**: api 모듈을 모킹하고 `NotesProvider`로 감싼다.

  ```ts
  vi.mock('../api/notes'); // import * as api 로 받아 vi.mocked(api.createNote) 단언
  // renderHook(() => useNotes(), { wrapper: NotesProvider }) 또는 render(<NotesProvider>…</NotesProvider>)
  ```

## 까다로운 케이스 레시피

- **Enter 커밋 + 한글 IME 가드(`isComposing`)**: 컴포넌트가 `e.nativeEvent.isComposing`를 본다.
  `fireEvent.keyDown(input, { key: 'Enter', isComposing: true })`로 조합 중 Enter를 흉내 내고
  `expect(onCommit).not.toHaveBeenCalled()`. 조합 아닌 Enter는 `isComposing` 없이 보내 호출됨을 단언.
- **입력 타이핑**: `await userEvent.type(input, 'react')` 후 `onChange` 스파이 인자 단언.
- **칩 렌더**: `screen.getByText(...)`로 존재 단언, 빈 배열이면 `container.textContent === ''`로 텍스트 부재 단언.
- **훅 테스트**: `const { result } = renderHook(() => useTagInput([]))` → `act(() => result.current.commit())`
  후 `result.current.tags` 단언. (골격이면 renderHook이 throw를 surfacing → RED.)

## 예시 테스트 (형태 참고용)

```ts
// src/lib/tags.test.ts  — 대상이 없으면 throw 골격 생성 후 작성. 호출 시 not implemented로 RED.
import { parseTagInput } from './tags';

describe('parseTagInput', () => {
  it('should return ["react"] when input is "react"', () => {
    expect(parseTagInput('react')).toEqual(['react']);
  });
  it('should return [] when input is "" (빈 문자열)', () => {
    expect(parseTagInput('')).toEqual([]);
  });
});
```

```tsx
// src/components/TagInput.test.tsx — 골격(throw)이면 render 시 던져 RED.
import { fireEvent, render, screen } from '@testing-library/react';
import { TagInput } from './TagInput';

describe('TagInput', () => {
  it('should call onCommit when Enter is pressed and not composing', () => {
    const onCommit = vi.fn();
    render(<TagInput value="react" onChange={() => {}} onCommit={onCommit} />);
    fireEvent.keyDown(screen.getByLabelText('태그 입력'), { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledTimes(1);
  });
  it('should NOT call onCommit when Enter is pressed during IME composition', () => {
    const onCommit = vi.fn();
    render(<TagInput value="리액트" onChange={() => {}} onCommit={onCommit} />);
    fireEvent.keyDown(screen.getByLabelText('태그 입력'), { key: 'Enter', isComposing: true });
    expect(onCommit).not.toHaveBeenCalled();
  });
});
```

## 주의

- 시나리오의 `## 테스트 시나리오` 불릿만 테스트로 옮긴다. 카테고리가 비어 있으면(예: "예외 (0)") 건너뛴다.
  `결정/주의`·`AC 매핑 표`는 테스트가 아니다.
- 통합 시나리오(저장·재진입·취소 폐기 등)는 `NoteEditor.test.tsx`에서 api 모킹 + `NotesProvider`로 표현한다.
  표현이 과하게 복잡하면 그 사실을 보고하고 단위 수준으로 쪼갤지 사용자와 상의한다(임의 누락 금지).
- 끝까지 **실제 로직은 안 쓴다.** throw 골격(시그니처+`not implemented`)은 구현이 아니다 — 행동은 여전히 없다.
  모든 테스트가 _실행되어_ 빨간 상태로 깔끔히 마치고, throw 본문 채우기는 GREEN으로 넘기는 게 성공 조건이다.
