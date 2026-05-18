/**
 * 真实接口 HTTP 客户端。
 * 调用 GET {VITE_API_BASE}/kws-exam/view/statistics/view/{VITE_EXAM_ID}，
 * 校验信封后交给 adaptSnapshot 转换成 DashboardSnapshot。
 */

import type { DashboardSnapshot } from '../../types'
import type { ApiStatisticsResponse } from './apiTypes'
import { adaptSnapshot } from './adaptSnapshot'

const BASE = import.meta.env.VITE_API_BASE ?? '/api'
const EXAM_ID = import.meta.env.VITE_EXAM_ID ?? ''
const TOKEN = import.meta.env.VITE_API_TOKEN ?? ''

/** 接口调用失败时抛出的错误，message 适合直接展示给操作员。 */
export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** 从真实接口拉取一份大屏快照。 */
export async function fetchSnapshotFromApi(
  signal?: AbortSignal,
): Promise<DashboardSnapshot> {
  if (!EXAM_ID) {
    throw new ApiError('未配置 VITE_EXAM_ID')
  }

  const url = `${BASE}/kws-exam/view/statistics/view/${EXAM_ID}`

  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        Accept: 'application/json, text/plain, */*',
        ...(TOKEN ? { Authorization: TOKEN } : {}),
      },
      signal,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new ApiError('网络请求失败，请检查连接')
  }

  if (res.status === 401 || res.status === 403) {
    throw new ApiError('鉴权失败，token 可能已过期', res.status)
  }
  if (!res.ok) {
    throw new ApiError(`接口返回 ${res.status}`, res.status)
  }

  const body = (await res.json()) as ApiStatisticsResponse
  if (!body.success || body.code !== 200) {
    throw new ApiError(body.msg || '接口返回失败')
  }

  return adaptSnapshot(body)
}
