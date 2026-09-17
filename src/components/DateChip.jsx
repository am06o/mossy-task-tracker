import { useState } from 'react'
import { Calendar, X } from 'lucide-react'
import { formatShortDate, todayStr } from '../lib/dateFormat.js'

export default function DateChip({ value, onChange, overdue, title, open, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const editing = isControlled ? open : internalOpen
  const setEditing = isControlled ? onOpenChange : setInternalOpen

  if (editing) {
    return (
      <input
        type="date"
        className="date-chip-input"
        autoFocus
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        onBlur={() => setEditing(false)}
      />
    )
  }

  if (value) {
    return (
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
    )
  }

  return (
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
  )
}
