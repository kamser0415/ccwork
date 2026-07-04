import { test, expect, request as playwrightRequest } from '@playwright/test';

// 태그 기능 E2E. 단위 테스트(src/**/*.test.*)가 파싱·중복·IME·칩 렌더·모킹 저장까지 이미 잡으므로,
// 여기서는 "단위가 모킹으로 건너뛴 통합 seam" — 진짜 JSON Server에 저장돼 브라우저를 새로고침해도
// 남아 있는가(영속), 실제 화면 이동으로 흐름이 이어지는가 — 만 검증한다.

// 칩 단언에 exact:true를 쓴다: getByText는 기본이 대소문자 무시 substring이라, 사이드바 시드 노트의
// 본문("React와 TypeScript...")까지 걸려 strict mode 위반이 난다. 태그는 정확히 일치하는 토큰이므로 exact가 맞다.

const API = 'http://localhost:3001/notes';
// 이 프로젝트 E2E는 실제 db.json에 쓴다. 시드·다른 테스트와 충돌하지 않도록 고유 접두사를 붙이고
// afterEach에서 이 접두사로 시작하는 노트를 REST로 지워 시연 데이터를 오염시키지 않는다.
const NONCE = 'E2E-tag';

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

// US-5: 단위 통합 테스트의 "reopen"은 모킹된 컨텍스트를 재렌더할 뿐이다. E2E는 진짜 서버에 저장하고
// 페이지를 새로고침해 사이드바에서 다시 열었을 때도 태그가 남는지 — 실제 영속 — 를 증명한다.
test('태그를 달아 저장하면 새로고침 후 다시 열어도 유지된다', async ({ page }) => {
  const title = `${NONCE} 영속`;
  await page.goto('/');

  await page.getByRole('button', { name: '새 노트' }).click();
  await page.getByPlaceholder('제목').fill(title);
  await page.getByLabel('태그 입력').fill('react, study');
  await page.getByLabel('태그 입력').press('Enter');
  await expect(page.getByText('react', { exact: true })).toBeVisible();
  await expect(page.getByText('study', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '저장', exact: true }).click();

  // 새로고침으로 앱 상태를 완전히 버린 뒤 서버에서 다시 읽어 온다.
  await page.reload();
  await page.getByRole('heading', { name: title }).click();
  await expect(page.getByText('react', { exact: true })).toBeVisible();
  await expect(page.getByText('study', { exact: true })).toBeVisible();
});

// US-1(경량): 파싱 규칙 매트릭스가 아니라, 쉼표 입력이 실제 스택을 통과해 칩 2개로 렌더되는지만 본다.
// 저장하지 않으므로 서버에 남는 데이터가 없다(정리 불필요).
test('쉼표로 구분해 입력하면 칩 여러 개로 나뉘어 보인다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: '새 노트' }).click();
  await page.getByLabel('태그 입력').fill('react, study');
  await page.getByLabel('태그 입력').press('Enter');

  await expect(page.getByText('react', { exact: true })).toBeVisible();
  await expect(page.getByText('study', { exact: true })).toBeVisible();
});
