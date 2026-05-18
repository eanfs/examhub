import { describe, expect, test } from 'vitest'
import { mapBatchStatus, mapSessionStatus } from './statusMapping'

describe('mapBatchStatus', () => {
  test('已确认的状态码', () => {
    expect(mapBatchStatus(0)).toBe('idle')
    expect(mapBatchStatus(2)).toBe('running')
    expect(mapBatchStatus(3)).toBe('ended')
  })

  test('猜测的状态码', () => {
    expect(mapBatchStatus(1)).toBe('drawing')
    expect(mapBatchStatus(4)).toBe('closed')
  })

  test('未知状态码回退为 idle', () => {
    expect(mapBatchStatus(99)).toBe('idle')
  })
})

describe('mapSessionStatus', () => {
  test('已确认的状态码', () => {
    expect(mapSessionStatus(3)).toBe('running')
    expect(mapSessionStatus(4)).toBe('ended')
  })

  test('未知状态码回退为 idle', () => {
    expect(mapSessionStatus(99)).toBe('idle')
  })
})
