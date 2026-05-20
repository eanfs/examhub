/**
 * 大屏加载冒烟测试 —— 验证首屏关键结构都渲染出来。
 * 数据来自 mock（见 playwright.config.ts 的 webServer），断言用固定值。
 */

import { test, expect } from '@playwright/test'
import { DashboardPage } from './pages/DashboardPage'

test.describe('大屏加载', () => {
  test('标题、7 个指标块、wall 头部与学校行都渲染', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    // 标题。
    await expect(dashboard.title).toBeVisible()
    await expect(dashboard.title).toHaveText('考务可视化大屏')

    // 标题栏的系统时钟与刷新控件。
    await expect(dashboard.clock).toBeVisible()
    await expect(dashboard.refreshControl).toBeVisible()

    // 指标环有 7 个 tile（MetricsRing 固定 7 项）。
    await expect(dashboard.metricsRing).toBeVisible()
    await expect(dashboard.metricTiles).toHaveCount(7)

    // wall 头部与学校墙。
    await expect(dashboard.wallHeader).toBeVisible()
    await expect(dashboard.schoolWall).toBeVisible()

    // mock 数据有 7 所学校。
    await expect(dashboard.schoolRows).toHaveCount(7)
    await expect(dashboard.schoolRow(0)).toContainText('上海市铁岭中学')
  })

  test('指标块显示 mock 的考点数量与考生总计', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    // hero.totalSchools = 20，hero.totalCandidates = 7038（带千分位 7,038）。
    const tiles = dashboard.metricTiles
    await expect(tiles.filter({ hasText: '考点数量' })).toContainText('20')
    await expect(tiles.filter({ hasText: '考生总计' })).toContainText('7,038')
  })
})
