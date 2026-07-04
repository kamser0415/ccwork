import { test, expect } from '@playwright/test';

// E2E 스모크 테스트.
// Vite + JSON Server가 함께 뜨고 앱이 실제로 렌더되는지만 확인한다(읽기 전용 — db.json 변경 없음).
test('앱이 로드되고 헤더가 보인다', async ({ page }) => {
  await page.goto('/');

  // 헤더 제목과 새 노트 버튼은 데이터와 무관하게 항상 렌더된다.
  await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
  await expect(page.getByRole('button', { name: '새 노트' })).toBeVisible();
});
