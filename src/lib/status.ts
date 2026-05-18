/**
 * Status → label + color mapping for batch / session states.
 * Colors are lifted verbatim from the design handoff (colors_and_type.css
 * `--c-st-*` tokens and the prototype StatusBadge).
 */

import type { Status } from '../types'

export interface StatusStyle {
  label: string
  /** Bright text color. */
  fg: string
  /** Dot color. */
  dot: string
  /** Soft glow color for the dot's box-shadow. */
  glow: string
}

export const STATUS: Record<Status, StatusStyle> = {
  ended: { label: '已结束', fg: '#5EEAF6', dot: '#5EEAF6', glow: 'rgba(94,234,246,0.35)' },
  closed: { label: '已关闭', fg: '#F59E0B', dot: '#F59E0B', glow: 'rgba(245,158,11,0.35)' },
  drawing: { label: '已抽签', fg: '#E879F9', dot: '#E879F9', glow: 'rgba(232,121,249,0.4)' },
  running: { label: '进行中', fg: '#4ADE80', dot: '#4ADE80', glow: 'rgba(74,222,128,0.4)' },
  idle: { label: '未开始', fg: '#6B7280', dot: '#6B7280', glow: 'rgba(107,114,128,0.2)' },
}
