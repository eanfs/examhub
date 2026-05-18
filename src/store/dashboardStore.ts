/**
 * Dashboard store (Zustand)。
 *
 * 持有大屏快照与 UI 状态，并负责轮询：每 5s 重新拉取一次接口。
 * 数据来源由 ../data/dataSource 决定（真实接口或 mock）。
 *
 * 备注：交接规范里「进行中场次每 2s 刷新收卷数」需要更轻量的接口或
 * WebSocket 推送；当前后端只提供单个全量 REST 接口，故统一 5s 轮询。
 */

import { create } from 'zustand'
import type { DashboardSnapshot } from '../types'
import { fetchSnapshot } from '../data/dataSource'

/** 轮询心跳间隔。 */
const HEARTBEAT_MS = 5000

interface DashboardState {
  snapshot: DashboardSnapshot | null
  /** 仅首次加载（还没有任何快照）时为 true。 */
  loading: boolean
  /** 最近一次拉取的错误信息；成功后清空。 */
  error: string | null
  /** 最近一次成功同步的时间戳。 */
  syncedAt: number | null
  /** 特殊情况侧栏是否展开。 */
  sidebarOpen: boolean

  load: () => Promise<void>
  startPolling: () => void
  stopPolling: () => void
  toggleSidebar: () => void
  closeSidebar: () => void
}

let heartbeatTimer: ReturnType<typeof setInterval> | null = null

export const useDashboardStore = create<DashboardState>((set, get) => ({
  snapshot: null,
  loading: true,
  error: null,
  syncedAt: null,
  sidebarOpen: false,

  load: async () => {
    const isFirstLoad = get().snapshot === null
    if (isFirstLoad) set({ loading: true })
    try {
      const snapshot = await fetchSnapshot()
      set({ snapshot, loading: false, error: null, syncedAt: Date.now() })
    } catch (e) {
      const message = e instanceof Error ? e.message : '数据加载失败'
      // 轮询失败时保留上一份好数据，只记录错误；仅首次加载会真正阻塞。
      set({ loading: false, error: message })
    }
  },

  startPolling: () => {
    if (heartbeatTimer) return
    heartbeatTimer = setInterval(() => {
      void get().load()
    }, HEARTBEAT_MS)
  },

  stopPolling: () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    heartbeatTimer = null
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}))
