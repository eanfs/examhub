/**
 * 数据源唯一切换点。
 * 按环境变量 VITE_DATA_SOURCE 选择真实接口或内置 mock；
 * store 与组件只认 fetchSnapshot / fetchExamList，不关心数据从哪来。
 */

import type { DashboardSnapshot, ExamListItem } from '../types'
import { createSnapshot, createExamList } from './mockData'
import { fetchSnapshotFromApi, fetchExamListFromApi } from './api/apiClient'

const SOURCE = import.meta.env.VITE_DATA_SOURCE ?? 'mock'

/** 拉取指定考试的大屏快照（真实接口或 mock）。 */
export function fetchSnapshot(
  examId: string,
  signal?: AbortSignal,
): Promise<DashboardSnapshot> {
  if (SOURCE === 'api') {
    return fetchSnapshotFromApi(examId, signal)
  }
  // mock 数据与 examId 无关，固定返回同一份样例。
  return Promise.resolve(createSnapshot())
}

/** 拉取考试列表（真实接口或 mock）。 */
export function fetchExamList(
  signal?: AbortSignal,
): Promise<ExamListItem[]> {
  if (SOURCE === 'api') {
    return fetchExamListFromApi(signal)
  }
  return Promise.resolve(createExamList())
}
