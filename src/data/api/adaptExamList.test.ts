import { describe, expect, test } from 'vitest'
import type { ApiExamListResponse } from './apiTypes'
import { adaptExamList } from './adaptExamList'

/** 两个考试的精简样例响应。 */
const FIXTURE: ApiExamListResponse = {
  code: 200,
  msg: '操作成功',
  success: true,
  data: [
    {
      id: '2054380351736410113',
      examName: '崇明区2026年理化实验考',
      examCode: '1506302621000925184',
      examStatus: 4,
      examStartDate: '2026-05-16',
      examEndDate: '2026-05-16',
      examType: 3,
      status: 1,
    },
    {
      id: '2053711919844061186',
      examName: '杨浦区2026年理化实验考',
      examCode: '1506302621000925185',
      examStatus: 1,
      examStartDate: '2026-05-20',
      examEndDate: '2026-05-21',
      examType: 3,
      status: 1,
    },
  ],
}

describe('adaptExamList', () => {
  test('映射 id / name / status / 起止日期', () => {
    expect(adaptExamList(FIXTURE)).toEqual([
      {
        id: '2054380351736410113',
        name: '崇明区2026年理化实验考',
        status: 4,
        startDate: '2026-05-16',
        endDate: '2026-05-16',
      },
      {
        id: '2053711919844061186',
        name: '杨浦区2026年理化实验考',
        status: 1,
        startDate: '2026-05-20',
        endDate: '2026-05-21',
      },
    ])
  })

  test('空列表返回空数组', () => {
    expect(adaptExamList({ ...FIXTURE, data: [] })).toEqual([])
  })
})
