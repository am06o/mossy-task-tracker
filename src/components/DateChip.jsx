import { useEffect, useRef, useState } from 'react'
import { Calendar, X } from 'lucide-react'
import { formatShortDate, parseLocalDate, todayStr } from '../lib/dateFormat.js'
import TodosDatePicker from './TodosDatePicker.jsx'

// 프로젝트 시작/마감일, 할 일 마감일 모두 이 칩 하나로 고른다.
// 편집 모드가 되면 할 일 화면 날짜 이동칸과 똑같은 달력 UI가 바로 아래에 뜬다.
export default function DateChip({ value, onChange, overdue, title, open, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const editing = isControlled ? open : internalOpen
  const setEditing = isControlled ? onOpenChange : setInternalOpen
  const rootRef = useRef(null)

  useEffect(() => {
    if (!editing) return
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setEditing(false)
    }
    function handleKey(e) {
      if (e.key === 'Enter' || e.key === 'Escape') setEditing(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [editing, setEditing])

  function handleSelect(dateStr) {
    onChange(dateStr)
    setEditing(false)
  }

  return (
    <span className="date-chip-anchor" ref={rootRef}>
      {value ? (
        <button
          className={`date-chip ${overdue ? 'is-overdue' : ''}`}
          onClick={() => setEditing(true)}
          title={title}
        >
          <Calendar size={12} />
          {formatShortDate(value)}
          <span
            className="date-chip-clear"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
          >
            <X size={11} />
          </span>
        </button>
      ) : (
        <button
          className="date-chip-add"
          onClick={() => {
            onChange(todayStr())
            setEditing(true)
          }}
          title={title}
        >
          <Calendar size={13} />
        </button>
      )}

      {editing && (
        <TodosDatePicker value={value ? parseLocalDate(value) : new Date()} onSelect={handleSelect} />
      )}
    </span>
  )
}
