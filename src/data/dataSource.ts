/**
 * 数据源唯一切换点。
 * 按环境变量 VITE_DATA_SOURCE 选择真实接口或内置 mock；
 * store 与组件只认 fetchSnapshot，不关心数据从哪来。
 */

import type { DashboardSnapshot } from '../types'
import { createSnapshot } from './mockData'
import { fetchSnapshotFromApi } from './api/apiClient'

const SOURCE = import.meta.env.VITE_DATA_SOURCE ?? 'mock'

/** 拉取一份大屏快照（真实接口或 mock）。 */
export function fetchSnapshot(
  signal?: AbortSignal,
): Promise<DashboardSnapshot> {
  if (SOURCE === 'api') {
    return fetchSnapshotFromApi(signal)
  }
  return Promise.resolve(createSnapshot())
}
