import { Fragment, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react'
import ContextMenu from './ContextMenu.jsx'
import { projectDisplayProgress } from '../lib/progress.js'
import { progressGradient } from '../lib/theme.js'
import './ProjectSidebar.css'

// 세로 위치로 "이 줄 위/아래로 순서 바꾸기"와 "이 줄 안에 넣기(중첩)"를 가른다.
const EDGE_ZONE_RATIO = 0.3

// 프로젝트 사이드바. "−"를 누르면 뒷면인 "지난 프로젝트"(마감했거나 마감일이 지난 것)로
// 뒤집히고, 다시 "−"를 누르면 원래 목록으로 돌아온다. 우클릭으로 생성/마감/복구/삭제.
export default function ProjectSidebar({
  projects,
  showPast,
  onToggleShowPast,
  selectedId,
  onSelect,
  onAdd,
  onClose,
  onRestore,
  onDelete,
  onNest,
  onUnnest,
  onReorder,
  onToggleChildren,
  linkedTodosByProject
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [menu, setMenu] = useState(null)
  const [dropTargetId, setDropTargetId] = useState(null)
  const [reorderPreview, setReorderPreview] = useState(null) // { id, place: 'above' | 'below' }

  useEffect(() => {
    if (showPast) setAdding(false)
  }, [showPast])

  function commitAdd() {
    const trimmed = draft.trim()
    setAdding(false)
    setDraft('')
    if (trimmed) onAdd(trimmed)
  }

  const ids = new Set(projects.map((p) => p.id))
  // 이 목록 안에 상위가 없는 항목은 최상위로 보여준다(예: 상위는 살아있는데 직접 마감한 하위 프로젝트).
  const roots = projects.filter((p) => !p.parentProjectId || !ids.has(p.parentProjectId))
  const childrenOf = (id) => projects.filter((p) => p.parentProjectId === id)

  function openMenu(e, project) {
    e.preventDefault()
    e.stopPropagation()
    if (showPast && !project) return
    setMenu({ x: e.clientX, y: e.clientY, project })
  }

  function menuItems(project) {
    const items = []
    if (!showPast) items.push({ label: '프로젝트 생성', onClick: () => setAdding(true) })
    if (!showPast && project) items.push({ label: '프로젝트 마감', onClick: () => onClose(project.id) })
    if (showPast && project) items.push({ label: '복구', onClick: () => onRestore(project.id) })
    if (project) {
      items.push({
        label: '프로젝트 삭제',
        danger: true,
        onClick: () => {
          if (confirm(`"${project.name}" 프로젝트를 완전히 삭제할까요?\n캘린더에서도 사라지고 되돌릴 수 없어요.`)) {
            onDelete(project.id)
          }
        }
      })
    }
    return items
  }

  function handleDropOnHeader(e) {
    e.preventDefault()
    if (showPast) return
    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId) onUnnest(draggedId)
  }

  // 같은 부모(둘 다 최상위, 또는 같은 상위 프로젝트의 하위)일 때만 "위/아래로 순서만 바꾸기"를
  // 허용한다 — 부모가 다르면 가장자리에서도 그냥 기존 중첩 동작으로 본다.
  function resolveDragZone(e, target) {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientY - rect.top) / rect.height
    if (ratio < EDGE_ZONE_RATIO) return 'above'
    if (ratio > 1 - EDGE_ZONE_RATIO) return 'below'
    return 'nest'
  }

  function handleDragOverProject(e, target) {
    e.preventDefault()
    if (showPast) return
    const draggedId = e.dataTransfer.getData('text/plain')
    const zone = resolveDragZone(e, target)
    if (zone !== 'nest') {
      setDropTargetId(null)
      setReorderPreview({ id: target.id, place: zone })
    } else {
      setReorderPreview((cur) => (cur?.id === target.id ? null : cur))
      setDropTargetId(target.id)
    }
  }

  function handleDragLeaveProject(id) {
    setDropTargetId((cur) => (cur === id ? null : cur))
    setReorderPreview((cur) => (cur?.id === id ? null : cur))
  }

  function handleDropOnProject(e, target) {
    e.preventDefault()
    e.stopPropagation()
    if (showPast) return
    const zone = resolveDragZone(e, target)
    setDropTargetId(null)
    setReorderPreview(null)
    const draggedId = e.dataTransfer.getData('text/plain')
    if (!draggedId || draggedId === target.id) return
    const dragged = projects.find((p) => p.id === draggedId)
    if (!dragged) return
    const sameParent = (dragged.parentProjectId || null) === (target.parentProjectId || null)
    if (zone !== 'nest' && sameParent) {
      onReorder(draggedId, target.id, zone === 'below')
      return
    }
    onNest(draggedId, target.id)
  }

  function renderRow(p, isChild) {
    const kids = isChild ? [] : childrenOf(p.id)
    const childPcts = kids.map((c) => projectDisplayProgress(c, linkedTodosByProject?.get(c.id) || []))
    const pct = projectDisplayProgress(p, linkedTodosByProject?.get(p.id) || [], childPcts)
    const preview = reorderPreview?.id === p.id ? reorderPreview.place : null

    return (
      <Fragment key={p.id}>
        {preview === 'above' && <li className="project-divider" />}
        <li
          className={`project-item ${p.id === selectedId ? 'is-selected' : ''} ${isChild ? 'is-child' : ''} ${
            dropTargetId === p.id ? 'is-nest-target' : ''
          }`}
          draggable={!showPast}
          onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}
          onDragOver={(e) => handleDragOverProject(e, p)}
          onDragLeave={() => handleDragLeaveProject(p.id)}
          onDrop={(e) => handleDropOnProject(e, p)}
          onClick={() => onSelect(p.id)}
          onContextMenu={(e) => openMenu(e, p)}
        >
          <div className="project-item-main">
            {!isChild && kids.length > 0 && (
              <button
                type="button"
                className="project-item-toggle"
                title={p.childrenVisible === false ? '펼치기' : '접기'}
                draggable={false}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleChildren(p.id)
                }}
              >
                {p.childrenVisible === false ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
            <span className="project-dot" style={{ backgroundColor: p.color }} />
            <span className="project-name">{p.name}</span>
            <span className="project-pct">{pct}%</span>
          </div>
          <div className="project-bar">
            <div className="project-bar-fill" style={{ width: `${pct}%`, background: progressGradient(p.color) }} />
          </div>
        </li>
        {preview === 'below' && <li className="project-divider" />}
      </Fragment>
    )
  }

  return (
    <aside className="sidebar" onContextMenu={(e) => openMenu(e, null)}>
      <div className="sidebar-header" onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnHeader}>
        <span className="sidebar-title">{showPast ? '지난 프로젝트' : '프로젝트'}</span>
        <div className="sidebar-header-actions">
          <button
            className={`sidebar-add-btn ${showPast ? 'is-active' : ''}`}
            title={showPast ? '프로젝트로 돌아가기' : '지난 프로젝트 보기'}
            onClick={onToggleShowPast}
          >
            <Minus size={16} />
          </button>
          {!showPast && (
            <button className="sidebar-add-btn" title="새 프로젝트" onClick={() => setAdding(true)}>
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>

      {adding && (
        <input
          className="sidebar-add-input"
          autoFocus
          value={draft}
          placeholder="새 프로젝트 이름"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitAdd}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitAdd()
            if (e.key === 'Escape') {
              setDraft('')
              setAdding(false)
            }
          }}
        />
      )}

      <ul className="project-list">
        {showPast && roots.length === 0 && <li className="sidebar-empty">지난 프로젝트가 없어요.</li>}
        {roots.map((root) => {
          const kids = childrenOf(root.id)
          const expanded = showPast || root.childrenVisible !== false
          return (
            <Fragment key={root.id}>
              {renderRow(root, false)}
              {expanded && kids.map((child) => renderRow(child, true))}
            </Fragment>
          )
        })}
      </ul>

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems(menu.project)} onClose={() => setMenu(null)} />
      )}
    </aside>
  )
}
