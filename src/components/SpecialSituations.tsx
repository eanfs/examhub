/**
 * SpecialSituations — the 特殊情况 side panel: a per-school table of
 * 缺考 / 迟到 / 违纪 counts with a 已上报 / 已处理 sub-row. Hidden by
 * default; toggled from the wall header.
 */

import { X } from 'lucide-react'
import type { SpecialSituation } from '../types'
import { AccentTitle } from './StatusBadge'
import styles from './SpecialSituations.module.css'

type Tone = 'amber' | 'red' | 'muted'

const TONE_COLOR: Record<Tone, string> = {
  amber: '#FBBF24',
  red: '#FB7185',
  muted: '#E2E8F0',
}

function NumCell({ value, tone }: { value: number; tone: Tone }) {
  return (
    <div
      className={styles.numCell}
      style={{ color: value === 0 ? '#475569' : TONE_COLOR[tone] }}
    >
      {value}
    </div>
  )
}

interface SpecialSituationsProps {
  data: SpecialSituation[]
  onClose: () => void
}

export function SpecialSituations({ data, onClose }: SpecialSituationsProps) {
  return (
    <aside className={styles.panel}>
      <div className={styles.head}>
        <AccentTitle size={16}>特殊情况</AccentTitle>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          title="关闭"
          aria-label="关闭特殊情况面板"
        >
          <X size={12} color="#94A3B8" strokeWidth={1.5} />
        </button>
      </div>

      <div className={styles.table}>
        <div className={styles.tableHead}>
          <div>学校名称</div>
          <div className={styles.colCenter}>缺考</div>
          <div className={styles.colCenter}>迟到</div>
          <div className={styles.colCenter}>违纪</div>
        </div>

        <div className={styles.body}>
          {data.map((row, i) => (
            <div key={i} className={styles.bodyRow}>
              <div className={styles.rowNums}>
                <div className={styles.schoolName}>{row.school}</div>
                <NumCell
                  value={row.absent}
                  tone={row.absent > 0 ? 'amber' : 'muted'}
                />
                <NumCell
                  value={row.late}
                  tone={row.late > 0 ? 'amber' : 'muted'}
                />
                <NumCell
                  value={row.violation}
                  tone={row.violation > 0 ? 'red' : 'muted'}
                />
              </div>
              <div className={styles.rowMeta}>
                <span>
                  已上报
                  <span className={styles.metaReported}>{row.reported}</span>
                </span>
                <span>
                  已处理
                  <span className={styles.metaHandled}>{row.handled}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
