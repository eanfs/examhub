/**
 * MetricsRing — the 7-tile circular KPI strip beneath the title bar.
 * Each tile pairs a decorative gradient ring + icon with an animated value.
 */

import type { ComponentType } from 'react'
import {
  FileCheck2,
  FileText,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  UserRoundCheck,
  Users,
} from 'lucide-react'
import type { HeroMetrics } from '../types'
import { useCountUp } from '../hooks/useCountUp'
import styles from './MetricsRing.module.css'

interface IconProps {
  size?: number
  color?: string
  strokeWidth?: number
}

interface Tile {
  key: string
  label: string
  value: number
  unit: string
  Icon: ComponentType<IconProps>
}

function MetricTile({ tile, index }: { tile: Tile; index: number }) {
  const value = useCountUp(tile.value)
  const gradientId = `ring-grad-${index}`
  const { Icon } = tile

  return (
    <div className={styles.tile} data-testid="metric-tile">
      <div className={styles.ring}>
        <svg className={styles.ringSvg} viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#5EEAF6" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="rgba(99,130,230,0.15)"
            strokeWidth="1.5"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="2"
            strokeDasharray="48 12 22 8 30 60"
            strokeLinecap="round"
            transform={`rotate(${-90 - index * 24} 32 32)`}
          />
          <circle
            cx="32"
            cy="32"
            r="23"
            fill="none"
            stroke="rgba(94,234,246,0.18)"
            strokeWidth="0.6"
          />
          <circle cx="32" cy="4" r="1.2" fill="#5EEAF6" />
          <circle cx="60" cy="32" r="1" fill="#5EEAF6" opacity="0.6" />
        </svg>
        <div className={styles.ringIcon}>
          <Icon size={24} color="#5EEAF6" strokeWidth={1.5} />
        </div>
      </div>

      <div className={styles.meta}>
        <div className={styles.label}>{tile.label}</div>
        <div className={styles.valueRow}>
          <span className={styles.value}>{value.toLocaleString()}</span>
          <span className={styles.unit}>{tile.unit}</span>
        </div>
      </div>
    </div>
  )
}

export function MetricsRing({ data }: { data: HeroMetrics }) {
  const tiles: Tile[] = [
    { key: 'venues', label: '考点数量', value: data.totalSchools, unit: '所', Icon: GraduationCap },
    { key: 'candidates', label: '考生总计', value: data.totalCandidates, unit: '人', Icon: Users },
    { key: 'expected', label: '考生应到', value: data.expectedToday, unit: '人', Icon: UserCheck },
    { key: 'actual', label: '考生实到', value: data.actualToday, unit: '人', Icon: UserRoundCheck },
    { key: 'papers', label: '应交答卷', value: data.expectedPapers, unit: '份', Icon: FileText },
    { key: 'submitted', label: '实交答卷', value: data.submittedPapers, unit: '份', Icon: FileCheck2 },
    { key: 'staff', label: '考务人员', value: data.staffCount, unit: '人', Icon: ShieldCheck },
  ]

  return (
    <div className={styles.strip} data-testid="metrics-ring">
      {tiles.map((t, i) => (
        <MetricTile key={t.key} tile={t} index={i} />
      ))}
    </div>
  )
}
