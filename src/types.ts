/**
 * Domain model for the ExamHub 考务可视化大屏.
 * Mirrors the data model in the design handoff README.
 */

/** Lifecycle of a batch / session. */
export type Status = 'running' | 'drawing' | 'ended' | 'closed' | 'idle'

/** A cell value that may be unavailable (rendered as an em dash). */
export type Counted = number | '-'

/** A single exam session (场次) inside a room. */
export interface Session {
  state: Status
  /** 抽签人数 */
  draw: Counted
  /** 登录人数 */
  login: Counted
  /** 收卷数量 */
  submit: Counted
}

/** An exam room (考场) running 2-4 sessions. */
export interface ExamRoom {
  /** Room name, e.g. 物理考场1. `"-"` marks an unused placeholder slot. */
  name: string
  sessions: Session[]
}

/** A batch (批次) — one time-slot's worth of rooms. */
export interface Batch {
  /** Batch label, e.g. "1" | "2" | "备用批次1". */
  label: string
  status: Status
  rooms: ExamRoom[]
}

/** Per-school 特殊情况 counts, rendered inline in each school row. */
export interface SpecialCounts {
  /** 缺考 */
  absent: number
  /** 迟到 */
  late: number
  /** 违纪 */
  violation: number
  /** 已上报 */
  reported: number
  /** 已处理 */
  handled: number
}

/** A school / exam venue (考点). */
export interface School {
  name: string
  totalCandidates: number
  batchProgress: { done: number; total: number }
  batches: Batch[]
  /** 该考点的特殊情况计数（缺考 / 迟到 / 违纪 / 已上报 / 已处理）。 */
  special: SpecialCounts
}

/** The 7 hero KPIs shown in the metric rings. */
export interface HeroMetrics {
  /** 考点数量 */
  totalSchools: number
  /** 考生总计 */
  totalCandidates: number
  /** 考生应到 */
  expectedToday: number
  /** 考生实到 */
  actualToday: number
  /** 应交答卷 */
  expectedPapers: number
  /** 实交答卷 */
  submittedPapers: number
  /** 考务人员 */
  staffCount: number
}

/** The exam being monitored. */
export interface ExamMeta {
  id: string
  name: string
  subject: string
  startedAt: string
  /** Total exam duration in minutes. */
  duration: number
  /** Seconds elapsed since the exam started. */
  elapsedSec: number
}

/** Full snapshot the dashboard renders from. */
export interface DashboardSnapshot {
  exam: ExamMeta
  hero: HeroMetrics
  schools: School[]
}

/** One exam in the title-bar exam picker. */
export interface ExamListItem {
  /** 考试 ID，作为统计接口的 examId。 */
  id: string
  /** 考试名称，选择器中显示。 */
  name: string
  /** 考试状态码（接口 examStatus，枚举未知，仅透传）。 */
  status: number
  /** 考试起止日期（yyyy-MM-dd）。 */
  startDate: string
  endDate: string
}
