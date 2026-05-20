/**
 * StatusBadge — a tiny dot + label, used in batch headers and table cells.
 * AccentTitle — a small heading with the production "▌" accent bar.
 */

import type { ReactNode } from 'react'
import type { Status } from '../types'
import { STATUS } from '../lib/status'
import styles from './StatusBadge.module.css'

interface StatusBadgeProps {
  status: Status
  /** Font size in px (also drives layout). Defaults to 14. */
  size?: number
}

export function StatusBadge({ status, size = 14 }: StatusBadgeProps) {
  const s = STATUS[status]
  return (
    <span className={styles.badge} style={{ fontSize: size, color: s.fg }}>
      <span
        className={styles.dot}
        style={{ background: s.dot, boxShadow: `0 0 6px ${s.glow}` }}
      />
      {s.label}
    </span>
  )
}

interface AccentTitleProps {
  children: ReactNode
  /** Accent bar color. Defaults to the cobalt brand blue. */
  color?: string
  size?: number
}

export function AccentTitle({
  children,
  color = '#3B82F6',
  size = 16,
}: AccentTitleProps) {
  return (
    <div className={styles.title} style={{ fontSize: size }}>
      <span className={styles.bar} style={{ background: color, height: size }} />
      {children}
    </div>
  )
}
