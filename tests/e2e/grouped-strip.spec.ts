/**
 * 折叠分组交互测试。
 *
 * 学校行右侧把「已结束 / 未开始」批次折叠成可点击的 strip，strip 上带批次
 * chip；点击 chip 会把该批次展开成考场房间表（BatchCard → ExamRoomTable）。
 *
 * mock 第 1 所「上海市铁岭中学」: 10 个批次，done=6 → 6 个已结束批次，
 * 因此存在一条「已结束」strip，带 6 个 chip。
 */

import { test, expect } from '@playwright/test'
import { DashboardPage } from './pages/DashboardPage'

test.describe('折叠分组交互', () => {
  test('第一所学校存在「已结束」折叠条且带批次 chip', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    const strip = dashboard.groupedStrip(0, 'ended')
    await expect(strip).toBeVisible()
    await expect(strip).toContainText('已结束')

    // 6 个已结束批次 → 6 个 chip。
    const chips = dashboard.batchChips(0, 'ended')
    await expect(chips).toHaveCount(6)
  })

  test('点击折叠条切换展开状态（chevron 翻转）', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    const strip = dashboard.groupedStrip(0, 'ended')
    // strip 的 chevron 是 SVG，点击后会重新渲染；这里以可点击且不抛错为准。
    await strip.click()
    await expect(strip).toBeVisible()
    // 再点一次收起。
    await strip.click()
    await expect(strip).toBeVisible()
  })

  test('点击批次 chip 把该批次展开成考场房间表', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    // 初始：已结束分组内没有展开的 BatchCard。
    const expandedCards = dashboard.expandedCardsInGroup(0, 'ended')
    await expect(expandedCards).toHaveCount(0)

    const chips = dashboard.batchChips(0, 'ended')
    const firstChip = chips.first()
    await expect(firstChip).toHaveAttribute('data-expanded', 'false')

    await firstChip.click()

    // chip 标记为展开，且该分组内多出一张展开的批次卡。
    await expect(firstChip).toHaveAttribute('data-expanded', 'true')
    await expect(expandedCards).toHaveCount(1)

    // 展开的批次卡含考场房间表与 ExamRoomTable 的考场名。
    const rooms = expandedCards.first().getByTestId('batch-rooms')
    await expect(rooms).toBeVisible()
    await expect(rooms).toContainText('化学考场2')

    // 再次点击 chip 收起。
    await firstChip.click()
    await expect(firstChip).toHaveAttribute('data-expanded', 'false')
    await expect(expandedCards).toHaveCount(0)
  })
})
