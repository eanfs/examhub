/**
 * 真实接口 HTTP 客户端。
 *  - GET {VITE_API_BASE}/kws-exam/view/statistics/view/{examId} —— 大屏快照
 *  - GET {VITE_API_BASE}/kws-exam/plan/view/List               —— 考试列表
 * 统一经 requestEnvelope 校验信封后，交给对应适配器转换成领域模型。
 */

import type { DashboardSnapshot, ExamListItem } from '../../types'
import type {
  ApiEnvelope,
  ApiExamPlan,
  ApiStatisticsData,
} from './apiTypes'
import { adaptSnapshot } from './adaptSnapshot'
import { adaptExamList } from './adaptExamList'

const BASE = import.meta.env.VITE_API_BASE ?? '/api'
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

/**
 * 发起一次 GET 请求并校验统一信封，成功时返回整个信封。
 * 失败统一抛 ApiError；中止信号（AbortError）原样透传。
 */
async function requestEnvelope<T>(
  path: string,
  signal?: AbortSignal,
): Promise<ApiEnvelope<T>> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
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

  let body: ApiEnvelope<T>
  try {
    body = (await res.json()) as ApiEnvelope<T>
  } catch (e) {
    // 中止信号在读 body 期间触发时同样会落到这里 —— 透传，不当成格式错误。
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    // 200 但返回的不是 JSON（如代理登录页），给出可读错误而非裸异常。
    throw new ApiError('接口返回数据格式错误')
  }
  if (!body.success || body.code !== 200) {
    throw new ApiError(body.msg || '接口返回失败')
  }

  return body
}

/** 从真实接口拉取指定考试的大屏快照。 */
export async function fetchSnapshotFromApi(
  examId: string,
  signal?: AbortSignal,
): Promise<DashboardSnapshot> {
  if (!examId) {
    throw new ApiError('未指定考试 ID')
  }
  const body = await requestEnvelope<ApiStatisticsData>(
    `/kws-exam/view/statistics/view/${examId}`,
    signal,
  )
  return adaptSnapshot(body)
}

/** 从真实接口拉取考试列表（标题栏选择器用）。 */
export async function fetchExamListFromApi(
  signal?: AbortSignal,
): Promise<ExamListItem[]> {
  const body = await requestEnvelope<ApiExamPlan[]>(
    '/kws-exam/plan/view/List',
    signal,
  )
  return adaptExamList(body)
}
