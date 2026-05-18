/**
 * SchoolWall — the main monitoring area: a cross-school summary header
 * over a scrolling list of school rows, with the optional 特殊情况 panel.
 */

import { useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
import type { School, SpecialSituation, Status } from '../types'
import { useDashboardStore } from '../store/dashboardStore'
import { AccentTitle, StatusBadge } from './StatusBadge'
import { SchoolRow } from './SchoolRow'
import { SpecialSituations } from './SpecialSituations'
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

function WallHeader({
  schools,
  specialCount,
  sidebarOpen,
  onToggleSidebar,
}: {
  schools: School[]
  specialCount: number
  sidebarOpen: boolean
  onToggleSidebar: () => void
}) {
  const summary = useMemo(() => {
    let running = 0
    let drawing = 0
    let ended = 0
    let total = 0
    schools.forEach((s) =>
      s.batches.forEach((b) => {
        total += 1
        if (b.status === 'running') running += 1
        else if (b.status === 'drawing') drawing += 1
        else if (b.status === 'ended') ended += 1
      }),
    )
    return { running, drawing, ended, total }
  }, [schools])

  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <AccentTitle size={14}>今日批次实况</AccentTitle>
        <div className={styles.divider} />
        <SummaryStat label="正在进行" value={summary.running} color="#4ADE80" pulse />
        <SummaryStat label="已抽签待开" value={summary.drawing} color="#E879F9" />
        <SummaryStat label="已结束" value={summary.ended} color="#5EEAF6" />
        <SummaryStat label="今日批次" value={summary.total} color="#E2E8F0" />
      </div>

      <div className={styles.headerRight}>
        <div className={styles.legend}>
          {LEGEND.map((k) => (
            <StatusBadge key={k} status={k} size={11} />
          ))}
        </div>
        <button
          type="button"
          className={styles.specialBtn}
          data-open={sidebarOpen}
          onClick={onToggleSidebar}
          title={sidebarOpen ? '隐藏特殊情况' : '显示特殊情况'}
        >
          <AlertCircle
            size={12}
            color={sidebarOpen ? '#FBBF24' : '#94A3B8'}
            strokeWidth={1.5}
          />
          特殊情况
          <span className={styles.specialCount}>{specialCount}</span>
        </button>
      </div>
    </div>
  )
}

interface SchoolWallProps {
  schools: School[]
  special: SpecialSituation[]
}

export function SchoolWall({ schools, special }: SchoolWallProps) {
  const sidebarOpen = useDashboardStore((s) => s.sidebarOpen)
  const toggleSidebar = useDashboardStore((s) => s.toggleSidebar)
  const closeSidebar = useDashboardStore((s) => s.closeSidebar)

  return (
    <main className={styles.main}>
      <div className={styles.column}>
        <WallHeader
          schools={schools}
          specialCount={special.length}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <div className={styles.scroll}>
          {schools.map((s, i) => (
            <SchoolRow key={i} school={s} />
          ))}
          <div className={styles.scrollTail} />
        </div>
      </div>

      {sidebarOpen && (
        <SpecialSituations data={special} onClose={closeSidebar} />
      )}
    </main>
  )
}
