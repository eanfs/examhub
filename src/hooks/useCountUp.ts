/**
 * Animates a number toward `target` whenever it changes.
 * 600ms ease-out-quart, per the handoff's "数字滚动" rule.
 * Honors prefers-reduced-motion by snapping instantly.
 */

import { useEffect, useRef, useState } from 'react'

const DURATION = 600
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useCountUp(target: number): number {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    if (from === target || prefersReducedMotion()) {
      fromRef.current = target
      setValue(target)
      return
    }

    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION)
      const eased = easeOutQuart(progress)
      setValue(Math.round(from + (target - from) * eased))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
      fromRef.current = target
    }
  }, [target])

  return value
}
