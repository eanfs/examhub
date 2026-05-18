/**
 * App — composes the 考务可视化大屏 and owns the fixed 1920×1080 stage.
 *
 * The stage keeps the handoff's pixel-exact coordinate system; a single
 * `transform: scale()` fits it to any display (wall projector → laptop).
 * Data load + polling are delegated to the dashboard store.
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { TitleBar } from './components/TitleBar'
import { MetricsRing } from './components/MetricsRing'
import { SchoolWall } from './components/SchoolWall'
import { useDashboardStore } from './store/dashboardStore'
import styles from './App.module.css'

const STAGE_W = 1920
const STAGE_H = 1080

/** Scale factor that fits the 1920×1080 stage inside the viewport. */
function useStageScale(): number {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const compute = () =>
      setScale(
        Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H),
      )
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])
  return scale
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    void document.exitFullscreen()
  } else {
    void document.documentElement.requestFullscreen?.()
  }
}

export default function App() {
  const scale = useStageScale()
  const snapshot = useDashboardStore((s) => s.snapshot)
  const loading = useDashboardStore((s) => s.loading)
  const error = useDashboardStore((s) => s.error)
  const load = useDashboardStore((s) => s.load)
  const startPolling = useDashboardStore((s) => s.startPolling)
  const stopPolling = useDashboardStore((s) => s.stopPolling)

  useEffect(() => {
    void load()
    startPolling()
    return () => stopPolling()
  }, [load, startPolling, stopPolling])

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
            onClick={() => void load()}
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
    <div className={styles.viewport}>
      <div className={styles.stage} style={{ transform: `scale(${scale})` }}>
        <div className={styles.screen}>
          {error && (
            <div className={styles.staleBanner}>
              <AlertTriangle size={12} color="#F87171" strokeWidth={1.5} />
              数据更新失败 · 显示的是最近一次结果
            </div>
          )}
          <TitleBar onSwitch={toggleFullscreen} onRefresh={() => void load()} />
          <MetricsRing data={snapshot.hero} />
          <SchoolWall schools={snapshot.schools} special={snapshot.special} />
        </div>
      </div>
    </div>
  )
}
