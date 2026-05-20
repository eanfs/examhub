/**
 * 把接口原始返回 ApiStatisticsResponse 适配成领域模型 DashboardSnapshot。
 * 这是「接口形状」与「UI 形状」之间唯一的转换层 —— 接口字段改名只动这里。
 */

import type {
  Batch,
  DashboardSnapshot,
  ExamRoom,
  School,
  SpecialCounts,
} from '../../types'
import type {
  ApiBatch,
  ApiClassArrange,
  ApiStation,
  ApiStatisticsResponse,
} from './apiTypes'
import { mapBatchStatus, mapSessionStatus } from './statusMapping'

/** 批次无考场时展示的占位考场（与原型 placeholderRoom 一致）。 */
function placeholderRoom(): ExamRoom {
  return {
    name: '-',
    sessions: [{ state: 'idle', draw: '-', login: '-', submit: '-' }],
  }
}

/** 一个考场 = 一组场次（同 className），按 stageNum 升序。 */
function adaptRoom(sessions: ApiClassArrange[]): ExamRoom {
  const sorted = [...sessions].sort((a, b) => a.stageNum - b.stageNum)
  return {
    name: sorted[0]?.className ?? '-',
    sessions: sorted.map((s) => ({
      state: mapSessionStatus(s.status),
      draw: s.drawLotsCount,
      login: s.loginCount,
      submit: s.submitPaperCount,
    })),
  }
}

function adaptBatch(b: ApiBatch): Batch {
  const rooms =
    b.classArrangeInfoList && b.classArrangeInfoList.length > 0
      ? b.classArrangeInfoList.map(adaptRoom)
      : [placeholderRoom()]
  return {
    label: b.batchName,
    status: mapBatchStatus(b.status),
    rooms,
  }
}

/** 该考点的特殊情况计数；接口未统计时字段为 null，统一回退为 0。 */
function adaptSpecial(st: ApiStation): SpecialCounts {
  return {
    absent: st.absenceCount ?? 0,
    late: st.lateCount ?? 0,
    violation: st.rvCount ?? 0,
    reported: st.reportCount ?? 0,
    handled: st.dealCount ?? 0,
  }
}

function adaptSchool(st: ApiStation): School {
  const batches = st.stationBatchStatusDtos.map(adaptBatch)
  // 批次进度只看正常批次（batchType===1），备用批次不计。
  const normal = st.stationBatchStatusDtos.filter((b) => b.batchType === 1)
  const done = normal.filter((b) => {
    const status = mapBatchStatus(b.status)
    return status === 'ended' || status === 'closed'
  }).length
  return {
    name: st.stationName,
    totalCandidates: st.totalStudentCount,
    batchProgress: { done, total: normal.length || batches.length },
    batches,
    special: adaptSpecial(st),
  }
}

/** 适配器入口：ApiStatisticsResponse → DashboardSnapshot。 */
export function adaptSnapshot(res: ApiStatisticsResponse): DashboardSnapshot {
  const d = res.data
  const firstBatch = d.examStationVo[0]?.stationBatchStatusDtos[0]
  return {
    exam: {
      id: firstBatch?.examId ?? '',
      name: firstBatch?.examName ?? '考务监控',
      subject: '',
      startedAt: firstBatch?.arriveTime ?? '',
      duration: 0,
      elapsedSec: 0,
    },
    hero: {
      totalSchools: d.stationCount,
      totalCandidates: d.studentCount,
      expectedToday: d.shouldArriveCount,
      actualToday: d.arrivedCount,
      expectedPapers: d.shouldSubmitCount,
      submittedPapers: d.submittedCount,
      staffCount: d.participantCount,
    },
    schools: d.examStationVo.map(adaptSchool),
  }
}
