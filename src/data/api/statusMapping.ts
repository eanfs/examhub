/**
 * 接口状态码 → 领域 Status 的映射。
 *
 * ASSUMPTION（需与后端核对）：样例响应只覆盖了部分状态码，详见本任务说明。
 * 一旦后端给出完整枚举，只需修改下面两张表。
 */

import type { Status } from '../../types'

/** 批次状态码 → Status。 */
const BATCH_STATUS: Record<number, Status> = {
  0: 'idle', // 未开始（已确认）
  1: 'drawing', // 已抽签（猜测）
  2: 'running', // 进行中（推断）
  3: 'ended', // 已结束（已确认）
  4: 'closed', // 已关闭（猜测）
}

/** 场次状态码 → Status。 */
const SESSION_STATUS: Record<number, Status> = {
  0: 'idle',
  1: 'drawing',
  2: 'running',
  3: 'running', // 进行中（已确认）
  4: 'ended', // 已结束（已确认）
  5: 'closed',
}

/** 把批次状态码映射为领域 Status，未知码回退为 idle。 */
export function mapBatchStatus(code: number): Status {
  return BATCH_STATUS[code] ?? 'idle'
}

/** 把场次状态码映射为领域 Status，未知码回退为 idle。 */
export function mapSessionStatus(code: number): Status {
  return SESSION_STATUS[code] ?? 'idle'
}
