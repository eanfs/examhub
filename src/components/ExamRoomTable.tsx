/**
 * ExamRoomTable — one exam room rendered as a card: header (room name +
 * 收卷 summary) over a sessions table (场次 / 状态 / 抽签 / 登录 / 收卷).
 */

import type { ExamRoom, Session } from '../types'
import { StatusBadge } from './StatusBadge'
import styles from './ExamRoomTable.module.css'

const COLS = ['场次', '状态', '抽签', '登录', '收卷'] as const

/** Render an em dash for unavailable values, otherwise the number. */
function cellValue(v: Session['draw']) {
  return v === '-' || v == null ? <span className={styles.dash}>—</span> : v
}

function SessionRow({ index, session }: { index: number; session: Session }) {
  const isRunning = session.state === 'running'
  const hasSubmit = typeof session.submit === 'number' && session.submit > 0
  // Tint the 收卷 cell so live progress reads at a glance.
  const submitColor = !isRunning ? '#E2E8F0' : hasSubmit ? '#4ADE80' : '#94A3B8'

  return (
    <>
      <div className={styles.cellIdx}>{index}</div>
      <div className={styles.cellStatus}>
        <StatusBadge status={session.state} size={15} />
      </div>
      <div className={styles.cellNum}>{cellValue(session.draw)}</div>
      <div className={styles.cellNum}>{cellValue(session.login)}</div>
      <div
        className={styles.cellNum}
        style={{
          color: submitColor,
          fontWeight: isRunning && hasSubmit ? 700 : 500,
        }}
      >
        {cellValue(session.submit)}
      </div>
    </>
  )
}

export function ExamRoomTable({ room }: { room: ExamRoom }) {
  if (room.name === '-') {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyMark}>—</div>
        <div className={styles.emptyLabel}>未启用</div>
      </div>
    )
  }

  // Aggregate counts for the header summary.
  const sum = room.sessions.reduce(
    (a, s) => ({
      draw: a.draw + (typeof s.draw === 'number' ? s.draw : 0),
      submit: a.submit + (typeof s.submit === 'number' ? s.submit : 0),
    }),
    { draw: 0, submit: 0 },
  )

  const hasRunning = room.sessions.some((s) => s.state === 'running')
  const hasDrawing =
    !hasRunning && room.sessions.some((s) => s.state === 'drawing')
  const tone = hasRunning ? 'running' : hasDrawing ? 'drawing' : 'idle'

  return (
    <div className={styles.card} data-tone={tone}>
      <div className={styles.header}>
        <div className={styles.name}>
          <span className={styles.bar} />
          <span className={styles.nameText}>{room.name}</span>
        </div>
        <div className={styles.summary}>
          收卷 <span className={styles.summaryStrong}>{sum.submit}</span>
          <span className={styles.summarySlash}>/</span>
          <span className={styles.summaryDraw}>{sum.draw}</span>
        </div>
      </div>

      <div className={styles.table}>
        {COLS.map((h, i) => (
          <div
            key={h}
            className={styles.colHead}
            data-align={i >= 2 ? 'right' : 'left'}
          >
            {h}
          </div>
        ))}
        {room.sessions.map((s, i) => (
          <SessionRow key={i} index={i + 1} session={s} />
        ))}
      </div>
    </div>
  )
}
