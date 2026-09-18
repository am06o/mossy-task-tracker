import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, format, isToday } from 'date-fns'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
import TodoItem from './TodoItem.jsx'
import AddRow from './AddRow.jsx'
import TodosDatePicker from './TodosDatePicker.jsx'
import { clampProgress } from '../lib/progress.js'
import { makeTodo } from '../lib/projectsData.js'
import { toDateStr, parseLocalDate } from '../lib/dateFormat.js'
import { getItemsByDate } from '../lib/calendarData.js'
import { flattenTasks, mapNode, removeNode } from '../lib/tree.js'
import './ProjectView.css'
import './TodosView.css'

const DOUBLE_CLICK_WINDOW_MS = 250

export default function TodosView({
  project,
  onChange,
  onUpdateProject,
  linkableProjects,
  allProjects,
  themeColor,
  onAssignDate,
  initialDate,
  onConsumeInitialDate
}) {
  const [cursor, setCursor] = useState(() => (initialDate ? parseLocalDate(initialDate) : new Date()))
  const [newestId, setNewestId] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const color = themeColor
  const selectedDate = toDateStr(cursor)
  const dateFieldRef = useRef(null)
  const clickTimer = useRef(null)

  useEffect(() => {
    if (initialDate) onConsumeInitialDate?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!pickerOpen) return
    function handleClick(e) {
      if (dateFieldRef.current && !dateFieldRef.current.contains(e.target)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [pickerOpen])

  useEffect(() => () => clearTimeout(clickTimer.current), [])

  const itemsByDate = useMemo(() => getItemsByDate(allProjects), [allProjects])

  const dayTodos = project.todos.filter((t) => t.dueDate === selectedDate)

  // 이 날짜에 걸린 할 일은 "할 일" 보관함에만 있는 게 아니라, 프로젝트 안에 분류돼 있을 수도
  // 있다 — 캘린더에는 이미 나오니 여기서도 같이 보여준다(프로젝트별로 색 배지를 붙여서).
  const projectDayItems = useMemo(() => {
    const items = []
    for (const p of allProjects) {
      if (p.isTodos) continue
      for (const todo of flattenTasks(p.todos)) {
        if (todo.dueDate === selectedDate) items.push({ todo, project: p })
      }
    }
    return items
  }, [allProjects, selectedDate])

  function updateProjectTodo(projectId, updated) {
    onUpdateProject(projectId, (p) => ({ ...p, todos: mapNode(p.todos, updated.id, () => updated) }))
  }

  function deleteProjectTodo(projectId, id) {
    onUpdateProject(projectId, (p) => ({ ...p, todos: removeNode(p.todos, id) }))
  }

  function adjustProjectTodoProgress(projectId, id, delta) {
    onUpdateProject(projectId, (p) => ({
      ...p,
      todos: mapNode(p.todos, id, (n) => ({ ...n, progress: clampProgress((n.progress || 0) + delta) }))
    }))
  }

  function addTodo(afterId = null) {
    const todo = makeTodo('', selectedDate)
    onChange((p) => {
      const next = [...p.todos]
      const index = afterId ? next.findIndex((t) => t.id === afterId) : -1
      if (index === -1) next.push(todo)
      else next.splice(index + 1, 0, todo)
      return { ...p, todos: next }
    })
    setNewestId(todo.id)
  }

  function updateTodo(updated) {
    onChange((p) => ({
      ...p,
      todos: p.todos.map((t) => (t.id === updated.id ? updated : t))
    }))
  }

  function deleteTodo(id) {
    onChange((p) => ({ ...p, todos: p.todos.filter((t) => t.id !== id) }))
  }

  function adjustTodoProgress(id, delta) {
    onChange((p) => ({
      ...p,
      todos: p.todos.map((t) =>
        t.id === id ? { ...t, progress: clampProgress(t.progress + delta) } : t
      )
    }))
  }

  // 같은 날짜 목록 안에서 할 일 순서를 바꾼다 — 끌어놓은 항목이 목표 항목 바로 앞으로 온다.
  function reorderTodo(draggedId, targetId) {
    if (draggedId === targetId) return
    onChange((p) => {
      const dragged = p.todos.find((t) => t.id === draggedId)
      if (!dragged) return p
      const without = p.todos.filter((t) => t.id !== draggedId)
      const targetIndex = without.findIndex((t) => t.id === targetId)
      if (targetIndex === -1) return p
      const next = [...without]
      next.splice(targetIndex, 0, dragged)
      return { ...p, todos: next }
    })
  }

  function readNodeId(e) {
    try {
      return JSON.parse(e.dataTransfer.getData('text/plain')).nodeId
    } catch {
      return null
    }
  }

  // 보관함에서 이 날짜 칸으로 끌어다 놓으면 그 항목이 오늘(선택된 날짜)의 할 일이 된다.
  function handleDrop(e) {
    e.preventDefault()
    try {
      const { projectId, todoId } = JSON.parse(e.dataTransfer.getData('text/plain'))
      onAssignDate(projectId, todoId, selectedDate)
    } catch {
      // 드래그 데이터가 없으면 무시
    }
  }

  // 한 번 누르면(약간의 지연 후) 미니 캘린더, 그 안에 두 번째 클릭이 오면 더블클릭으로 보고 오늘로 이동.
  function handleDateClick() {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      setCursor(new Date())
      setPickerOpen(false)
      return
    }
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null
      setPickerOpen((o) => !o)
    }, DOUBLE_CLICK_WINDOW_MS)
  }

  return (
    <main className="project-view" style={{ '--proj-color': color }}>
      <header className="project-view-header">
        <div className="todos-title-row">
          <h1 className="project-name-title">할 일</h1>

          <div className="todos-day-nav">
            <button className="todos-nav-arrow" onClick={() => setCursor((c) => addDays(c, -1))}>
              <ChevronLeft size={16} />
            </button>

            <div className="todos-date-field" ref={dateFieldRef}>
              <button
                type="button"
                className={`todos-day-label ${isToday(cursor) ? 'is-today' : ''}`}
                onClick={handleDateClick}
              >
                {format(cursor, 'M월 d일')} ({WEEKDAY_LABELS[cursor.getDay()]})
              </button>
              {pickerOpen && (
                <TodosDatePicker
                  value={cursor}
                  itemsByDate={itemsByDate}
                  onSelect={(dateStr) => {
                    setCursor(parseLocalDate(dateStr))
                    setPickerOpen(false)
                  }}
                />
              )}
            </div>

            <button className="todos-nav-arrow" onClick={() => setCursor((c) => addDays(c, 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <ul className="todo-list" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        {dayTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            color={color}
            onChange={updateTodo}
            onAdjustProgress={adjustTodoProgress}
            onDelete={deleteTodo}
            onEnterAddNext={() => addTodo(todo.id)}
            linkableProjects={linkableProjects}
            autoEdit={todo.id === newestId}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ nodeId: todo.id }))}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const draggedId = readNodeId(e)
              if (!draggedId || draggedId === todo.id) return
              e.preventDefault()
              e.stopPropagation()
              reorderTodo(draggedId, todo.id)
            }}
          />
        ))}

        {projectDayItems.map(({ todo, project: owner }) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            color={owner.color}
            onChange={(updated) => updateProjectTodo(owner.id, updated)}
            onAdjustProgress={(id, delta) => adjustProjectTodoProgress(owner.id, id, delta)}
            onDelete={(id) => deleteProjectTodo(owner.id, id)}
            projectDot={{ name: owner.name, color: owner.color }}
          />
        ))}

        <AddRow onAdd={() => addTodo()} label="할 일 추가" />
        {dayTodos.length === 0 && projectDayItems.length === 0 && (
          <li className="todo-empty">아직 할 일이 없어요.</li>
        )}
      </ul>
    </main>
  )
}
