import { useRef, useState } from 'react'
import { ArrowRight, Check, ChevronsRight, GripVertical, X } from 'lucide-react'
import ProgressControl from './ProgressControl.jsx'
import DateChip from './DateChip.jsx'
import LinkMenu from './LinkMenu.jsx'
import ContextMenu from './ContextMenu.jsx'
import { readableTextColor } from '../lib/theme.js'
import { addDaysStr, isOverdue } from '../lib/dateFormat.js'

export default function TodoItem({
  todo,
  color,
  onChange,
  onAdjustProgress,
  onDelete,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  linkableProjects,
  onPromote,
  promoteTitle = '프로젝트로 전환',
  onEnterAddNext,
  style,
  autoEdit
}) {
  const [editing, setEditing] = useState(!!autoEdit)
  const [draftTitle, setDraftTitle] = useState(todo.title)
  const [menu, setMenu] = useState(null)
  // 방금 새로 만든 줄인지 — 이름 없이 빠져나오면 이 경우에만 지운다.
  // (이미 있던 "이름 없음" 할 일을 고치다가 비워둔 채 나가는 건 그대로 둔다.)
  const freshRef = useRef(!!autoEdit)

  function commitTitle() {
    const trimmed = draftTitle.trim()
    const wasFresh = freshRef.current
    freshRef.current = false
    setEditing(false)
    if (trimmed && trimmed !== todo.title) {
      onChange({ ...todo, title: trimmed })
    } else {
      setDraftTitle(todo.title)
      // 엔터로 이어 만들다가 그냥 빠져나온 빈 줄은 남기지 않는다.
      if (!trimmed && !todo.title && wasFresh) onDelete(todo.id)
    }
    return trimmed
  }

  const done = todo.progress >= 100

  function toggleDone() {
    onChange({ ...todo, progress: done ? 0 : 100 })
  }

  function postpone() {
    onChange({ ...todo, dueDate: addDaysStr(todo.dueDate, 1) })
  }

  return (
    <li
      className={`todo-item ${done ? 'is-done' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={style}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setMenu({ x: e.clientX, y: e.clientY })
      }}
    >
      <span className="todo-drag-handle" title="드래그하여 순서 변경">
        <GripVertical size={15} />
      </span>

      <button
        type="button"
        className="todo-checkbox"
        style={
          done
            ? { backgroundColor: color, borderColor: color, color: readableTextColor(color) }
            : undefined
        }
        onClick={toggleDone}
        title={done ? '완료 취소' : '완료로 표시'}
      >
        {done && <Check size={13} strokeWidth={3} />}
      </button>

      <button type="button" className="todo-postpone" onClick={postpone} title="내일로 미루기">
        <ChevronsRight size={14} />
      </button>

      {editing ? (
        <input
          className="todo-title-input"
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            // 이름을 적고 엔터를 치면 바로 아래에 다음 할 일이 이어서 만들어진다.
            if (e.key === 'Enter') {
              const title = commitTitle()
              if (title && onEnterAddNext) onEnterAddNext()
            }
            if (e.key === 'Escape') {
              setDraftTitle(todo.title)
              setEditing(false)
              if (!todo.title && freshRef.current) onDelete(todo.id)
              freshRef.current = false
            }
          }}
        />
      ) : (
        <span className={`todo-title ${todo.title ? '' : 'is-untitled'}`} onClick={() => setEditing(true)}>
          {todo.title || '이름 없음'}
        </span>
      )}

      {linkableProjects && (
        <span className="todo-link-slot">
          <LinkMenu
            value={todo.linkedProjectId}
            onChange={(linkedProjectId) => onChange({ ...todo, linkedProjectId })}
            projects={linkableProjects}
          />
        </span>
      )}

      <span className="todo-date-slot">
        <DateChip
          value={todo.dueDate}
          onChange={(dueDate) => onChange({ ...todo, dueDate })}
          overdue={isOverdue(todo.dueDate, done)}
          title="일정"
        />
      </span>

      <ProgressControl
        size="sm"
        value={todo.progress}
        color={color}
        onChange={(value) => onChange({ ...todo, progress: value })}
        onAdjust={(delta) => onAdjustProgress(todo.id, delta)}
      />

      {onPromote && (
        <button className="todo-promote" title={promoteTitle} onClick={onPromote}>
          <ArrowRight size={15} />
        </button>
      )}

      <button className="todo-delete" title="할일 삭제" onClick={() => onDelete(todo.id)}>
        <X size={15} />
      </button>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            {
              label: '이름 수정',
              onClick: () => {
                setDraftTitle(todo.title)
                setEditing(true)
              }
            },
            { label: '할 일 삭제', danger: true, onClick: () => onDelete(todo.id) }
          ]}
        />
      )}
    </li>
  )
}
