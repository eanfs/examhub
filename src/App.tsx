/**
 * App — composes the 考务可视化大屏.
 *
 * Fluid 100vw / 100vh layout (matches the design prototype `app.jsx`):
 * the surface fills the actual viewport so fonts render at literal size,
 * with no global down-scaling. Data load + polling are delegated to the
 * dashboard store.
 */

import { useEffect } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { TitleBar } from './components/TitleBar'
import { MetricsRing } from './components/MetricsRing'
import { SchoolWall } from './components/SchoolWall'
import { useDashboardStore } from './store/dashboardStore'
import styles from './App.module.css'

export default function App() {
  const snapshot = useDashboardStore((s) => s.snapshot)
  const loading = useDashboardStore((s) => s.loading)
  const error = useDashboardStore((s) => s.error)
  const load = useDashboardStore((s) => s.load)
  const refreshNow = useDashboardStore((s) => s.refreshNow)
  const loadExamList = useDashboardStore((s) => s.loadExamList)
  const startPolling = useDashboardStore((s) => s.startPolling)
  const stopPolling = useDashboardStore((s) => s.stopPolling)

  useEffect(() => {
    void load()
    void loadExamList()
    startPolling()
    return () => stopPolling()
  }, [load, loadExamList, startPolling, stopPolling])

  // 首次加载尚未拿到任何快照。
  if (!snapshot) {
    if (error && !loading) {
      return (
        <div className={styles.errorScreen}>
          <AlertTriangle size={36} color="#F87171" strokeWidth={1.5} />
          <div className={styles.errorMsg}>{error}</div>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={() => void refreshNow()}
          >
            <RotateCw size={14} strokeWidth={1.5} />
            重试
          </button>
        </div>
      )
    }
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <div className={styles.loadingText}>正在接入考务数据…</div>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      {error && (
        <div className={styles.staleBanner}>
          <AlertTriangle size={12} color="#F87171" strokeWidth={1.5} />
          数据更新失败 · 显示的是最近一次结果
        </div>
      )}
      <TitleBar />
      <MetricsRing data={snapshot.hero} />
      <SchoolWall schools={snapshot.schools} />
    </div>
  )
}
