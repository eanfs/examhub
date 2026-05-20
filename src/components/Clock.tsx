/**
 * Clock — 标题栏左上角的系统当前时间，每秒走字。
 */

import { useEffect, useState } from 'react'
import { Clock as ClockIcon } from 'lucide-react'
import styles from './Clock.module.css'

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const pad = (n: number) => String(n).padStart(2, '0')

export function Clock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  return (
    <div className={styles.clock} data-testid="system-clock">
      <ClockIcon size={16} strokeWidth={1.5} className={styles.icon} />
      <span className={styles.time}>{time}</span>
      <span className={styles.meta}>
        {date} {WEEKDAYS[now.getDay()]}
      </span>
    </div>
  )
}
