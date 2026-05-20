/**
 * Playwright 配置 —— 考务可视化大屏 E2E。
 *
 * 关键点：
 *  - webServer 以 `dev:mock` 启动 Vite，强制 VITE_DATA_SOURCE=mock，
 *    保证数据来自 src/data/mockData.ts（确定性，不依赖会过期的线上 token）。
 *  - 视口固定 1920×1080，与设计基线一致，让字号/布局断言稳定可重复
 *    （大屏本身是 fluid 100vw/100vh 布局，视口尺寸不是结构性硬约束）。
 */

import { defineConfig, devices } from '@playwright/test'

const PORT = 5173
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'playwright-results.xml' }],
    ['list'],
  ],
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1920, height: 1080 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
  ],
  webServer: {
    command: 'npm run dev:mock',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
