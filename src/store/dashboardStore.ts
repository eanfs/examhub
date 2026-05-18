/**
 * Dashboard store (Zustand).
 *
 * Holds the live snapshot plus UI state, and owns the polling simulation:
 *   - a 5s heartbeat (general refresh / sync marker)
 *   - a 2s running-session refresh that nudges 收卷 counts upward
 *
 * Swap `fetchSnapshot` / the tick logic for a real WebSocket feed and the
 * components consuming this store stay unchanged.
 */

import { create } from 'zustand'
import type { DashboardSnapshot } from '../types'
import { fetchSnapshot } from '../data/mockData'

/** Polling cadences from the handoff (P0). */
const HEARTBEAT_MS = 5000
const RUNNING_REFRESH_MS = 2000

interface DashboardState {
  snapshot: DashboardSnapshot | null
  loading: boolean
  /** Wall-clock of the last successful sync. */
  syncedAt: number | null
  /** Whether the 特殊情况 side panel is open. */
  sidebarOpen: boolean

  load: () => Promise<void>
  startPolling: () => void
  stopPolling: () => void
  toggleSidebar: () => void
  closeSidebar: () => void
}

let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let runningTimer: ReturnType<typeof setInterval> | null = null

/**
 * Advance running sessions: each running session whose 收卷 (submit) trails
 * 抽签 (draw) gains a small random amount, and the global submitted-papers
 * KPI drifts toward the expected total. Returns a new snapshot (immutable).
 */
function tickRunning(prev: DashboardSnapshot): DashboardSnapshot {
  let advanced = false

  const schools = prev.schools.map((school) => ({
    ...school,
    batches: school.batches.map((b) => {
      if (b.status !== 'running') return b
      return {
        ...b,
        rooms: b.rooms.map((r) => ({
          ...r,
          sessions: r.sessions.map((s) => {
            if (
              s.state !== 'running' ||
              typeof s.submit !== 'number' ||
              typeof s.draw !== 'number' ||
              s.submit >= s.draw
            ) {
              return s
            }
            const step = Math.floor(Math.random() * 3) // 0-2
            if (step === 0) return s
            advanced = true
            return { ...s, submit: Math.min(s.draw, s.submit + step) }
          }),
        })),
      }
    }),
  }))

  const hero = { ...prev.hero }
  if (hero.submittedPapers < hero.expectedPapers) {
    hero.submittedPapers = Math.min(
      hero.expectedPapers,
      hero.submittedPapers + Math.floor(Math.random() * 9), // 0-8
    )
    advanced = true
  }

  if (!advanced) return prev
  return { ...prev, hero, schools }
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  snapshot: null,
  loading: true,
  syncedAt: null,
  sidebarOpen: false,

  load: async () => {
    set({ loading: true })
    const snapshot = await fetchSnapshot()
    set({ snapshot, loading: false, syncedAt: Date.now() })
  },

  startPolling: () => {
    if (heartbeatTimer || runningTimer) return

    runningTimer = setInterval(() => {
      const { snapshot } = get()
      if (snapshot) set({ snapshot: tickRunning(snapshot) })
    }, RUNNING_REFRESH_MS)

    heartbeatTimer = setInterval(() => {
      // A real backend would re-fetch here; the mock just marks the sync.
      set({ syncedAt: Date.now() })
    }, HEARTBEAT_MS)
  },

  stopPolling: () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    if (runningTimer) clearInterval(runningTimer)
    heartbeatTimer = null
    runningTimer = null
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}))
