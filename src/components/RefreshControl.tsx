/**
 * RefreshControl — 标题栏右上角的刷新控件。
 * 显示当前自动刷新间隔；点开可立即刷新或选择新的间隔（最小 30s）。
 */

import { useState } from 'react'
import { Check, ChevronDown, RotateCw } from 'lucide-react'
import { useDashboardStore } from '../store/dashboardStore'
import styles from './RefreshControl.module.css'

/** 可选的自动刷新间隔。 */
const INTERVALS = [
  { ms: 30_000, label: '30 秒' },
  { ms: 60_000, label: '1 分钟' },
  { ms: 120_000, label: '2 分钟' },
  { ms: 300_000, label: '5 分钟' },
]

export function RefreshControl() {
  const refreshInterval = useDashboardStore((s) => s.refreshInterval)
  const setRefreshInterval = useDashboardStore((s) => s.setRefreshInterval)
  const refreshNow = useDashboardStore((s) => s.refreshNow)

  const [open, setOpen] = useState(false)

  const current = INTERVALS.find((o) => o.ms === refreshInterval)
  const label = current?.label ?? `${Math.round(refreshInterval / 1000)} 秒`

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        data-testid="refresh-control-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <RotateCw size={14} strokeWidth={1.5} />
        <span>自动刷新 · {label}</span>
        <ChevronDown size={14} strokeWidth={1.5} />
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.menu} data-testid="refresh-control-menu">
            <button
              type="button"
              className={styles.manual}
              onClick={() => {
                void refreshNow()
                setOpen(false)
              }}
            >
              <RotateCw size={13} strokeWidth={1.5} />
              立即刷新
            </button>
            <div className={styles.sep} />
            <div className={styles.groupLabel}>自动刷新间隔</div>
            {INTERVALS.map((o) => {
              const active = o.ms === refreshInterval
              return (
                <button
                  key={o.ms}
                  type="button"
                  className={styles.item}
                  data-active={active}
                  onClick={() => {
                    setRefreshInterval(o.ms)
                    setOpen(false)
                  }}
                >
                  <span>{o.label}</span>
                  {active && <Check size={13} strokeWidth={2} color="#5EEAF6" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
