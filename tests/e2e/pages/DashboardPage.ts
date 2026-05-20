/**
 * DashboardPage —— 考务可视化大屏的 Page Object。
 *
 * 大屏没有路由，只有一个屏幕，所以这里集中封装所有定位器与交互动作，
 * 让测试用例只表达"做什么"而不关心 DOM 细节。
 */

import type { Locator, Page } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly title: Locator
  readonly clock: Locator
  readonly refreshControl: Locator
  readonly metricsRing: Locator
  readonly metricTiles: Locator
  readonly wallHeader: Locator
  readonly schoolWall: Locator
  readonly schoolRows: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.getByRole('heading', { name: '考务可视化大屏' })
    this.clock = page.getByTestId('system-clock')
    this.refreshControl = page.getByTestId('refresh-control-trigger')
    this.metricsRing = page.getByTestId('metrics-ring')
    this.metricTiles = page.getByTestId('metric-tile')
    this.wallHeader = page.getByTestId('wall-header')
    this.schoolWall = page.getByTestId('school-wall')
    this.schoolRows = page.getByTestId('school-row')
  }

  async goto() {
    await this.page.goto('/')
    // 首屏先显示 loading，等大屏内容渲染出来再继续。
    await this.title.waitFor({ state: 'visible' })
    await this.schoolRows.first().waitFor({ state: 'visible' })
  }

  /** 取第 index 个学校行。 */
  schoolRow(index: number): Locator {
    return this.schoolRows.nth(index)
  }

  /** 某学校行内的「特殊情况」内联块。 */
  specialBlock(rowIndex: number): Locator {
    return this.schoolRow(rowIndex).getByTestId('special-block')
  }

  /** 某学校行内、指定类型（ended / idle）的折叠条。 */
  groupedStrip(rowIndex: number, kind: 'ended' | 'idle'): Locator {
    return this.schoolRow(rowIndex).locator(
      `[data-testid="grouped-strip"][data-kind="${kind}"]`,
    )
  }

  /** 某学校行内某折叠条下的批次 chip 集合。 */
  batchChips(rowIndex: number, kind: 'ended' | 'idle'): Locator {
    return this.schoolRow(rowIndex)
      .locator(`[data-testid="grouped-strip"][data-kind="${kind}"]`)
      .getByTestId('batch-chip')
  }

  /** 展开后的批次房间表容器（整行范围内）。 */
  batchRooms(rowIndex: number): Locator {
    return this.schoolRow(rowIndex).getByTestId('batch-rooms')
  }

  /**
   * 某折叠条所在分组（.group）内被展开出来的 BatchCard。
   * 用于断言「点击 chip 后该分组内确实多出一张展开的批次卡」。
   */
  expandedCardsInGroup(rowIndex: number, kind: 'ended' | 'idle'): Locator {
    return this.schoolRow(rowIndex)
      .locator(`[data-testid="grouped-strip"][data-kind="${kind}"]`)
      .locator('xpath=..')
      .getByTestId('batch-card')
  }
}
