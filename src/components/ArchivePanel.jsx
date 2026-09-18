import { useEffect, useRef, useState } from 'react'
import { GripVertical, Sparkles, X } from 'lucide-react'
import AddRow from './AddRow.jsx'
import ContextMenu from './ContextMenu.jsx'
import { makeTodo, TODOS_ID } from '../lib/projectsData.js'
import './ArchivePanel.css'

const LONG_PRESS_MS = 550
const FAB_SIZE = 46
const EDGE = 8
const TOP_INSET = 32 + EDGE // 제목표시줄 아래로만 다니게 한다
const PANEL_GAP = 10

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function dragPayload(todoId) {
  return JSON.stringify({ projectId: TODOS_ID, todoId })
}

function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

// 버튼 위치는 창 크기에 대한 비율(중심 좌표)로 저장해서, 창을 줄이거나 키워도 같은
// 상대 위치에 있고, 너무 작아지면 가장 가까운 가장자리 안쪽으로 붙는다.
function fabTopLeft(center, vw, vh) {
  const half = FAB_SIZE / 2
  const cx = clamp(center.x, half + EDGE, vw - half - EDGE)
  const cy = clamp(center.y, half + TOP_INSET, vh - half - EDGE)
  return { x: cx - half, y: cy - half }
}

// 패널은 버튼 바로 옆에 붙어서 열린다. 버튼이 오른쪽 절반에 있으면 왼쪽으로, 아래쪽 절반에
// 있으면 버튼 아래 끝에 맞춰 위로 자라도록 해서 어느 자리에서도 화면 안에 들어온다.
function panelStyleFor(fab, vw, vh) {
  const width = Math.min(300, vw - EDGE * 2)
  const openLeft = fab.x + FAB_SIZE / 2 > vw / 2
  const left = clamp(
    openLeft ? fab.x - PANEL_GAP - width : fab.x + FAB_SIZE + PANEL_GAP,
    EDGE,
    vw - width - EDGE
  )
  const preferredMax = Math.min(vh * 0.7, 520)
  if (fab.y + FAB_SIZE / 2 > vh / 2) {
    const bottom = clamp(vh - (fab.y + FAB_SIZE), EDGE, vh - TOP_INSET)
    return { left, width, bottom, maxHeight: Math.min(preferredMax, vh - bottom - TOP_INSET) }
  }
  const top = clamp(fab.y, TOP_INSET, vh - EDGE)
  return { left, width, top, maxHeight: Math.min(preferredMax, vh - top - EDGE) }
}

function ArchiveItem({ todo, onChange, onDelete, onEnterAddNext, autoEdit }) {
  const [editing, setEditing] = useState(!!autoEdit)
  const [draft, setDraft] = useState(todo.title)
  const [menu, setMenu] = useState(null)
  const freshRef = useRef(!!autoEdit)

  function commit() {
    const trimmed = draft.trim()
    const wasFresh = freshRef.current
    freshRef.current = false
    setEditing(false)
    if (trimmed && trimmed !== todo.title) onChange({ ...todo, title: trimmed })
    else {
      setDraft(todo.title)
      // 엔터로 이어 만들다가 그냥 빠져나온 빈 줄은 남기지 않는다.
      if (!trimmed && !todo.title && wasFresh) onDelete(todo.id)
    }
    return trimmed
  }

  return (
    <li
      className="archive-item"
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', dragPayload(todo.id))}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setMenu({ x: e.clientX, y: e.clientY })
      }}
    >
      <span className="archive-item-handle" title="끌어서 할 일이나 캘린더에 놓기">
        <GripVertical size={14} />
      </span>
      {editing ? (
        <input
          className="archive-item-input"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const title = commit()
              if (title) onEnterAddNext()
            }
            if (e.key === 'Escape') {
              setDraft(todo.title)
              setEditing(false)
              if (!todo.title && freshRef.current) onDelete(todo.id)
              freshRef.current = false
            }
          }}
        />
      ) : (
        <span className="archive-item-title" onClick={() => setEditing(true)}>
          {todo.title || '이름 없음'}
        </span>
      )}
      <button className="archive-item-delete" title="삭제" onClick={() => onDelete(todo.id)}>
        <X size={13} />
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
                setDraft(todo.title)
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

// 할 일 칸, 캘린더, 프로젝트 화면 어디에서든 떠 있는 보관함 버튼.
// 짧게 누르면 보관함이 열리고, 잠깐(약 0.5초) 누르고 있으면 버튼을 원하는 곳으로 옮길 수 있다.
export default function ArchivePanel({ project, onChange, visible, position, onMove }) {
  const { w: vw, h: vh } = useViewport()
  const [open, setOpen] = useState(false)
  const [newestId, setNewestId] = useState(null)
  const [pressing, setPressing] = useState(false)
  const [dragCenter, setDragCenter] = useState(null)
  const rootRef = useRef(null)
  const pressTimer = useRef(null)
  const pressStart = useRef(null)
  const movedRef = useRef(false)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      // 항목 우클릭 메뉴는 body에 따로 떠 있으므로, 그걸 누를 때는 패널을 닫지 않는다.
      if (e.target.closest('.context-menu')) return
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const dragging = dragCenter !== null

  useEffect(() => {
    if (!dragging) return
    function handleMove(e) {
      setDragCenter({ x: e.clientX, y: e.clientY })
    }
    function handleUp(e) {
      const pos = fabTopLeft({ x: e.clientX, y: e.clientY }, window.innerWidth, window.innerHeight)
      const half = FAB_SIZE / 2
      onMove({ fx: (pos.x + half) / window.innerWidth, fy: (pos.y + half) / window.innerHeight })
      setDragCenter(null)
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [dragging, onMove])

  useEffect(() => () => clearTimeout(pressTimer.current), [])

  if (!visible) return null

  const undated = project.todos.filter((t) => !t.dueDate)
  const center = dragCenter
    ? dragCenter
    : position
      ? { x: position.fx * vw, y: position.fy * vh }
      : { x: vw - FAB_SIZE / 2 - 18, y: vh / 2 }
  const fab = fabTopLeft(center, vw, vh)

  function addItem(afterId = null) {
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

  function updateItem(updated) {
    onChange((p) => ({ ...p, todos: p.todos.map((t) => (t.id === updated.id ? updated : t)) }))
  }

  function deleteItem(id) {
    onChange((p) => ({ ...p, todos: p.todos.filter((t) => t.id !== id) }))
  }

  function cancelPress() {
    clearTimeout(pressTimer.current)
    setPressing(false)
  }

  function handleFabMouseDown(e) {
    if (e.button !== 0) return
    movedRef.current = false
    pressStart.current = { x: e.clientX, y: e.clientY }
    setPressing(true)
    pressTimer.current = setTimeout(() => {
      movedRef.current = true
      setPressing(false)
      setOpen(false)
      setDragCenter({ ...pressStart.current })
    }, LONG_PRESS_MS)
  }

  function handleFabMouseMove(e) {
    // 옮기기 모드가 되기 전에 크게 움직이면 그냥 취소로 본다.
    if (!pressing || !pressStart.current) return
    if (Math.hypot(e.clientX - pressStart.current.x, e.clientY - pressStart.current.y) > 8) cancelPress()
  }

  function handleFabClick() {
    if (movedRef.current) {
      movedRef.current = false
      return
    }
    setOpen((o) => !o)
  }

  return (
    <div
      className={`archive-root ${dragging ? 'is-dragging' : ''} ${pressing ? 'is-pressing' : ''}`}
      ref={rootRef}
      style={{ '--proj-color': 'var(--accent)', left: fab.x, top: fab.y }}
    >
      <button
        className={`archive-fab ${open ? 'is-active' : ''}`}
        title="보관함 (길게 누르면 위치 이동)"
        onMouseDown={handleFabMouseDown}
        onMouseMove={handleFabMouseMove}
        onMouseUp={cancelPress}
        onMouseLeave={() => {
          if (!dragging) cancelPress()
        }}
        onClick={handleFabClick}
      >
        <Sparkles size={20} />
      </button>

      {open && (
        <div className="archive-panel" style={panelStyleFor(fab, vw, vh)}>
          <div className="archive-panel-header">
            <span className="archive-panel-title">보관함</span>
          </div>
          <ul className="archive-panel-list">
            {undated.map((todo) => (
              <ArchiveItem
                key={todo.id}
                todo={todo}
                onChange={updateItem}
                onDelete={deleteItem}
                onEnterAddNext={() => addItem(todo.id)}
                autoEdit={todo.id === newestId}
              />
            ))}
            <AddRow onAdd={() => addItem()} label="추가" />
          </ul>
        </div>
      )}
    </div>
  )
}
