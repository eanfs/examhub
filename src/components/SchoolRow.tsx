/**
 * SchoolRow — one school's full batch display, density-optimized:
 *   - active batches (running/drawing) stay expanded
 *   - ended / idle batches collapse into clickable summary strips
 * The left identity panel carries the school's KPIs.
 */

import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import type { School, Status } from '../types'
import { STATUS } from '../lib/status'
import { BatchCard } from './BatchCard'
import { useCountUp } from '../hooks/useCountUp'
import styles from './SchoolRow.module.css'

/* ---------- status counter ---------- */

function Counter({
  status,
  value,
  highlight,
}: {
  status: Status
  value: number
  highlight?: boolean
}) {
  const s = STATUS[status]
  return (
    <span className={styles.counter}>
      <span
        className={styles.counterDot}
        data-pulse={highlight && status === 'running'}
        style={{
          background: s.dot,
          boxShadow: highlight ? `0 0 8px ${s.glow}` : 'none',
        }}
      />
      {s.label}
      <span
        className={styles.counterValue}
        style={{ color: value > 0 ? '#E2E8F0' : '#475569' }}
      >
        {value}
      </span>
    </span>
  )
}

/* ---------- collapsed-group chip ---------- */

function ChipMini({
  label,
  kind,
  expanded,
  onClick,
}: {
  label: string
  kind: Status
  expanded: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  const s = STATUS[kind]
  return (
    <button
      type="button"
      className={styles.chip}
      data-expanded={expanded}
      onClick={onClick}
    >
      <span className={styles.chipDot} style={{ background: s.dot }} />
      {label}
    </button>
  )
}

/* ---------- collapsed status group ---------- */

interface GroupedStripProps {
  kind: Status
  label: string
  indices: number[]
  school: School
  open: Set<number>
  onToggleOne: (i: number) => void
  revealed: boolean
  onReveal: () => void
}

function GroupedStrip({
  kind,
  label,
  indices,
  school,
  open,
  onToggleOne,
  revealed,
  onReveal,
}: GroupedStripProps) {
  const s = STATUS[kind]
  const openHere = indices.filter((i) => open.has(i))

  return (
    <div className={styles.group}>
      <div
        className={styles.stripRow}
        role="button"
        tabIndex={0}
        onClick={onReveal}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onReveal()
          }
        }}
      >
        <span className={styles.stripBar} style={{ background: s.dot }} />
        <span className={styles.stripLabel} style={{ color: s.fg }}>
          {label}
        </span>
        <span className={styles.stripCount}>{indices.length}</span>
        <span className={styles.stripSep}>·</span>

        <span className={styles.chips}>
          {indices.map((i) => (
            <ChipMini
              key={i}
              label={school.batches[i].label}
              kind={kind}
              expanded={open.has(i)}
              onClick={(e) => {
                e.stopPropagation()
                onToggleOne(i)
              }}
            />
          ))}
        </span>

        {revealed || openHere.length > 0 ? (
          <ChevronUp size={12} color="#94A3B8" strokeWidth={1.5} />
        ) : (
          <ChevronDown size={12} color="#94A3B8" strokeWidth={1.5} />
        )}
      </div>

      {openHere.map((i) => (
        <BatchCard
          key={i}
          batch={school.batches[i]}
          expanded
          onToggle={() => onToggleOne(i)}
        />
      ))}
    </div>
  )
}

/* ---------- school row ---------- */

export function SchoolRow({ school }: { school: School }) {
  // Group batch indices by status family.
  const groups = useMemo(() => {
    const active: number[] = []
    const ended: number[] = []
    const idle: number[] = []
    school.batches.forEach((b, i) => {
      if (b.status === 'running' || b.status === 'drawing') active.push(i)
      else if (b.status === 'ended' || b.status === 'closed') ended.push(i)
      else idle.push(i)
    })
    return { active, ended, idle }
  }, [school])

  // Batches individually toggled open beyond the active-only default.
  const [open, setOpen] = useState<Set<number>>(() => new Set(groups.active))
  const [showEnded, setShowEnded] = useState(false)
  const [showIdle, setShowIdle] = useState(false)

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  const counts = useMemo(() => {
    const c: Record<Status, number> = {
      running: 0,
      drawing: 0,
      ended: 0,
      closed: 0,
      idle: 0,
    }
    school.batches.forEach((b) => {
      c[b.status] += 1
    })
    return c
  }, [school])
  const hasActive = counts.running + counts.drawing > 0

  // Live submission ratio across running rooms.
  const submitNow = useMemo(() => {
    let s = 0
    let t = 0
    school.batches.forEach((b) => {
      if (b.status !== 'running') return
      b.rooms.forEach((r) =>
        r.sessions.forEach((sn) => {
          if (typeof sn.draw === 'number') t += sn.draw
          if (typeof sn.submit === 'number') s += sn.submit
        }),
      )
    })
    return { s, t }
  }, [school])
  const liveSubmitted = useCountUp(submitNow.s)

  const progressPct =
    (school.batchProgress.done / school.batchProgress.total) * 100
  const accentColor = hasActive ? '#4ADE80' : '#3B82F6'
  const accentGlow = hasActive
    ? 'rgba(74,222,128,0.55)'
    : 'rgba(59,130,246,0.55)'

  return (
    <div className={styles.row}>
      {/* ── identity panel ─────────────────────────────── */}
      <div className={styles.identity}>
        <div className={styles.idHead}>
          <span
            className={styles.idBar}
            style={{
              background: accentColor,
              boxShadow: `0 0 6px ${accentGlow}`,
            }}
          />
          <div className={styles.schoolName}>{school.name}</div>
        </div>

        <div className={`${styles.indent} ${styles.candidates}`}>
          考生
          <span className={styles.candidatesValue}>
            {school.totalCandidates}
          </span>
        </div>

        <div className={styles.indent}>
          <div className={styles.progressLabel}>
            批次进度
            <span className={styles.spacer} />
            <span className={styles.progressDone}>
              {school.batchProgress.done}
            </span>
            <span className={styles.progressTotal}>
              /{school.batchProgress.total}
            </span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {hasActive && submitNow.t > 0 && (
          <div className={styles.liveRatio}>
            <span className={styles.liveDot} />
            实时收卷
            <span className={styles.spacer} />
            <span className={styles.liveNow}>{liveSubmitted}</span>
            <span className={styles.liveSlash}>/</span>
            <span className={styles.liveTotal}>{submitNow.t}</span>
          </div>
        )}

        <div className={styles.counters}>
          {counts.running > 0 && (
            <Counter status="running" value={counts.running} highlight />
          )}
          {counts.drawing > 0 && (
            <Counter status="drawing" value={counts.drawing} highlight />
          )}
          <Counter status="ended" value={counts.ended} />
          {counts.closed > 0 && (
            <Counter status="closed" value={counts.closed} />
          )}
          {counts.idle > 0 && <Counter status="idle" value={counts.idle} />}
        </div>
      </div>

      {/* ── right: active batches + collapsed strips ────── */}
      <div className={styles.batches}>
        {groups.active.length === 0 &&
          groups.ended.length === school.batches.length && (
            <div className={styles.allEnded}>
              <CheckCircle2 size={14} color="#5EEAF6" strokeWidth={1.5} />
              今日全部批次已结束
            </div>
          )}

        {groups.active.length > 0 && (
          <div
            className={styles.activeGrid}
            data-single={groups.active.length === 1}
          >
            {groups.active.map((i) => (
              <BatchCard
                key={i}
                batch={school.batches[i]}
                expanded={open.has(i)}
                onToggle={() => toggle(i)}
              />
            ))}
          </div>
        )}

        {groups.ended.length > 0 && (
          <GroupedStrip
            kind="ended"
            label="已结束"
            indices={groups.ended}
            school={school}
            open={open}
            onToggleOne={toggle}
            revealed={showEnded}
            onReveal={() => setShowEnded((v) => !v)}
          />
        )}

        {groups.idle.length > 0 && (
          <GroupedStrip
            kind="idle"
            label="未开始"
            indices={groups.idle}
            school={school}
            open={open}
            onToggleOne={toggle}
            revealed={showIdle}
            onReveal={() => setShowIdle((v) => !v)}
          />
        )}
      </div>
    </div>
  )
}
