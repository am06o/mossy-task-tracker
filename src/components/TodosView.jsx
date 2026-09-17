import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, format, isToday } from 'date-fns'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
import TodoItem from './TodoItem.jsx'
import AddRow from './AddRow.jsx'
import { clampProgress } from '../lib/progress.js'
import { makeTodo } from '../lib/projectsData.js'
import { toDateStr } from '../lib/dateFormat.js'
import './ProjectView.css'
import './TodosView.css'

export default function TodosView({ project, onChange, linkableProjects, themeColor, onAssignDate }) {
  const [cursor, setCursor] = useState(new Date())
  const [newestId, setNewestId] = useState(null)
  const color = themeColor
  const selectedDate = toDateStr(cursor)

  const dayTodos = project.todos.filter((t) => t.dueDate === selectedDate)

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

  return (
    <main className="project-view" style={{ '--proj-color': color }}>
      <header className="project-view-header">
        <div className="todos-title-row">
          <h1 className="project-name-title">할 일</h1>

          <div className="todos-day-nav">
            <button onClick={() => setCursor((c) => addDays(c, -1))}>
              <ChevronLeft size={16} />
            </button>
            <span className="todos-day-label">
              {format(cursor, 'M월 d일')} ({WEEKDAY_LABELS[cursor.getDay()]})
              {isToday(cursor) && <span className="todos-day-today-badge">오늘</span>}
            </span>
            <button onClick={() => setCursor((c) => addDays(c, 1))}>
              <ChevronRight size={16} />
            </button>
            <button
              className={`todos-day-today-btn ${isToday(cursor) ? 'is-hidden' : ''}`}
              onClick={() => setCursor(new Date())}
              tabIndex={isToday(cursor) ? -1 : 0}
            >
              오늘로
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
          />
        ))}

        <AddRow onAdd={() => addTodo()} label="할 일 추가" />
        {dayTodos.length === 0 && <li className="todo-empty">아직 할 일이 없어요.</li>}
      </ul>
    </main>
  )
}
