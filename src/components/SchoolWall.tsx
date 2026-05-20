/**
 * SchoolWall — the main monitoring area: a cross-school summary header
 * over a scrolling list of school rows. 特殊情况 counts now live inline
 * in each SchoolRow; the header carries their cross-school totals.
 */

import { useMemo } from 'react'
import type { School, Status } from '../types'
import { AccentTitle, StatusBadge } from './StatusBadge'
import { SchoolRow } from './SchoolRow'
import styles from './SchoolWall.module.css'

const LEGEND: Status[] = ['running', 'drawing', 'ended', 'closed', 'idle']

function SummaryStat({
  label,
  value,
  color,
  pulse,
}: {
  label: string
  value: number
  color: string
  pulse?: boolean
}) {
  return (
    <div className={styles.summaryStat}>
      <span
        className={styles.summaryDot}
        data-pulse={pulse}
        style={{
          background: color,
          boxShadow: pulse ? `0 0 8px ${color}` : 'none',
        }}
      />
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue} style={{ color }}>
        {value}
      </span>
    </div>
  )
}

function WallHeader({ schools }: { schools: School[] }) {
  const summary = useMemo(() => {
    let running = 0
    let drawing = 0
    let ended = 0
    let total = 0
    let absent = 0
    let late = 0
    let violation = 0
    schools.forEach((s) => {
      s.batches.forEach((b) => {
        total += 1
        if (b.status === 'running') running += 1
        else if (b.status === 'drawing') drawing += 1
        else if (b.status === 'ended') ended += 1
      })
      absent += s.special.absent
      late += s.special.late
      violation += s.special.violation
    })
    return { running, drawing, ended, total, absent, late, violation }
  }, [schools])

  return (
    <div className={styles.header} data-testid="wall-header">
      <div className={styles.headerLeft}>
        <AccentTitle size={16}>今日批次实况</AccentTitle>
        <div className={styles.divider} />
        <SummaryStat label="正在进行" value={summary.running} color="#4ADE80" pulse />
        <SummaryStat label="已抽签待开" value={summary.drawing} color="#E879F9" />
        <SummaryStat label="已结束" value={summary.ended} color="#5EEAF6" />
        <SummaryStat label="今日批次" value={summary.total} color="#E2E8F0" />
        <div className={styles.divider} />
        <SummaryStat
          label="缺考"
          value={summary.absent}
          color={summary.absent ? '#FBBF24' : '#E2E8F0'}
        />
        <SummaryStat
          label="迟到"
          value={summary.late}
          color={summary.late ? '#FBBF24' : '#E2E8F0'}
        />
        <SummaryStat
          label="违纪"
          value={summary.violation}
          color={summary.violation ? '#FB7185' : '#E2E8F0'}
        />
      </div>

      <div className={styles.headerRight}>
        <div className={styles.legend}>
          {LEGEND.map((k) => (
            <StatusBadge key={k} status={k} size={13} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SchoolWall({ schools }: { schools: School[] }) {
  return (
    <main className={styles.main} data-testid="school-wall">
      <div className={styles.column}>
        <WallHeader schools={schools} />
        <div className={styles.scroll}>
          {schools.map((s) => (
            <SchoolRow key={s.name} school={s} />
          ))}
          <div className={styles.scrollTail} />
        </div>
      </div>
    </main>
  )
}
