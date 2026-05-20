/**
 * Wall 头部汇总测试 —— 验证「今日批次实况」头部的跨校汇总统计。
 */

import { test, expect } from '@playwright/test'
import { DashboardPage } from './pages/DashboardPage'

test.describe('Wall 头部汇总', () => {
  test('头部显示今日批次实况与缺考/迟到/违纪汇总', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    const header = dashboard.wallHeader
    await expect(header).toBeVisible()
    await expect(header).toContainText('今日批次实况')

    // 批次状态汇总。
    await expect(header).toContainText('正在进行')
    await expect(header).toContainText('已抽签待开')
    await expect(header).toContainText('已结束')
    await expect(header).toContainText('今日批次')

    // 特殊情况跨校汇总。
    await expect(header).toContainText('缺考')
    await expect(header).toContainText('迟到')
    await expect(header).toContainText('违纪')
  })

  test('缺考汇总等于各校 absent 之和', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    // mock 各校 absent: 13+11+19+22+15+23+33 = 136。
    // SummaryStat 把 label 与 value 渲染在同一个 div 内。
    const absentStat = dashboard.wallHeader.getByText(/^缺考136$/)
    await expect(absentStat).toBeVisible()
  })
})
