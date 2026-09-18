import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight, Folder, FolderOpen, Plus } from 'lucide-react'
import TodoNode from './TodoNode.jsx'
import ProjectMenu from './ProjectMenu.jsx'
import ContextMenu from './ContextMenu.jsx'
import DateChip from './DateChip.jsx'
import AddRow from './AddRow.jsx'
import ProgressControl from './ProgressControl.jsx'
import { projectDisplayProgress, clampProgress } from '../lib/progress.js'
import { makeTodo } from '../lib/projectsData.js'
import { mapNode, removeNode, addChild, addSiblingAfter, moveNode } from '../lib/tree.js'
import { buildTopEntries, anchorAboveTodo, anchorBelowTodo } from '../lib/topOrder.js'
import { isOverdue, todayStr } from '../lib/dateFormat.js'
import './ProjectView.css'

// 드래그중인 할 일을 하위 프로젝트 줄의 왼쪽 끝에서 이 픽셀 이내로 가져가면
// "프로젝트에 편입"이 아니라 "이 프로젝트 위/아래로 순서만 바꾸기"로 본다.
const REORDER_ZONE_PX = 28

// 한 프로젝트의 할 일 트리를 고치는 조작 모음. 지금 보는 프로젝트뿐 아니라, 그 안에 펼쳐 보이는
// 하위 프로젝트의 할 일도 같은 방식으로 다루기 위해 onChange만 바꿔 끼워 쓴다.
// 할 일을 실제로 건드리는 조작은 손으로 끌어내린 전체 진척도 override를 함께 지운다.
function createTreeActions(onChange, setNewestId) {
  const withTodos = (p, todos) => ({ ...p, todos, progressOverride: null })
  return {
    addTaskAt(parentId) {
      const task = makeTodo('')
      onChange((p) => withTodos(p, addChild(p.todos, parentId, task)))
      setNewestId(task.id)
    },
    addTaskAfter(nodeId) {
      const task = makeTodo('')
      onChange((p) => withTodos(p, addSiblingAfter(p.todos, nodeId, task)))
      setNewestId(task.id)
    },
    updateTask(updated) {
      onChange((p) => withTodos(p, mapNode(p.todos, updated.id, () => updated)))
    },
    deleteNode(id) {
      onChange((p) => withTodos(p, removeNode(p.todos, id)))
    },
    adjustTodoProgress(id, delta) {
      onChange((p) =>
        withTodos(p, mapNode(p.todos, id, (n) => ({ ...n, progress: clampProgress((n.progress || 0) + delta) })))
      )
    },
    toggleCollapse(id) {
      onChange((p) => ({ ...p, todos: mapNode(p.todos, id, (n) => ({ ...n, collapsed: !n.collapsed })) }))
    },
    renameGroup(id, title) {
      onChange((p) => ({ ...p, todos: mapNode(p.todos, id, (n) => ({ ...n, title })) }))
    },
    move(nodeId, targetParentId, targetIndex) {
      onChange((p) => ({ ...p, todos: moveNode(p.todos, nodeId, targetParentId, targetIndex) }))
    }
  }
}

function TodoTree({ nodes, actions, color, depth, newestId }) {
  return nodes.map((node, index) => (
    <TodoNode
      key={node.id}
      node={node}
      parentId={null}
      index={index}
      depth={depth}
      color={color}
      onUpdateTask={actions.updateTask}
      onAdjustProgress={actions.adjustTodoProgress}
      onDeleteNode={actions.deleteNode}
      onToggleCollapse={actions.toggleCollapse}
      onAddTask={actions.addTaskAt}
      onAddAfter={actions.addTaskAfter}
      onRenameGroup={actions.renameGroup}
      onMove={actions.move}
      autoEditId={newestId}
    />
  ))
}

export default function ProjectView({
  project,
  onChange,
  linkedTodos = [],
  palette,
  childProjects = [],
  linkedTodosByProject,
  onSelectProject,
  onAddChildProject,
  onUpdateProject,
  onMoveNodeToProject,
  onReorderChildProject,
  onCloseChildProject,
  onDeleteChildProject
}) {
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(project.name)
  const [editingNote, setEditingNote] = useState(false)
  const [noteDraft, setNoteDraft] = useState(project.note || '')
  const [startEditing, setStartEditing] = useState(false)
  const [dueEditing, setDueEditing] = useState(false)
  const [newestId, setNewestId] = useState(null)
  const [dropTargetId, setDropTargetId] = useState(null)
  const [reorderPreview, setReorderPreview] = useState(null) // { childId, place: 'above' | 'below' }
  const [editingChildId, setEditingChildId] = useState(null)
  const [childMenu, setChildMenu] = useState(null)

  const childPctById = new Map(
    childProjects.map((c) => [c.id, projectDisplayProgress(c, linkedTodosByProject?.get(c.id) || [])])
  )
  const pct = projectDisplayProgress(project, linkedTodos, [...childPctById.values()])
  const color = project.color
  // 하위 프로젝트는 폴더처럼 2단계까지만 — 이미 하위인 프로젝트 안에서는 더 만들지 않는다.
  const canAddChild = !project.parentProjectId
  const actions = createTreeActions(onChange, setNewestId)

  function commitName() {
    const trimmed = nameDraft.trim()
    setEditingName(false)
    if (trimmed && trimmed !== project.name) {
      onChange((p) => ({ ...p, name: trimmed }))
    } else {
      setNameDraft(project.name)
    }
  }

  function commitNote() {
    const trimmed = noteDraft.trim()
    setEditingNote(false)
    if (trimmed !== (project.note || '')) {
      onChange((p) => ({ ...p, note: trimmed }))
    }
  }

  // 전체 진척도 슬라이더는 할 일 자체를 건드리지 않는, 사용자가 직접 지정하는 override다.
  // "할 일은 다 끝냈지만 실제 프로젝트는 아직" 같은 경우를 표시하려고 끌어내려도
  // 개별 할 일의 100%는 그대로 남는다.
  function setOverallProgress(value) {
    onChange((p) => ({ ...p, progressOverride: value }))
  }

  function adjustOverallProgress(delta) {
    onChange((p) => {
      const current = typeof p.progressOverride === 'number' ? p.progressOverride : pct
      return { ...p, progressOverride: clampProgress(current + delta) }
    })
  }

  // 하위 프로젝트 줄 왼쪽 가장자리 근처로 드래그를 가져가면 "이 프로젝트에 편입"이 아니라
  // "이 프로젝트 위/아래로 순서만 바꾸기"로 본다 — 세로 위치로 위/아래를 가른다.
  function resolveDragZone(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    if (offsetX >= REORDER_ZONE_PX) return { mode: 'nest' }
    const place = e.clientY - rect.top < rect.height / 2 ? 'above' : 'below'
    return { mode: 'reorder', place }
  }

  function handleChildDragOver(e, childId) {
    e.preventDefault()
    const { mode, place } = resolveDragZone(e)
    if (mode === 'reorder') {
      setDropTargetId(null)
      setReorderPreview({ childId, place })
    } else {
      setReorderPreview((cur) => (cur?.childId === childId ? null : cur))
      setDropTargetId(childId)
    }
  }

  function handleChildDragLeave(childId) {
    setDropTargetId((cur) => (cur === childId ? null : cur))
    setReorderPreview((cur) => (cur?.childId === childId ? null : cur))
  }

  function handleChildDrop(e, childId) {
    e.preventDefault()
    e.stopPropagation()
    const { mode, place } = resolveDragZone(e)
    setDropTargetId(null)
    setReorderPreview(null)
    let data
    try {
      data = JSON.parse(e.dataTransfer.getData('text/plain'))
    } catch {
      return // 드래그 데이터가 없으면 무시
    }

    if (mode === 'reorder' && data.nodeId) {
      const anchor = place === 'above' ? anchorAboveTodo(project.todos, data.nodeId) : anchorBelowTodo(project.todos, data.nodeId)
      if (anchor !== null) onUpdateProject(childId, (c) => ({ ...c, insertBeforeId: anchor }))
      return
    }

    if (data.childProjectId) {
      if (data.childProjectId !== childId) onReorderChildProject(data.childProjectId, childId)
      return
    }
    if (data.nodeId) onMoveNodeToProject(data.nodeId, childId)
  }

  function childMenuItems(child) {
    return [
      { label: '이름수정', onClick: () => setEditingChildId(child.id) },
      { label: '프로젝트 열기', onClick: () => onSelectProject(child.id) },
      { label: '프로젝트 마감', onClick: () => onCloseChildProject(child.id) },
      {
        label: '프로젝트 삭제',
        danger: true,
        onClick: () => {
          if (confirm(`"${child.name}" 프로젝트를 완전히 삭제할까요?\n캘린더에서도 사라지고 되돌릴 수 없어요.`)) {
            onDeleteChildProject(child.id)
          }
        }
      }
    ]
  }

  function renderChild(child) {
    const childChange = (updater) => onUpdateProject(child.id, updater)
    const childActions = createTreeActions(childChange, setNewestId)
    const toggle = () => childChange((p) => ({ ...p, expanded: !p.expanded }))
    const preview = reorderPreview?.childId === child.id ? reorderPreview.place : null

    return (
      <Fragment key={child.id}>
        {preview === 'above' && <li className="todo-divider" />}
        <li
          className={`project-child-row ${dropTargetId === child.id ? 'is-drop-target' : ''}`}
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ childProjectId: child.id }))}
          onDragOver={(e) => handleChildDragOver(e, child.id)}
          onDragLeave={() => handleChildDragLeave(child.id)}
          onDrop={(e) => handleChildDrop(e, child.id)}
          onContextMenu={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setChildMenu({ x: e.clientX, y: e.clientY, child })
          }}
        >
          <button
            className="project-child-toggle"
            title={child.expanded ? '접기' : '펼치기'}
            draggable={false}
            onClick={toggle}
          >
            {child.expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
          <span className="project-child-icon" style={{ color: child.color }} onClick={toggle}>
            {child.expanded ? <FolderOpen size={15} /> : <Folder size={15} />}
          </span>
          <ChildName
            project={child}
            onRename={(name) => childChange((p) => ({ ...p, name }))}
            editing={editingChildId === child.id}
            onEditingChange={(v) => setEditingChildId(v ? child.id : null)}
          />
          <span className="project-child-count">{child.todos.length > 0 ? child.todos.length : ''}</span>
          <button
            className="project-child-action"
            title="이 하위 프로젝트에 할 일 추가"
            draggable={false}
            onClick={() => {
              if (!child.expanded) childChange((p) => ({ ...p, expanded: true }))
              childActions.addTaskAt(null)
            }}
          >
            <Plus size={14} />
          </button>
          <ProgressControl
            size="sm"
            value={childPctById.get(child.id)}
            color={child.color}
            onChange={(value) => childChange((p) => ({ ...p, progressOverride: value }))}
          />
        </li>

        {child.expanded && (
          <li className="project-child-body">
            <ul className="todo-group-children">
              <TodoTree nodes={child.todos} actions={childActions} color={child.color} depth={0} newestId={newestId} />
            </ul>
          </li>
        )}
        {preview === 'below' && <li className="todo-divider" />}
      </Fragment>
    )
  }

  return (
    <main className="project-view" style={{ '--proj-color': color }}>
      <header className="project-view-header">
        <div className="project-name-row">
          {editingName ? (
            <input
              className="project-name-input"
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName()
                if (e.key === 'Escape') {
                  setNameDraft(project.name)
                  setEditingName(false)
                }
              }}
            />
          ) : (
            <h1 className="project-name-title" onClick={() => setEditingName(true)}>
              {project.name}
            </h1>
          )}

          <div className="project-dates">
            <span className="project-date-field">
              <button
                className="project-date-label"
                onClick={() => {
                  if (!project.startDate) onChange((p) => ({ ...p, startDate: todayStr() }))
                  setStartEditing(true)
                }}
              >
                시작
              </button>
              <DateChip
                value={project.startDate}
                onChange={(startDate) => onChange((p) => ({ ...p, startDate }))}
                title="시작일"
                open={startEditing}
                onOpenChange={setStartEditing}
              />
            </span>
            <span className="project-date-field">
              <button
                className="project-date-label"
                onClick={() => {
                  if (!project.dueDate) onChange((p) => ({ ...p, dueDate: todayStr() }))
                  setDueEditing(true)
                }}
              >
                마감
              </button>
              <DateChip
                value={project.dueDate}
                onChange={(dueDate) => onChange((p) => ({ ...p, dueDate }))}
                overdue={isOverdue(project.dueDate, pct >= 100)}
                title="마감일"
                open={dueEditing}
                onOpenChange={setDueEditing}
              />
            </span>
          </div>

          <ProjectMenu
            color={color}
            onChangeColor={(hex) => onChange((p) => ({ ...p, color: hex }))}
            priority={project.priority}
            onChangePriority={(priority) => onChange((p) => ({ ...p, priority }))}
            palette={palette}
          />
        </div>

        {editingNote ? (
          <input
            className="project-note-input"
            autoFocus
            value={noteDraft}
            placeholder="이 프로젝트에 대한 짧은 메모"
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={commitNote}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitNote()
              if (e.key === 'Escape') {
                setNoteDraft(project.note || '')
                setEditingNote(false)
              }
            }}
          />
        ) : project.note ? (
          <p className="project-note" onClick={() => setEditingNote(true)}>
            {project.note}
          </p>
        ) : (
          <button className="project-note-add" onClick={() => setEditingNote(true)}>
            <Plus size={11} />
            <span className="project-note-add-label">메모 추가</span>
          </button>
        )}

        <div className="project-overall">
          <ProgressControl
            size="xl"
            value={pct}
            color={color}
            onChange={setOverallProgress}
            onAdjust={adjustOverallProgress}
          />
        </div>
      </header>

      <ul className="todo-list">
        {buildTopEntries(project.todos, childProjects).map((entry) =>
          entry.type === 'child' ? (
            renderChild(entry.child)
          ) : (
            <TodoNode
              key={entry.node.id}
              node={entry.node}
              parentId={null}
              index={entry.index}
              depth={0}
              color={color}
              onUpdateTask={actions.updateTask}
              onAdjustProgress={actions.adjustTodoProgress}
              onDeleteNode={actions.deleteNode}
              onToggleCollapse={actions.toggleCollapse}
              onAddTask={actions.addTaskAt}
              onAddAfter={actions.addTaskAfter}
              onRenameGroup={actions.renameGroup}
              onMove={actions.move}
              autoEditId={newestId}
            />
          )
        )}

        <AddRow
          onAdd={canAddChild ? undefined : () => actions.addTaskAt(null)}
          onAddTask={canAddChild ? () => actions.addTaskAt(null) : undefined}
          onAddProject={canAddChild ? onAddChildProject : undefined}
        />
      </ul>

      {childMenu && (
        <ContextMenu
          x={childMenu.x}
          y={childMenu.y}
          items={childMenuItems(childMenu.child)}
          onClose={() => setChildMenu(null)}
        />
      )}
    </main>
  )
}

function ChildName({ project, onRename, editing, onEditingChange }) {
  const [internalEditing, setInternalEditing] = useState(false)
  const isControlled = editing !== undefined
  const isEditing = isControlled ? editing : internalEditing
  const setEditing = isControlled ? onEditingChange : setInternalEditing
  const [draft, setDraft] = useState(project.name)

  function commit() {
    const trimmed = draft.trim()
    setEditing(false)
    if (trimmed && trimmed !== project.name) onRename(trimmed)
    else setDraft(project.name)
  }

  if (isEditing) {
    return (
      <input
        className="todo-title-input"
        draggable={false}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setDraft(project.name)
            setEditing(false)
          }
        }}
      />
    )
  }

  return (
    <span className="project-child-name" onClick={() => setEditing(true)}>
      {project.name}
    </span>
  )
}
