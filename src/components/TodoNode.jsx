import { useState } from 'react'
import { ChevronDown, ChevronRight, GripVertical, Plus, X } from 'lucide-react'
import TodoItem from './TodoItem.jsx'
import ContextMenu from './ContextMenu.jsx'
import { nodeProgress } from '../lib/progress.js'
import { progressGradient } from '../lib/theme.js'

function dragPayload(nodeId) {
  return JSON.stringify({ nodeId })
}

function readDragPayload(e) {
  try {
    return JSON.parse(e.dataTransfer.getData('text/plain')).nodeId
  } catch {
    return null
  }
}

export default function TodoNode({
  node,
  parentId,
  index,
  depth,
  color,
  onUpdateTask,
  onAdjustProgress,
  onDeleteNode,
  onToggleCollapse,
  onAddTask,
  onAddAfter,
  onRenameGroup,
  onMove,
  autoEditId
}) {
  const [editingTitle, setEditingTitle] = useState(node.id === autoEditId)
  const [titleDraft, setTitleDraft] = useState(node.title)
  const [menu, setMenu] = useState(null)

  function commitTitle() {
    const trimmed = titleDraft.trim()
    setEditingTitle(false)
    if (trimmed && trimmed !== node.title) onRenameGroup(node.id, trimmed)
    else setTitleDraft(node.title)
  }

  function handleRowDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    const draggedId = readDragPayload(e)
    if (draggedId && draggedId !== node.id) onMove(draggedId, parentId, index)
  }

  if (!node.isGroup) {
    return (
      <TodoItem
        todo={node}
        color={color}
        onChange={onUpdateTask}
        onAdjustProgress={onAdjustProgress}
        onDelete={onDeleteNode}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', dragPayload(node.id))}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleRowDrop}
        onEnterAddNext={() => onAddAfter(node.id)}
        style={{ marginLeft: depth * 30 }}
        autoEdit={node.id === autoEditId}
      />
    )
  }

  const pct = nodeProgress(node)

  return (
    <li
      className="todo-group"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleRowDrop}
      style={{ marginLeft: depth * 30 }}
    >
      <div
        className="todo-group-header"
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setMenu({ x: e.clientX, y: e.clientY })
        }}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', dragPayload(node.id))}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const draggedId = readDragPayload(e)
          if (draggedId && draggedId !== node.id) onMove(draggedId, node.id, node.todos.length)
        }}
      >
        <button
          className="todo-group-collapse"
          onClick={() => onToggleCollapse(node.id)}
          title={node.collapsed ? '펼치기' : '접기'}
        >
          {node.collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
        </button>

        <span className="todo-drag-handle" title="드래그하여 옮기기">
          <GripVertical size={15} />
        </span>

        {editingTitle ? (
          <input
            className="todo-title-input"
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle()
              if (e.key === 'Escape') {
                setTitleDraft(node.title)
                setEditingTitle(false)
              }
            }}
          />
        ) : (
          <span
            className={`todo-group-title ${node.title ? '' : 'is-untitled'}`}
            onClick={() => setEditingTitle(true)}
          >
            {node.title || '이름 없음'}
          </span>
        )}

        <div className="todo-group-bar">
          <div className="todo-group-bar-fill" style={{ width: `${pct}%`, background: progressGradient(color) }} />
        </div>
        <span className="todo-group-pct">{pct}%</span>

        <button className="todo-group-action" title="할 일 추가" onClick={() => onAddTask(node.id)}>
          <Plus size={14} />
        </button>
        <button className="todo-group-action todo-group-delete" title="그룹 삭제" onClick={() => onDeleteNode(node.id)}>
          <X size={14} />
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
                  setTitleDraft(node.title)
                  setEditingTitle(true)
                }
              },
              { label: '그룹 삭제', danger: true, onClick: () => onDeleteNode(node.id) }
            ]}
          />
        )}
      </div>

      {!node.collapsed && node.todos.length > 0 && (
        <ul className="todo-group-children">
          {node.todos.map((child, i) => (
            <TodoNode
              key={child.id}
              node={child}
              parentId={node.id}
              index={i}
              depth={depth + 1}
              color={color}
              onUpdateTask={onUpdateTask}
              onAdjustProgress={onAdjustProgress}
              onDeleteNode={onDeleteNode}
              onToggleCollapse={onToggleCollapse}
              onAddTask={onAddTask}
              onAddAfter={onAddAfter}
              onRenameGroup={onRenameGroup}
              onMove={onMove}
              autoEditId={autoEditId}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
