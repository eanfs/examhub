/**
 * Dashboard store (Zustand)。
 *
 * 持有大屏快照、考试列表与 UI 状态，并负责轮询：按可配置的间隔静默
 * 重新拉取接口（默认 60s，最小 30s，由标题栏刷新控件调整）。
 * 数据来源由 ../data/dataSource 决定（真实接口或 mock）。
 */

import { create } from 'zustand'
import type { DashboardSnapshot, ExamListItem } from '../types'
import { fetchSnapshot, fetchExamList } from '../data/dataSource'
import { ApiError } from '../data/api/apiClient'

/** 自动刷新间隔的默认值与下限。 */
export const DEFAULT_REFRESH_MS = 60_000
export const MIN_REFRESH_MS = 30_000

/** 初始考试 ID：来自构建期 env，运行时可由标题栏选择器替换。 */
const INITIAL_EXAM_ID = import.meta.env.VITE_EXAM_ID ?? ''

interface DashboardState {
  snapshot: DashboardSnapshot | null
  /** 仅首次加载（还没有任何快照）时为 true。 */
  loading: boolean
  /** 最近一次拉取的错误信息；成功后清空。 */
  error: string | null
  /** 最近一次成功同步的时间戳。 */
  syncedAt: number | null
  /** 标题栏考试选择器的列表。 */
  examList: ExamListItem[]
  /** 当前监控的考试 ID（统计接口的 examId）。 */
  currentExamId: string
  /** 自动刷新间隔（毫秒）。 */
  refreshInterval: number

  load: () => Promise<void>
  startPolling: () => void
  stopPolling: () => void
  loadExamList: () => Promise<void>
  /** 切换监控的考试：更新 examId 并立即重新加载、重置定时器。 */
  selectExam: (examId: string) => void
  /** 设置自动刷新间隔（会被夹到 ≥ MIN_REFRESH_MS），并按新间隔重启轮询。 */
  setRefreshInterval: (ms: number) => void
  /** 立即刷新一次，并重置定时器（同时是 401 停轮询后的恢复路径）。 */
  refreshNow: () => Promise<void>
}

let heartbeatTimer: ReturnType<typeof setInterval> | null = null
/** 当前在途请求的中止控制器；新一轮拉取会先中止上一轮。 */
let inflight: AbortController | null = null

/** 鉴权类失败（401/403）一律视为「token 失效」。 */
function isAuthError(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 401 || e.status === 403)
}

export const useDashboardStore = create<DashboardState>((set, get) => {
  /** 启动/重启轮询定时器（按当前 refreshInterval）。集中维护以避免多处复制。 */
  const armTimer = () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    heartbeatTimer = setInterval(() => {
      void get().load()
    }, get().refreshInterval)
  }

  return {
    snapshot: null,
    loading: true,
    error: null,
    syncedAt: null,
    examList: [],
    currentExamId: INITIAL_EXAM_ID,
    refreshInterval: DEFAULT_REFRESH_MS,

    load: async () => {
      const isFirstLoad = get().snapshot === null
      if (isFirstLoad) set({ loading: true })
      // 慢接口下两轮轮询可能并发：先中止上一轮，确保旧响应不会覆盖新响应。
      inflight?.abort()
      const controller = new AbortController()
      inflight = controller
      try {
        const snapshot = await fetchSnapshot(get().currentExamId, controller.signal)
        set({ snapshot, loading: false, error: null, syncedAt: Date.now() })
      } catch (e) {
        // 被新一轮拉取主动中止 —— 不是真正的失败，不展示错误。
        if (e instanceof DOMException && e.name === 'AbortError') return
        // 鉴权失效时停止轮询，避免按周期不断 401 → 服务端日志爆炸。
        // 用户点「立即刷新」会走 refreshNow，能恢复轮询。
        if (isAuthError(e)) get().stopPolling()
        const message = e instanceof Error ? e.message : '数据加载失败'
        // 轮询失败时保留上一份好数据，只记录错误；仅首次加载会真正阻塞。
        set({ loading: false, error: message })
      } finally {
        if (inflight === controller) inflight = null
      }
    },

    startPolling: () => {
      if (heartbeatTimer) return
      armTimer()
    },

    stopPolling: () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer)
      heartbeatTimer = null
      inflight?.abort()
      inflight = null
    },

    loadExamList: async () => {
      try {
        const examList = await fetchExamList()
        set({ examList })
        // 当前 examId 不在列表中（如 env 配置过期）时，回退到列表首项。
        const { currentExamId } = get()
        const matched = examList.some((e) => e.id === currentExamId)
        if (!matched && examList.length > 0) {
          get().selectExam(examList[0].id)
        }
      } catch (e) {
        // 考试列表拉取失败不阻塞大屏主流程，但要留下日志便于排查。
        console.error('loadExamList failed:', e)
      }
    },

    selectExam: (examId: string) => {
      if (examId === get().currentExamId) return
      // 清空快照 → App 切回加载态，明确反馈「正在切换考试」。
      set({ currentExamId: examId, snapshot: null, loading: true, error: null })
      void get().refreshNow()
    },

    setRefreshInterval: (ms: number) => {
      const clamped = Math.max(MIN_REFRESH_MS, ms)
      set({ refreshInterval: clamped })
      // 正在轮询时按新间隔重启计时器。
      if (heartbeatTimer) armTimer()
    },

    refreshNow: async () => {
      await get().load()
      // 重置定时器：让下一次自动刷新距离这次手动刷新一个完整间隔，
      // 同时也是 401 停轮询之后用户点「立即刷新」的恢复路径。
      armTimer()
    },
  }
})
