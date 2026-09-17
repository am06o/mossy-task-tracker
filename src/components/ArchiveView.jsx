import { useRef, useState } from 'react'
import TodoItem from './TodoItem.jsx'
import AddRow from './AddRow.jsx'
import { clampProgress } from '../lib/progress.js'
import { makeTodo } from '../lib/projectsData.js'
import { todayStr } from '../lib/dateFormat.js'
import './ProjectView.css'

// 보관함 전체 화면. 떠 있는 보관함 버튼과 똑같은 목록(= 날짜가 없는 할 일)을 보여준다.
// 날짜를 정하면 그 순간 보관함에서 빠지고 그 날짜의 할 일이 된다.
export default function ArchiveView({ project, onChange, linkableProjects, themeColor }) {
  const [newestId, setNewestId] = useState(null)
  const dragId = useRef(null)
  const color = themeColor

  const items = project.todos.filter((t) => !t.dueDate)

  function addTodo(afterId = null) {
    const todo = makeTodo('')
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

  // 화살표: 날짜가 이미 있으면 그 날짜로, 없으면 오늘 할 일로 보낸다.
  function sendToDay(todo) {
    updateTodo({ ...todo, dueDate: todo.dueDate || todayStr() })
  }

  function handleDrop(e, targetId) {
    e.preventDefault()
    const fromId = dragId.current
    dragId.current = null
    if (!fromId || fromId === targetId) return
    onChange((p) => {
      const next = [...p.todos]
      const from = next.findIndex((t) => t.id === fromId)
      const to = next.findIndex((t) => t.id === targetId)
      if (from === -1 || to === -1) return p
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return { ...p, todos: next }
    })
  }

  return (
    <main className="project-view" style={{ '--proj-color': color }}>
      <header className="project-view-header">
        <h1 className="project-name-title">보관함</h1>
      </header>

      <ul className="todo-list">
        {items.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            color={color}
            onChange={updateTodo}
            onAdjustProgress={adjustTodoProgress}
            onDelete={deleteTodo}
            onEnterAddNext={() => addTodo(todo.id)}
            draggable
            onDragStart={() => (dragId.current = todo.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, todo.id)}
            linkableProjects={linkableProjects}
            onPromote={() => sendToDay(todo)}
            promoteTitle="오늘 할 일로 보내기"
            autoEdit={todo.id === newestId}
          />
        ))}

        <AddRow onAdd={() => addTodo()} label="추가" />
        {items.length === 0 && <li className="todo-empty">아직 담아둔 것이 없어요.</li>}
      </ul>
    </main>
  )
}
