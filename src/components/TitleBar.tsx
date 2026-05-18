/**
 * TitleBar — the 考务可视化大屏 title bar: an angular tech frame behind
 * the title, with a 切换 button, venue selector and 刷新 button.
 */

import { ChevronDown, LayoutGrid, MapPin, RotateCw } from 'lucide-react'
import styles from './TitleBar.module.css'

interface TitleBarProps {
  /** Current venue label shown in the selector. */
  venue?: string
  onSwitch?: () => void
  onRefresh?: () => void
  onSelectVenue?: () => void
}

export function TitleBar({
  venue = '上海市 · 全部考点',
  onSwitch,
  onRefresh,
  onSelectVenue,
}: TitleBarProps) {
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
        <button type="button" className={styles.ctrlBtn} onClick={onSwitch}>
          <LayoutGrid size={14} strokeWidth={1.5} />
          切换
        </button>

        <h1 className={styles.title}>考务可视化大屏</h1>

        <div className={styles.controls}>
          <button
            type="button"
            className={`${styles.ctrlBtn} ${styles.selector}`}
            onClick={onSelectVenue}
          >
            <span className={styles.selectorLabel}>
              <MapPin size={14} strokeWidth={1.5} />
              {venue}
            </span>
            <ChevronDown size={14} strokeWidth={1.5} />
          </button>
          <button type="button" className={styles.ctrlBtn} onClick={onRefresh}>
            <RotateCw size={14} strokeWidth={1.5} />
            刷新
          </button>
        </div>
      </div>
    </div>
  )
}
