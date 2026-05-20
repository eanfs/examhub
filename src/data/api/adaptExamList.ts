/**
 * 把考试列表接口返回 ApiExamListResponse 适配成 ExamListItem[]。
 * 与 adaptSnapshot 同理：接口形状 → UI 形状的唯一转换层。
 */

import type { ExamListItem } from '../../types'
import type { ApiExamListResponse } from './apiTypes'

/** 适配器入口：ApiExamListResponse → ExamListItem[]。 */
export function adaptExamList(res: ApiExamListResponse): ExamListItem[] {
  return res.data.map((e) => ({
    id: e.id,
    name: e.examName,
    status: e.examStatus,
    startDate: e.examStartDate,
    endDate: e.examEndDate,
  }))
}
