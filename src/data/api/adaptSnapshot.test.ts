import { describe, expect, test } from 'vitest'
import type { ApiStatisticsResponse } from './apiTypes'
import { adaptSnapshot } from './adaptSnapshot'

/** 一份精简但结构完整的样例响应：1 个考点、1 个已结束批次（2 考场）、1 个空备用批次。 */
const FIXTURE: ApiStatisticsResponse = {
  code: 200,
  msg: '操作成功',
  success: true,
  data: {
    studentCount: 7038,
    participantCount: 60,
    shouldArriveCount: 7038,
    arrivedCount: 25595,
    shouldSubmitCount: 25595,
    submittedCount: 25590,
    stationCount: 20,
    examStationVo: [
      {
        id: 'st-1',
        stationName: '上海市铁岭中学',
        totalStudentCount: 343,
        absenceCount: 23,
        lateCount: 0,
        rvCount: 0,
        reportCount: 92,
        dealCount: 0,
        stationBatchStatusDtos: [
          {
            id: 'b-1',
            examId: 'ex-1',
            stationId: 'st-1',
            batchType: 1,
            batchNum: 1,
            batchName: '1',
            arriveTime: '2026-05-16 07:30:00',
            status: 3,
            spareBatchStatus: 0,
            batchNameAs: 0,
            examName: '2026年杨浦区理化实验考试',
            stationName: '上海市铁岭中学',
            classArrangeInfoList: [
              [
                { examId: 'ex-1', stationId: 'st-1', batchId: 'b-1', classArrangeId: 'c-2', stageNum: 2, classId: 'cl-1', className: '化学考场2', drawLotsCount: 24, loginCount: 22, submitPaperCount: 22, absenceCount: 2, status: 4 },
                { examId: 'ex-1', stationId: 'st-1', batchId: 'b-1', classArrangeId: 'c-1', stageNum: 1, classId: 'cl-1', className: '化学考场2', drawLotsCount: 24, loginCount: 23, submitPaperCount: 23, absenceCount: 1, status: 4 },
              ],
              [
                { examId: 'ex-1', stationId: 'st-1', batchId: 'b-1', classArrangeId: 'c-3', stageNum: 1, classId: 'cl-2', className: '物理考场1', drawLotsCount: 24, loginCount: 23, submitPaperCount: 21, absenceCount: 1, status: 3 },
              ],
            ],
          },
          {
            id: 'b-2',
            examId: 'ex-1',
            stationId: 'st-1',
            batchType: 2,
            batchNum: 1001,
            batchName: '备用批次1',
            arriveTime: '2026-05-16 07:30:00',
            status: 0,
            spareBatchStatus: 2,
            batchNameAs: 0,
            examName: '2026年杨浦区理化实验考试',
            stationName: '上海市铁岭中学',
            classArrangeInfoList: null,
          },
        ],
      },
    ],
  },
}

describe('adaptSnapshot', () => {
  test('hero 指标映射', () => {
    const { hero } = adaptSnapshot(FIXTURE)
    expect(hero).toEqual({
      totalSchools: 20,
      totalCandidates: 7038,
      expectedToday: 7038,
      actualToday: 25595,
      expectedPapers: 25595,
      submittedPapers: 25590,
      staffCount: 60,
    })
  })

  test('考点基本信息', () => {
    const school = adaptSnapshot(FIXTURE).schools[0]
    expect(school.name).toBe('上海市铁岭中学')
    expect(school.totalCandidates).toBe(343)
  })

  test('批次进度只统计正常批次', () => {
    // 1 个正常批次（已结束），1 个备用批次（不计入）。
    expect(adaptSnapshot(FIXTURE).schools[0].batchProgress).toEqual({
      done: 1,
      total: 1,
    })
  })

  test('已结束批次映射为 2 个考场', () => {
    const batch = adaptSnapshot(FIXTURE).schools[0].batches[0]
    expect(batch.label).toBe('1')
    expect(batch.status).toBe('ended')
    expect(batch.rooms).toHaveLength(2)
  })

  test('考场场次按 stageNum 排序，状态码映射正确', () => {
    const room = adaptSnapshot(FIXTURE).schools[0].batches[0].rooms[0]
    expect(room.name).toBe('化学考场2')
    // 排序后第一个应是 stageNum=1（loginCount 23），而非 fixture 里先出现的 stageNum=2。
    expect(room.sessions[0]).toEqual({
      state: 'ended',
      draw: 24,
      login: 23,
      submit: 23,
    })
    // 物理考场1 的 status=3 应映射为 running。
    const physics = adaptSnapshot(FIXTURE).schools[0].batches[0].rooms[1]
    expect(physics.sessions[0].state).toBe('running')
  })

  test('无考场的批次映射为占位考场', () => {
    const batch = adaptSnapshot(FIXTURE).schools[0].batches[1]
    expect(batch.status).toBe('idle')
    expect(batch.rooms).toHaveLength(1)
    expect(batch.rooms[0].name).toBe('-')
  })

  test('特殊情况内联到对应考点', () => {
    expect(adaptSnapshot(FIXTURE).schools[0].special).toEqual({
      absent: 23,
      late: 0,
      violation: 0,
      reported: 92,
      handled: 0,
    })
  })
})
