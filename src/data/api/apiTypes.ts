/**
 * 接口 GET /api/kws-exam/view/statistics/view/{examId} 的原始返回类型。
 * 这些类型只描述「线上长什么样」，不做任何语义转换 —— 转换在 adaptSnapshot 里。
 */

/** 一个场次（stage），位于某个考场内。 */
export interface ApiClassArrange {
  examId: string
  stationId: string
  batchId: string
  classArrangeId: string
  stageNum: number
  classId: string
  className: string
  drawLotsCount: number
  loginCount: number
  submitPaperCount: number
  absenceCount: number
  /** 场次状态码，见 statusMapping.ts。 */
  status: number
}

/** 一个批次。 */
export interface ApiBatch {
  id: string
  examId: string
  stationId: string
  /** 1 = 正常批次，2 = 备用批次。 */
  batchType: number
  batchNum: number
  batchName: string
  arriveTime: string
  /** 批次状态码，见 statusMapping.ts。 */
  status: number
  spareBatchStatus: number
  batchNameAs: number
  examName: string
  stationName: string
  /** 考场列表，每个考场是它自己场次的数组；批次无考场时为 null。 */
  classArrangeInfoList: ApiClassArrange[][] | null
}

/** 一个考点（学校）。 */
export interface ApiStation {
  id: string
  stationName: string
  totalStudentCount: number
  /** 缺考；接口在未统计时返回 null。 */
  absenceCount: number | null
  /** 迟到；接口在未统计时返回 null。 */
  lateCount: number | null
  /** 违纪；接口在未统计时返回 null。 */
  rvCount: number | null
  /** 已上报；接口在未统计时返回 null。 */
  reportCount: number | null
  /** 已处理；接口在未统计时返回 null。 */
  dealCount: number | null
  stationBatchStatusDtos: ApiBatch[]
}

/** 接口 data 负载。 */
export interface ApiStatisticsData {
  studentCount: number
  participantCount: number
  shouldArriveCount: number
  arrivedCount: number
  shouldSubmitCount: number
  submittedCount: number
  stationCount: number
  examStationVo: ApiStation[]
}

/** 统一响应信封。 */
export interface ApiEnvelope<T> {
  code: number
  msg: string
  success: boolean
  data: T
}

export type ApiStatisticsResponse = ApiEnvelope<ApiStatisticsData>

/**
 * 考试计划列表项，GET /kws-exam/plan/view/List 的 data 数组元素。
 * 接口返回字段较多，这里只声明选择器实际用到的部分。
 */
export interface ApiExamPlan {
  id: string
  examName: string
  examCode: string
  /** 考试状态码。 */
  examStatus: number
  examStartDate: string
  examEndDate: string
  examType: number
  /** 行级状态（启用/停用）。 */
  status: number
}

export type ApiExamListResponse = ApiEnvelope<ApiExamPlan[]>
