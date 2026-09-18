import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './TodosDatePicker.css'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

// 할 일 화면 날짜 라벨을 누르면 뜨는 작은 캘린더. 어느 날에 뭔가 있는지 점으로만 보여주고
// (내용 텍스트는 안 보여준다), 날을 고르면 바로 그 날짜로 이동한다.
export default function TodosDatePicker({ value, itemsByDate, onSelect }) {
  const [monthCursor, setMonthCursor] = useState(value)

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor))
    const end = endOfWeek(endOfMonth(monthCursor))
    return eachDayOfInterval({ start, end })
  }, [monthCursor])

  return (
    <div className="todos-date-picker">
      <div className="todos-date-picker-header">
        <button type="button" onClick={() => setMonthCursor((c) => subMonths(c, 1))}>
          <ChevronLeft size={14} />
        </button>
        <span>{format(monthCursor, 'yyyy년 M월')}</span>
        <button type="button" onClick={() => setMonthCursor((c) => addMonths(c, 1))}>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="todos-date-picker-weekdays">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="todos-date-picker-grid">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const hasItems = (itemsByDate.get(key) || []).length > 0
          return (
            <button
              type="button"
              key={key}
              className={[
                'todos-date-picker-day',
                isSameMonth(day, monthCursor) ? '' : 'is-outside',
                isSameDay(day, value) ? 'is-selected' : '',
                isToday(day) ? 'is-today' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect(key)}
            >
              {format(day, 'd')}
              <span className={`todos-date-picker-dot ${hasItems ? 'is-visible' : ''}`} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
