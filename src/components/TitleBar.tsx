/**
 * TitleBar — the 考务可视化大屏 title bar: an angular tech frame behind
 * the title, with the system clock (left), exam picker and refresh
 * control (right).
 */

import { Clock } from './Clock'
import { ExamPicker } from './ExamPicker'
import { RefreshControl } from './RefreshControl'
import styles from './TitleBar.module.css'

export function TitleBar() {
  return (
    <div className={styles.bar}>
      {/* Decorative angular frame. */}
      <svg
        className={styles.frame}
        viewBox="0 0 1920 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="tb-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
            <stop offset="50%" stopColor="#5EEAF6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 0 L780 0 L820 30 L1100 30 L1140 0 L1920 0"
          stroke="url(#tb-grad)"
          strokeWidth="1.2"
          fill="none"
        />
        <path
          d="M860 14 L880 30 L1060 30 L1080 14"
          stroke="#5EEAF6"
          strokeOpacity="0.5"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>

      <div className={styles.inner}>
        <Clock />

        <h1 className={styles.title}>考务可视化大屏</h1>

        <div className={styles.controls}>
          <ExamPicker />
          <RefreshControl />
        </div>
      </div>
    </div>
  )
}
