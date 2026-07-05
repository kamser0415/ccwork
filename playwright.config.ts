import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 설정.
 *
 * 이 앱은 Vite(5173) + JSON Server(3001) 두 서버가 모두 떠 있어야 동작한다.
 * 그래서 webServer로 둘 다 자동 기동하고, 로컬에서 이미 떠 있으면 재사용한다
 * (reuseExistingServer). --strictPort로 포트가 밀리면 조용히 다른 포트로
 * 뜨는 대신 실패하게 해서 health-check URL과 어긋나는 사고를 막는다.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // 리포트가 자동으로 열려 터미널을 붙잡지 않도록 open: 'never'.
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    launchOptions: {
      // SLOWMO=800 처럼 주면 각 액션 사이에 지연(ms)을 넣어, --headed에서 동작을 천천히 볼 수 있다.
      // 기본 0이라 평소 실행엔 영향이 없다(디버깅 전용 스위치).
      slowMo: process.env.SLOWMO ? Number(process.env.SLOWMO) : 0,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run server',
      url: 'http://localhost:3001/notes',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npx vite --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
