/**
 * BatchCard — a batch (批次) rendered as a collapsible card: a clickable
 * header (always visible) over a 2-column grid of room tables (when open).
 * Active batches (running/drawing) glow; collapsed ones omit their body.
 */

import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Batch } from '../types'
import { STATUS } from '../lib/status'
import { ExamRoomTable } from './ExamRoomTable'
import styles from './BatchCard.module.css'

interface BatchCardProps {
  batch: Batch
  expanded: boolean
  onToggle: () => void
}

export function BatchCard({ batch, expanded, onToggle }: BatchCardProps) {
  const s = STATUS[batch.status]
  const isActive = batch.status === 'running' || batch.status === 'drawing'
  const roomCount = batch.rooms.filter((r) => r.name !== '-').length

  return (
    <div
      className={styles.card}
      data-testid="batch-card"
      data-status={batch.status}
      data-active={isActive}
      data-expanded={expanded}
    >
      <button
        type="button"
        className={styles.header}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className={styles.headLeft}>
          <span
            className={styles.accent}
            style={{ background: s.dot, boxShadow: `0 0 6px ${s.glow}` }}
          />
          <span className={styles.label}>
            批次 <span className={styles.labelStrong}>{batch.label}</span>
          </span>
          <span className={styles.statusTag} style={{ color: s.fg }}>
            <span
              className={styles.statusDot}
              data-pulse={batch.status === 'running'}
              style={{ background: s.dot }}
            />
            {s.label}
          </span>
        </span>

        <span className={styles.headRight}>
          <span>{roomCount} 考场</span>
          {expanded ? (
            <ChevronUp size={12} color="#94A3B8" strokeWidth={1.5} />
          ) : (
            <ChevronDown size={12} color="#94A3B8" strokeWidth={1.5} />
          )}
        </span>
      </button>

      {expanded && (
        <div className={styles.body} data-testid="batch-rooms">
          {batch.rooms.map((r, i) => (
            <ExamRoomTable key={i} room={r} />
          ))}
        </div>
      )}
    </div>
  )
}
