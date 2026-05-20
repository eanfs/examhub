/**
 * Mock data for the ExamHub 考务可视化大屏.
 *
 * This is the single seam where real data ingest would plug in: replace
 * `fetchSnapshot` with a WebSocket / HTTP client and the rest of the app
 * is unchanged. Until then it models a busy exam day across many schools.
 */

import type {
  Batch,
  DashboardSnapshot,
  ExamListItem,
  ExamRoom,
  Session,
  Status,
} from '../types'

/* ---------- builders ---------- */

const session = (
  state: Status,
  draw: Session['draw'],
  login: Session['login'],
  submit: Session['submit'],
): Session => ({ state, draw, login, submit })

const room = (name: string, sessions: Session[]): ExamRoom => ({
  name,
  sessions,
})

const batch = (label: string, status: Status, rooms: ExamRoom[]): Batch => ({
  label,
  status,
  rooms,
})

/* ---------- reusable room patterns ---------- */

const fullyEndedRooms = (
  drawN: number,
  loginN: number,
  submitN: number,
): ExamRoom[] => [
  room('化学考场2', [
    session('ended', drawN, loginN, submitN),
    session('ended', drawN, loginN, submitN),
    session('ended', drawN, loginN - 2, submitN - 2),
    session('ended', drawN, loginN - 2, submitN - 2),
  ]),
  room('物理考场1', [
    session('ended', drawN, loginN + 3, submitN + 3),
    session('ended', drawN, loginN + 3, submitN + 3),
    session('ended', drawN, loginN - 1, submitN - 1),
    session('ended', drawN, loginN - 1, submitN - 1),
  ]),
]

const runningRooms = (drawN: number): ExamRoom[] => [
  room('化学考场2', [
    session('running', drawN, drawN, Math.floor(drawN * 0.4)),
    session('running', drawN, drawN, Math.floor(drawN * 0.35)),
  ]),
  room('物理考场1', [
    session('running', drawN, drawN, Math.floor(drawN * 0.55)),
    session('running', drawN, drawN, Math.floor(drawN * 0.5)),
  ]),
]

const drawingRooms = (drawN: number): ExamRoom[] => [
  room('化学考场2', [
    session('drawing', drawN, '-', '-'),
    session('drawing', drawN, '-', '-'),
  ]),
  room('物理考场1', [
    session('drawing', drawN, '-', '-'),
    session('drawing', drawN, '-', '-'),
  ]),
]

const placeholderRoom = (): ExamRoom[] => [
  room('-', [session('idle', '-', '-', '-')]),
]

/**
 * Build N batches with a realistic mix: the first `done` are ended, then
 * one running and one drawing batch, the rest idle. Two backup batches
 * (备用批次) are always appended.
 */
function makeBatches(total: number, done: number): Batch[] {
  const arr: Batch[] = []
  for (let i = 1; i <= total; i++) {
    if (i <= done) {
      arr.push(
        batch(String(i), 'ended', fullyEndedRooms(24, 17 + (i % 4), 17 + (i % 4))),
      )
    } else if (i === done + 1) {
      arr.push(batch(String(i), 'running', runningRooms(24)))
    } else if (i === done + 2) {
      arr.push(batch(String(i), 'drawing', drawingRooms(24)))
    } else {
      arr.push(batch(String(i), 'idle', placeholderRoom()))
    }
  }
  arr.push(batch('备用批次1', 'idle', placeholderRoom()))
  arr.push(batch('备用批次2', 'idle', placeholderRoom()))
  return arr
}

/* ---------- snapshot factory ---------- */

/** Produce a fresh, independent dashboard snapshot. */
export function createSnapshot(): DashboardSnapshot {
  const schools: DashboardSnapshot['schools'] = [
    {
      name: '上海市铁岭中学',
      totalCandidates: 343,
      batchProgress: { done: 6, total: 10 },
      batches: makeBatches(10, 6),
      special: { absent: 13, late: 0, violation: 0, reported: 48, handled: 0 },
    },
    {
      name: '上海市第十五中学',
      totalCandidates: 341,
      batchProgress: { done: 6, total: 10 },
      batches: makeBatches(10, 6),
      special: { absent: 11, late: 0, violation: 0, reported: 44, handled: 0 },
    },
    {
      name: '上海市浦东初级中学',
      totalCandidates: 385,
      batchProgress: { done: 5, total: 11 },
      batches: makeBatches(11, 5),
      special: { absent: 19, late: 0, violation: 0, reported: 76, handled: 0 },
    },
    {
      name: '复旦大学附属中学',
      totalCandidates: 424,
      batchProgress: { done: 8, total: 12 },
      batches: makeBatches(12, 8),
      special: { absent: 22, late: 0, violation: 0, reported: 70, handled: 0 },
    },
    {
      name: '华东师范大学第二附属中学',
      totalCandidates: 472,
      batchProgress: { done: 14, total: 20 },
      batches: makeBatches(20, 14),
      special: { absent: 15, late: 0, violation: 0, reported: 52, handled: 0 },
    },
    {
      // "全部完成" school — backups dropped, all 9 batches ended.
      name: '上海市曹杨第二中学',
      totalCandidates: 318,
      batchProgress: { done: 9, total: 9 },
      batches: makeBatches(9, 9).slice(0, 9),
      special: { absent: 23, late: 1, violation: 0, reported: 92, handled: 1 },
    },
    {
      name: '南洋模范中学',
      totalCandidates: 366,
      batchProgress: { done: 18, total: 30 },
      batches: makeBatches(30, 18),
      special: { absent: 33, late: 0, violation: 0, reported: 124, handled: 0 },
    },
  ]

  return {
    exam: {
      id: 'EXAM-GK-2025-MOCK-04',
      name: '上海市 2025 年高三第二次模拟考试',
      subject: '全科联考',
      startedAt: '08:00:00',
      duration: 240,
      elapsedSec: 9437,
    },
    hero: {
      totalSchools: 20,
      totalCandidates: 7038,
      expectedToday: 7038,
      actualToday: 14909,
      expectedPapers: 14909,
      submittedPapers: 14032,
      staffCount: 60,
    },
    schools,
  }
}

/**
 * Mock 考试列表（标题栏选择器用）。首项 id 与 createSnapshot 的
 * exam.id 一致，使 mock 模式下选择器能正确高亮当前考试。
 */
export function createExamList(): ExamListItem[] {
  return [
    {
      id: 'EXAM-GK-2025-MOCK-04',
      name: '上海市 2025 年高三第二次模拟考试',
      status: 2,
      startDate: '2025-06-07',
      endDate: '2025-06-09',
    },
    {
      id: 'EXAM-GK-2025-MOCK-03',
      name: '上海市 2025 年高三第一次模拟考试',
      status: 4,
      startDate: '2025-03-12',
      endDate: '2025-03-14',
    },
    {
      id: 'EXAM-LH-2026-MOCK-01',
      name: '崇明区 2026 年理化实验考（模拟）',
      status: 1,
      startDate: '2026-05-16',
      endDate: '2026-05-16',
    },
  ]
}
