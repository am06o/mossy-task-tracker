import { useMemo, useState } from 'react'
import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns'
import { CalendarClock, CalendarCheck2, ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import { TODOS_ID } from '../lib/projectsData.js'
import { parseLocalDate } from '../lib/dateFormat.js'
import { getItemsByDate } from '../lib/calendarData.js'
import './CalendarView.css'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const MAX_CHIPS = 3
const UPCOMING_LIMIT = 5

function dragPayload(projectId, todoId) {
  return JSON.stringify({ projectId, todoId })
}

// 드래그가 실제로 시작됐다는 걸 보여주는 클래스를 붙인다 — 다음 프레임에 붙여야
// 브라우저가 드래그 고스트 이미지를 캡처한 "이전" 모습(애니메이션 전) 그대로 가져간다.
function markDragging(e) {
  const el = e.currentTarget
  requestAnimationFrame(() => el.classList.add('is-dragging'))
}

function unmarkDragging(e) {
  e.currentTarget.classList.remove('is-dragging')
}

export default function CalendarView({ projects, archiveTodos, onJumpTo, onJumpToDate, onAssignDate, themeColor }) {
  const [cursor, setCursor] = useState(new Date())
  const [dragOverKey, setDragOverKey] = useState(null)

  // 프로젝트에 속하지 않은 할 일은 테마색으로 보여준다(연결해둔 프로젝트가 있으면 그 색).
  function colorOf(item) {
    if (item.project.isTodos) {
      const linked = item.todo && projects.find((p) => p.id === item.todo.linkedProjectId)
      return linked ? linked.color : themeColor
    }
    return item.project.color
  }

  const itemsByDate = useMemo(() => getItemsByDate(projects), [projects])

  const archiveItems = archiveTodos.filter((t) => t.progress < 100)

  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const todayItems = itemsByDate.get(todayKey) || []

  // 다가오는 마감: 기간 제한 없이, 가까운 날짜 → 우선순위 순으로 앞에서 몇 개만.
  // 이미 끝낸 할 일과 마감(archived)한 프로젝트는 뺀다.
  const upcoming = useMemo(() => {
    const today = startOfDay(new Date())
    const entries = []
    for (const [dateKey, items] of itemsByDate) {
      if (startOfDay(parseLocalDate(dateKey)) <= today) continue
      for (const item of items) {
        if (item.kind === 'todo' && item.todo.progress >= 100) continue
        if (item.project.archived === true) continue
        entries.push({ dateKey, ...item })
      }
    }
    const priorityRank = { high: 0, medium: 1, low: 2 }
    entries.sort((a, b) => {
      const dateCompare = a.dateKey.localeCompare(b.dateKey)
      if (dateCompare !== 0) return dateCompare
      const rankA = priorityRank[a.project.priority] ?? 1
      const rankB = priorityRank[b.project.priority] ?? 1
      return rankA - rankB
    })
    return entries.slice(0, UPCOMING_LIMIT)
  }, [itemsByDate])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor))
    const end = endOfWeek(endOfMonth(cursor))
    return eachDayOfInterval({ start, end })
  }, [cursor])

  function handleDrop(e, key) {
    e.preventDefault()
    setDragOverKey(null)
    try {
      const { projectId, todoId } = JSON.parse(e.dataTransfer.getData('text/plain'))
      onAssignDate(projectId, todoId, key)
    } catch {
      // 드래그 데이터가 없으면 무시
    }
  }

  function renderItemChip(item, keyPrefix = '') {
    if (item.kind === 'deadline') {
      return (
        <button
          key={`${keyPrefix}deadline-${item.project.id}`}
          className="calendar-chip calendar-chip--deadline"
          style={{ '--chip-color': colorOf(item) }}
          title={`${item.project.name} 마감일`}
          onClick={(e) => {
            e.stopPropagation()
            onJumpTo(item.project.id)
          }}
        >
          <Flag size={9} className="calendar-chip-icon" />
          <span className="calendar-chip-label">{item.project.name}</span>
        </button>
      )
    }
    return (
      <button
        key={`${keyPrefix}${item.todo.id}`}
        className={`calendar-chip ${item.todo.progress >= 100 ? 'is-done' : ''}`}
        style={{ '--chip-color': colorOf(item) }}
        title={`${item.project.name} · ${item.todo.title}`}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', dragPayload(item.project.id, item.todo.id))
          markDragging(e)
        }}
        onDragEnd={unmarkDragging}
        onClick={(e) => {
          e.stopPropagation()
          onJumpTo(item.project.id)
        }}
      >
        <span className="calendar-chip-label">{item.todo.title}</span>
      </button>
    )
  }

  return (
    <main className="calendar-view">
      <header className="calendar-header">
        <h1 className="calendar-title">{format(cursor, 'yyyy년 M월')}</h1>
        <div className="calendar-nav">
          <button onClick={() => setCursor(subMonths(cursor, 1))}>
            <ChevronLeft size={17} />
          </button>
          <button className="calendar-today-btn" onClick={() => setCursor(new Date())}>
            오늘
          </button>
          <button onClick={() => setCursor(addMonths(cursor, 1))}>
            <ChevronRight size={17} />
          </button>
        </div>
      </header>

      <div className="calendar-body">
        <div className="calendar-main">
          <div className="calendar-weekdays">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="calendar-weekday">
                {w}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const items = itemsByDate.get(key) || []
              const inMonth = isSameMonth(day, cursor)
              return (
                <div
                  key={key}
                  className={`calendar-cell ${inMonth ? '' : 'is-outside'} ${
                    isToday(day) ? 'is-today' : ''
                  } ${dragOverKey === key ? 'is-drop-target' : ''}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => setDragOverKey(key)}
                  onDragLeave={() => setDragOverKey((cur) => (cur === key ? null : cur))}
                  onDrop={(e) => handleDrop(e, key)}
                  onDoubleClick={() => onJumpToDate(key)}
                  title="더블클릭하면 이 날짜의 할 일로 이동해요"
                  role="button"
                  tabIndex={0}
                >
                  <span className="calendar-day-num">{format(day, 'd')}</span>
                  <div className="calendar-day-items">
                    {items.slice(0, MAX_CHIPS).map((item) => renderItemChip(item))}
                    {items.length > MAX_CHIPS && (
                      <span className="calendar-more">+{items.length - MAX_CHIPS}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <aside className="calendar-side">
          <section className="calendar-side-section">
            <h2 className="calendar-side-title">
              <CalendarCheck2 size={13} /> 오늘의 할 일
            </h2>
            <ul className="calendar-side-list">
              {todayItems.length === 0 && <li className="calendar-side-empty">오늘 예정된 항목이 없어요.</li>}
              {todayItems.map((item, i) => (
                <li key={i} className="calendar-side-row">
                  {renderItemChip(item, 'today-')}
                </li>
              ))}
            </ul>
          </section>

          <section className="calendar-side-section">
            <h2 className="calendar-side-title">
              <CalendarClock size={13} /> 다가오는 마감
            </h2>
            <ul className="calendar-side-list">
              {upcoming.length === 0 && <li className="calendar-side-empty">다가오는 일정이 없어요.</li>}
              {upcoming.map((item, i) => (
                <li key={i} className="calendar-side-row">
                  <span className="calendar-side-date">
                    D-{differenceInCalendarDays(parseLocalDate(item.dateKey), new Date())}
                  </span>
                  {renderItemChip(item, 'upcoming-')}
                </li>
              ))}
            </ul>
          </section>

          <section className="calendar-side-section">
            <h2 className="calendar-side-title">보관함</h2>
            <ul className="calendar-unscheduled-list">
              {archiveItems.map((todo) => (
                <li
                  key={todo.id}
                  className="calendar-unscheduled-item"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', dragPayload(TODOS_ID, todo.id))
                    markDragging(e)
                  }}
                  onDragEnd={unmarkDragging}
                >
                  <span className="calendar-unscheduled-dot" style={{ backgroundColor: themeColor }} />
                  <span className="calendar-unscheduled-text">{todo.title}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </main>
  )
}
