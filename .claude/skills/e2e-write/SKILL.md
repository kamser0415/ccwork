---
name: e2e-write
description: 기능(feature)의 `docs/features/{기능명}/prd.md` **사용자 스토리(US-N + 수용 기준)** 를 읽어 Playwright **E2E 테스트 코드로 변환**하는 스킬. E2E는 단위 테스트가 모킹으로 건너뛴 **통합 seam**(실제 브라우저 + 실제 JSON Server + 실제 영속·리로드·화면 이동)만 검증하고, `src/**/*.test.*`가 이미 커버하는 순수 로직·단일 위젯 상호작용은 **중복하지 않는다.** `e2e/{기능명}.spec.ts`에 사용자 관점 로케이터(getByRole/getByLabel)와 web-first 단언으로 작성하고, 실행해 그린을 확인한다. `/e2e-write <기능명>`으로 호출하며, 사용자가 "E2E 테스트 작성", "PRD를 E2E로", "사용자 스토리를 E2E 시나리오로", "Playwright 테스트 짜줘", "인수 테스트 만들어줘", "이 기능 완성됐으니 e2e로 검증", "브라우저로 흐름 테스트" 같은 요청을 하면 — 'e2e-write'를 직접 언급하지 않더라도 — 이 스킬을 사용할 것. 짝꿍 스킬 `test-scenarios`/`tdd-*`가 단위 계약을 다룬다면, 이 스킬은 그 위에서 **완성된 기능의 사용자 여정**을 브라우저로 검증하는 자리다.
---

# e2e-write

기능의 **PRD 사용자 스토리**를 Playwright **E2E 테스트**로 옮긴다. 단위·통합 테스트(Vitest)가 이미
검증한 것을 다시 하지 않고, **E2E만이 할 수 있는 검증**에 집중하는 게 이 스킬의 존재 이유다.

**왜 E2E를 따로 쓰나?** 이 앱의 단위 테스트는 `src/api/notes.ts`의 `fetch`를 stub하고 `jsdom`에서
컴포넌트를 렌더한다 — 즉 **네트워크·브라우저·영속을 모킹으로 대체**한다. 그래서 "저장 payload 모양이
맞나", "파싱 규칙이 맞나"는 단위가 완벽히 잡지만, **"진짜 JSON Server에 저장돼서 페이지를 새로고침해도
남아 있나", "사이드바에서 노트를 골라 편집기로 넘어가는 실제 화면 이동이 되나"** 는 아무도 검증하지 않는다.
E2E는 바로 그 **모킹으로 가려졌던 통합 seam**을 진짜 브라우저 + 진짜 서버로 통과시켜 증명한다.

## 입력

- `$ARGUMENTS` = **기능명**(= `docs/features/` 아래 폴더명). 예: `tag`. 생략되면 현재 브랜치·대화 맥락에서
  추론하되, 후보가 여럿이거나 불확실하면 **묻는다**(지어내지 않음).
- 정본 입력: **`docs/features/{기능명}/prd.md`의 `## 2. 사용자 스토리`** — `US-N` 문장 + 수용 기준
  체크박스. 이 파일이 없으면 멈추고 `feature-planner`로 PRD부터 만들라고 안내한다.
- 보조 입력: `spec-fixed.md`(계약 상세)와 `issues.md`(구현 범위)가 있으면 참고해 **무엇이 실제 구현됐는지**
  판단을 돕는다. 단, 최종 판단 근거는 **현재 `src/` 코드에 실제로 있는 UI**다(§실제 구현 우선).

## 핵심 원칙 — E2E는 "단위가 모킹으로 건너뛴 통합"만 검증한다

각 수용 기준(AC)마다 **한 문장**으로 물어라:

> **"이 AC를 모킹된 백엔드 + jsdom만으로 완전히 증명할 수 있나?"**

- **그렇다 → 단위 영역. E2E에서 다루지 않는다.** 순수 로직(파싱·trim·길이·중복 제거), 단일 위젯의
  미시 상호작용(IME 조합 가드, `onChange` 스파이), 모킹된 API에 대고 검증하는 저장 payload 모양 등.
  이건 `src/lib/*.test.ts`·`src/hooks/*.test.ts`·`src/components/*.test.tsx`가 **전수로** 잡는다.
- **아니다(진짜 서버/브라우저/영속/리로드/화면 이동이 필요) → E2E 영역.** 여기만 테스트로 옮긴다.

**시작 전 반드시 단위 커버리지를 스캔한다.** `src/**/*.test.{ts,tsx}` 목록과 각 `describe`/`it` 제목을
훑어 "이미 잡힌 것"의 지도를 만든 뒤, 그와 겹치는 AC는 E2E에서 뺀다. 겹침을 눈으로 확인하지 않고
"혹시 몰라서" E2E로 중복 작성하는 것이 이 스킬의 대표적 실패다 — 느리고 깨지기 쉬운 테스트만 늘어난다.

일반 지도(경계):

| 검증 대상                                   | 담당           | E2E?                           |
| ------------------------------------------- | -------------- | ------------------------------ |
| 순수 함수의 입력→출력 매트릭스(파싱/정규화) | 단위(`lib`)    | ❌ 중복 금지                   |
| 훅의 상태 전이(commit/remove/flush)         | 단위(`hooks`)  | ❌ 중복 금지                   |
| 단일 컴포넌트 상호작용(키 이벤트·콜백)      | 단위(`comp`)   | ❌ 중복 금지                   |
| 모킹 API에 대한 저장 호출·재진입            | 통합(`*.test`) | △ 실제 서버로 1회만(대표 여정) |
| **실제 저장 → 리로드 → 유지(영속)**         | 없음           | ✅ **E2E 핵심**                |
| **여러 컴포넌트를 잇는 사용자 여정**        | 없음           | ✅ **E2E 핵심**                |
| **진짜 브라우저 렌더·클릭·네비게이션**      | 없음           | ✅ **E2E 핵심**                |

## E2E 베스트 프랙티스 (이 스킬이 지키는 것)

- **사용자 관점 로케이터.** `getByRole`·`getByLabel`·`getByPlaceholder`·`getByText`를 쓴다. CSS
  클래스·XPath·`nth-child`는 구현이 바뀌면 깨지고 "사용자가 실제로 보는 것"과 무관하다. 이 앱은 시맨틱
  HTML(버튼·헤딩·`aria-label`)이 잘 갖춰져 있어 `data-testid` 없이도 충분하다 — 정 없으면 그때만 추가.
- **web-first 단언(auto-wait).** `await expect(locator).toBeVisible()`처럼 Playwright가 조건이 참이 될
  때까지 자동 재시도하는 단언을 쓴다. **`waitForTimeout`(임의 sleep) 금지** — 느리고 불안정하다. 요소가
  나타날 때까지 기다리는 건 단언에 맡긴다.
- **테스트 독립성.** 각 `test`는 자기 데이터로 시작해 자기 데이터를 정리하고 끝난다. 실행 순서·다른
  테스트가 남긴 상태·db.json의 시드 노트에 **의존하지 않는다**(§데이터 정리).
- **여정 하나 = 테스트 하나.** US 하나를 하나의 사용자 여정 테스트로 옮긴다. 여러 단언이 한 흐름을
  이룰 수는 있지만, 서로 다른 관심사를 한 테스트에 욱여넣지 않는다.
- **사용자가 보는 것만 단언.** 내부 상태·네트워크 호출 횟수가 아니라 화면에 뜬 칩·제목·문구를 단언한다.
- **실제 구현된 동작만(§실제 구현 우선).** PRD에 있어도 아직 `src/`에 UI가 없으면 셀렉터를 **지어내지
  말고** 시나리오 맵에 `미구현`으로 표시한다.

## 이 프로젝트의 E2E 환경

- **설정**: `playwright.config.ts`. `webServer`가 **JSON Server(3001) + Vite(5173) 둘 다 자동 기동**하고
  이미 떠 있으면 재사용한다. `baseURL: http://localhost:5173` → 테스트에서 `page.goto('/')`. `testDir: e2e`,
  **Chromium 프로젝트만**.
- **위치·이름**: 기능당 파일 하나 — `e2e/{기능명}.spec.ts`(예: `e2e/tag.spec.ts`). Vitest는 `include`가
  `src/**`로 한정돼 있어 `e2e/`를 줍지 않는다(`npm test`와 안 섞임).
- **실행**: 전체 `npm run test:e2e`, 파일만 `npx playwright test e2e/tag.spec.ts`. 디버깅은 `--headed`
  또는 `--ui`. import는 항상 `import { test, expect } from '@playwright/test'`.
- **실제 셀렉터 표**(현재 `src/` 기준 — 새 UI가 생기면 코드에서 재확인):

  | 대상               | 로케이터                                                        |
  | ------------------ | --------------------------------------------------------------- |
  | 새 노트 버튼       | `getByRole('button', { name: '새 노트' })`                      |
  | 제목 입력          | `getByPlaceholder('제목')`                                      |
  | 내용 입력          | `getByPlaceholder('내용을 입력하세요...')`                      |
  | 태그 입력          | `getByLabel('태그 입력')`                                       |
  | 저장 버튼          | `getByRole('button', { name: '저장', exact: true })` ※          |
  | 취소 버튼          | `getByRole('button', { name: '취소' })`                         |
  | 사이드바 노트 항목 | `getByRole('heading', { name: <노트 제목> })`(NoteItem h3)      |
  | 노트 삭제 버튼     | 카드 안 `getByRole('button', { name: '삭제' })`(여러 개→스코프) |
  | 태그 칩            | `getByText(<태그명>, { exact: true })` ※※                       |

  ※ 저장 중에는 라벨이 `저장 중...`으로 바뀌므로 `exact: true`로 `저장 중...`과의 오매칭을 막는다.
  ※※ `getByText`는 **기본이 대소문자 무시 substring**이라, 태그명만 넘기면 사이드바 시드 노트의 본문
  (예: 칩 `react` ↔ 노트 본문 `"React와 TypeScript..."`)까지 걸려 **strict mode 위반**이 난다. 태그는
  정확히 일치하는 토큰이므로 **`{ exact: true }`** 로 칩만 집는다(실측으로 확인된 함정).

## ⚠️ 데이터 격리 & 정리 — 실제 db.json에 쓴다

현재 이 프로젝트의 E2E는 **실제 `db.json`에 직접 쓴다**(별도 테스트 DB 격리는 보류 상태). 노트를
생성/삭제하는 E2E는 두면 **강의 시연 데이터가 오염**되므로, 생성한 데이터는 **반드시 스스로 정리한다.**

- **고유 제목으로 생성.** 테스트가 만드는 노트 제목에 **고유 접두사**를 붙여 시드 노트·다른 테스트와
  충돌하지 않게 한다(예: `E2E-태그-<짧은 난수>`). 랜덤이 필요하면 파일 상단에서 한 번 만들어 재사용한다.
- **`afterEach`에서 REST로 청소.** Playwright의 `request` fixture로 JSON Server에 직접 지운다 —
  UI 삭제보다 확실하다.

  ```ts
  import { test, expect, request as playwrightRequest } from '@playwright/test';
  const API = 'http://localhost:3001/notes';
  const NONCE = 'E2E-tag-x7q'; // 파일당 고유 접두사(테스트 데이터 식별용)

  test.afterEach(async () => {
    const ctx = await playwrightRequest.newContext();
    const all = await (await ctx.get(API)).json();
    for (const n of all) {
      if (typeof n.title === 'string' && n.title.startsWith(NONCE)) {
        await ctx.delete(`${API}/${n.id}`);
      }
    }
    await ctx.dispose();
  });
  ```

- **끝나고 잔여 확인.** 실행 후 `git diff --stat db.json`으로 시드 노트가 그대로인지 본다(정리가 완전하면
  생성분이 지워져 diff가 없다). diff가 남으면 정리 훅을 고친다.
- **대량 write가 필요하면 격리를 재논의한다.** 정리로 감당이 안 될 규모면, 별도 `db.e2e.json` + 별도
  포트로 격리하는 방식을 사용자와 상의한 뒤 진행한다(임의로 db 구조를 바꾸지 않음).

## 실행 절차

### 0. 준비 — PRD + 단위 커버리지 지도

- `$ARGUMENTS`에서 기능명 확정 → `docs/features/{기능명}/prd.md`의 사용자 스토리와 AC를 확보.
- `src/**/*.test.{ts,tsx}`를 훑어 **이미 단위가 잡은 것**의 지도를 만든다.
- `src/`에서 **각 US에 필요한 UI가 실제로 있는지** 확인한다(셀렉터 근거).

### 1. 시나리오 맵 도출 → **승인 게이트**

각 US(및 그 AC)를 아래 넷 중 하나로 분류한 **표**를 만들어 사용자에게 제시하고 **승인받는다.**
승인 전에는 테스트 코드를 쓰지 않는다(이 프로젝트의 단계별 사람 승인 규칙).

- **E2E 작성**: 통합 seam이 필요 → 어떤 여정으로, 무엇을 단언할지 한 줄.
- **단위 중복(skip)**: 어느 단위 테스트가 이미 잡는지 명시.
- **미구현(flag)**: PRD엔 있으나 현재 `src/`에 UI 없음 → 구현 후로 보류.
- **Out of scope**: PRD의 §Out of Scope거나 이번 기능 밖.

### 2. 승인된 것만 `e2e/{기능명}.spec.ts`로 작성

- §베스트 프랙티스 + §실제 셀렉터 표 + §데이터 정리를 지켜 작성한다.
- 테스트 제목은 사용자 여정을 서술한다(예: `'태그를 달아 저장하면 새로고침해도 유지된다'`).
- 사전 상태가 필요하면 UI로 클릭해 만들거나 `request`로 seed하고, **단언은 화면(UI)으로** 한다.

### 3. 실행 → 그린 확인

- `npx playwright test e2e/{기능명}.spec.ts` 실행. 전부 통과할 때까지 본다.
- 실패하면 원인을 가른다: **미구현**(→ 시나리오 맵으로 되돌려 flag) vs **테스트 버그**(셀렉터·단언 수정)
  vs **진짜 결함**(→ 구현 문제로 보고). 임의로 단언을 느슨하게 만들어 억지 그린을 만들지 않는다.

### 4. db.json 무결 확인

- `git diff --stat db.json`으로 생성 데이터가 정리됐는지 확인한다.

### 5. 보고

- 작성한 테스트 목록과 **US↔테스트 매핑**, skip/미구현/out-of-scope 각각의 사유, "전부 그린",
  db.json 클린 여부를 요약한다. 미구현으로 flag된 US가 있으면 다음에 무엇을 구현하면 E2E가 열리는지 짚는다.

## 예시 — tag 기능 (형태 참고용)

**시나리오 맵(발췌):**

| US   | 분류         | 근거 / 여정                                                                                                        |
| ---- | ------------ | ------------------------------------------------------------------------------------------------------------------ |
| US-1 | E2E(경량)    | "react, study" 입력+Enter → 칩 2개가 **실제 렌더**. 단, `a,,b`·공백 파싱 매트릭스는 `tags.test.ts`가 잡으므로 제외 |
| US-1 | 단위 skip    | 빈 조각·공백 정리 규칙 → `src/lib/tags.test.ts` 전수                                                               |
| US-4 | 단위 skip    | 대소문자 중복 제거 → `src/lib/tags.test.ts`                                                                        |
| US-3 | 미구현 flag  | `TagChipList`에 삭제(×) 버튼이 아직 없음 → 구현 후 작성                                                            |
| US-5 | **E2E 핵심** | 새 노트+태그 저장 → **페이지 리로드** → 재선택 시 칩 유지(실제 영속)                                               |
| US-6 | E2E(선택)    | 태그 없는 노트를 `request`로 seed → 열어 저장 시 오류 없음                                                         |

**예시 spec:**

```ts
import { test, expect, request as playwrightRequest } from '@playwright/test';

const API = 'http://localhost:3001/notes';
const NONCE = 'E2E-tag-x7q';

test.afterEach(async () => {
  const ctx = await playwrightRequest.newContext();
  const all = await (await ctx.get(API)).json();
  for (const n of all) {
    if (typeof n.title === 'string' && n.title.startsWith(NONCE)) {
      await ctx.delete(`${API}/${n.id}`);
    }
  }
  await ctx.dispose();
});

// US-5: 단위 테스트는 모킹된 API로만 저장을 확인한다. E2E는 진짜 서버에 저장하고
// 페이지를 새로고침해 "정말로 영속되는가"를 증명한다 — 여기서만 가능한 검증.
test('태그를 달아 저장하면 새로고침해도 유지된다', async ({ page }) => {
  const title = `${NONCE} 영속`;
  await page.goto('/');

  await page.getByRole('button', { name: '새 노트' }).click();
  await page.getByPlaceholder('제목').fill(title);
  await page.getByLabel('태그 입력').fill('react, study');
  await page.getByLabel('태그 입력').press('Enter');
  // exact:true — 태그명만 넘기면 사이드바 시드 본문("React와...")과 substring 충돌(§셀렉터 표 ※※).
  await expect(page.getByText('react', { exact: true })).toBeVisible();
  await expect(page.getByText('study', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '저장', exact: true }).click();

  // 새로고침 후 사이드바에서 다시 열었을 때 칩이 그대로여야 실제 영속이 증명된다.
  await page.reload();
  await page.getByRole('heading', { name: title }).click();
  await expect(page.getByText('react', { exact: true })).toBeVisible();
  await expect(page.getByText('study', { exact: true })).toBeVisible();
});

// US-1(경량): 파싱 매트릭스가 아니라 "쉼표 입력이 실제 스택을 통과해 칩 2개로 렌더되는가"만.
test('쉼표로 구분해 입력하면 칩 여러 개로 나뉘어 보인다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '새 노트' }).click();
  await page.getByLabel('태그 입력').fill('react, study');
  await page.getByLabel('태그 입력').press('Enter');
  await expect(page.getByText('react', { exact: true })).toBeVisible();
  await expect(page.getByText('study', { exact: true })).toBeVisible();
});
```

## 비협상 제약

- **단위가 이미 잡는 순수 로직·단일 위젯 상호작용을 E2E로 옮기지 않는다**(중복 금지). 시작 전 단위
  커버리지 스캔은 필수.
- **없는 UI의 셀렉터를 지어내지 않는다.** 미구현 AC는 flag하고 넘어간다.
- **`waitForTimeout`·임의 sleep 금지, CSS/XPath 셀렉터 지양.** 사용자 관점 로케이터 + web-first 단언.
- **생성한 데이터는 반드시 정리한다**(실제 db.json 사용 중). 정리 못 할 규모면 격리를 먼저 상의.
- **`src/` 구현 코드·단위 테스트는 수정하지 않는다.** 이 스킬은 `e2e/`만 만든다(셀렉터가 정 필요해
  `aria-label`/`data-testid` 추가가 불가피하면 그 사실을 먼저 알리고 최소 변경으로 상의).
- **시나리오 맵 승인 전에는 spec을 쓰지 않는다.**

## 주의

- 기준은 **PRD의 AC 체크박스 상태가 아니라 "지금 `src/`에 구현된 동작"** 이다. 체크가 비어 있어도 코드에
  있으면 대상이고, 체크가 돼 있어도 코드에 UI가 없으면 미구현으로 flag한다.
- 통합 여정이 과하게 길어지면(로그인·다단계 등) 한 테스트에 다 넣지 말고 사전 상태는 `request` seed로
  줄인 뒤 **핵심 단언만 UI로** 남긴다.
- 이 스킬은 **완성된 기능의 인수/회귀 E2E**를 만드는 자리다. 아직 구현 전이라면 단위 TDD 파이프라인
  (`test-scenarios` → `tdd-red` → `tdd-green`)이 먼저다.
