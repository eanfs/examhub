/**
 * ExamPicker — 标题栏考试选择器。
 * 触发按钮显示当前考试名；点开后是一个带搜索框的考试列表，
 * 选中即通过 store 切换 examId 并重新加载大屏。
 */

import { useMemo, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { useDashboardStore } from '../store/dashboardStore'
import styles from './ExamPicker.module.css'

export function ExamPicker() {
  const examList = useDashboardStore((s) => s.examList)
  const currentExamId = useDashboardStore((s) => s.currentExamId)
  const selectExam = useDashboardStore((s) => s.selectExam)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const current = examList.find((e) => e.id === currentExamId)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return examList
    return examList.filter((e) => e.name.toLowerCase().includes(q))
  }, [examList, query])

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  const choose = (id: string) => {
    selectExam(id)
    close()
  }

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        data-testid="exam-picker-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span className={styles.label}>{current?.name ?? '选择考试'}</span>
        <ChevronDown size={14} strokeWidth={1.5} />
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={close} />
          <div
            className={styles.panel}
            data-testid="exam-picker-panel"
            role="listbox"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation()
                close()
              }
            }}
          >
            <div className={styles.searchRow}>
              <Search size={14} strokeWidth={1.5} color="#94A3B8" />
              <input
                className={styles.search}
                placeholder="搜索考试名称"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className={styles.list}>
              {filtered.length === 0 ? (
                <div className={styles.empty}>无匹配考试</div>
              ) : (
                filtered.map((e) => {
                  const active = e.id === currentExamId
                  return (
                    <button
                      key={e.id}
                      type="button"
                      className={styles.item}
                      data-testid="exam-picker-item"
                      data-active={active}
                      role="option"
                      aria-selected={active}
                      onClick={() => choose(e.id)}
                    >
                      <span className={styles.itemName}>{e.name}</span>
                      <span className={styles.itemDate}>{e.startDate}</span>
                      {active && (
                        <Check size={13} strokeWidth={2} color="#5EEAF6" />
                      )}
                    </button>
                  )
                })
              )}
            </div>

            <div className={styles.count}>
              {filtered.length} / {examList.length} 个考试
            </div>
          </div>
        </>
      )}
    </div>
  )
}
