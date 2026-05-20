/**
 * 特殊情况内联块测试。
 *
 * 「特殊情况」此前是侧栏 + 切换按钮，已重构为每个学校行内的内联块。
 * 这里验证：旧的切换按钮 / 侧栏已消失，新的内联块存在且内容正确。
 */

import { test, expect } from '@playwright/test'
import { DashboardPage } from './pages/DashboardPage'

test.describe('特殊情况内联块', () => {
  test('每个学校行都有内联的特殊情况块', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    // 7 所学校 → 7 个内联特殊情况块。
    await expect(page.getByTestId('special-block')).toHaveCount(7)

    const first = dashboard.specialBlock(0)
    await expect(first).toBeVisible()
    await expect(first).toContainText('特殊情况')
    await expect(first).toContainText('缺考')
    await expect(first).toContainText('迟到')
    await expect(first).toContainText('违纪')
    await expect(first).toContainText('已上报')
    await expect(first).toContainText('已处理')
  })

  test('内联块显示 mock 中该校的缺考/已上报数值', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    // 第 1 所「上海市铁岭中学」special: absent 13, reported 48。
    const block = dashboard.specialBlock(0)
    await expect(block).toContainText('13')
    await expect(block).toContainText('48')
  })

  test('旧的特殊情况侧栏 / 切换按钮已被移除', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    // 重构前的侧栏 / 切换控件应当完全不存在。
    await expect(page.getByTestId('special-panel')).toHaveCount(0)
    await expect(page.getByTestId('special-toggle')).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: /特殊情况/ }),
    ).toHaveCount(0)
  })
})
