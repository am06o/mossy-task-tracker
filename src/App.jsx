import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Square, X } from 'lucide-react'
import NavRail from './components/NavRail.jsx'
import ProjectSidebar from './components/ProjectSidebar.jsx'
import ProjectView from './components/ProjectView.jsx'
import ArchiveView from './components/ArchiveView.jsx'
import TodosView from './components/TodosView.jsx'
import CalendarView from './components/CalendarView.jsx'
import SettingsView from './components/SettingsView.jsx'
import ArchivePanel from './components/ArchivePanel.jsx'
import { normalizeSettings } from './lib/theme.js'
import { loadData, saveData, exportBackup as exportBackupData, importBackup as importBackupData, windowControls } from './lib/platform.js'
import { findNode, removeNode } from './lib/tree.js'
import { todayStr } from './lib/dateFormat.js'
import {
  TODOS_ID,
  canNestProject,
  isRealProject,
  makeProject,
  makeTodosProject,
  normalizeProjects,
  partitionProjects
} from './lib/projectsData.js'
import './App.css'

export default function App() {
  const [projects, setProjects] = useState([])
  const [settings, setSettings] = useState(normalizeSettings())
  const [activeView, setActiveView] = useState('todos')
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [showPastProjects, setShowPastProjects] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef(null)

  useEffect(() => {
    loadData().then((data) => {
      setProjects(normalizeProjects(data.projects))
      setSettings(normalizeSettings(data.settings))
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!loaded) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveData({ projects, settings })
    }, 400)
    return () => clearTimeout(saveTimer.current)
  }, [projects, settings, loaded])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', settings.themeColor)
  }, [settings.themeColor])

  function updatePaletteColor(index, hex) {
    setSettings((s) => {
      const palette = [...s.palette]
      palette[index] = hex
      return { ...s, palette }
    })
  }

  const todosProject = useMemo(
    () => projects.find((p) => p.id === TODOS_ID) || makeTodosProject(),
    [projects]
  )
  const realProjects = useMemo(() => projects.filter(isRealProject), [projects])
  const today = todayStr()
  const { active: activeProjects, past: pastProjects } = useMemo(
    () => partitionProjects(realProjects, today),
    [realProjects, today]
  )
  const sidebarProjects = showPastProjects ? pastProjects : activeProjects
  const selectedProject = sidebarProjects.find((p) => p.id === selectedProjectId) || null

  // 지금 보고 있는 목록(프로젝트 / 지난 프로젝트)에 선택된 프로젝트가 없으면 첫 항목을 고른다.
  // (마감해서 목록에서 빠졌을 때, 뒷면으로 뒤집었을 때 등)
  useEffect(() => {
    if (!loaded || selectedProject) return
    const first = sidebarProjects.find((p) => !p.parentProjectId) || sidebarProjects[0]
    setSelectedProjectId(first ? first.id : null)
  }, [loaded, selectedProject, sidebarProjects])

  // 일반 할 일 목록에서 특정 프로젝트에 연결해둔 항목들 — 해당 프로젝트의 진행률 계산에 함께 반영된다.
  const linkedTodosByProject = useMemo(() => {
    const map = new Map()
    for (const t of todosProject.todos) {
      if (!t.linkedProjectId) continue
      const list = map.get(t.linkedProjectId) || []
      list.push(t)
      map.set(t.linkedProjectId, list)
    }
    return map
  }, [todosProject])

  const childProjectsByParent = useMemo(() => {
    const map = new Map()
    for (const p of realProjects) {
      if (!p.parentProjectId || p.archived === true) continue
      const list = map.get(p.parentProjectId) || []
      list.push(p)
      map.set(p.parentProjectId, list)
    }
    return map
  }, [realProjects])

  function updateProject(id, updater) {
    setProjects((prev) => prev.map((p) => (p.id === id ? updater(p) : p)))
  }

  function addProject(name, parentProjectId = null) {
    const trimmed = name.trim()
    if (!trimmed) return null
    const p = { ...makeProject(trimmed), parentProjectId }
    setProjects((prev) => [...prev, p])
    return p
  }

  // 프로젝트 안에서 만드는 "하위 프로젝트" — 사이드바에도 바로 하위 항목으로 붙는다.
  function addChildProject(parentId) {
    addProject('새 프로젝트', parentId)
  }

  // 할 일을 다른 프로젝트(주로 하위 프로젝트)로 옮긴다.
  function moveNodeToProject(fromProjectId, nodeId, toProjectId) {
    setProjects((prev) => {
      const source = prev.find((p) => p.id === fromProjectId)
      const moved = source && findNode(source.todos, nodeId)
      if (!moved) return prev
      return prev.map((p) => {
        if (p.id === fromProjectId) return { ...p, todos: removeNode(p.todos, nodeId) }
        if (p.id === toProjectId) return { ...p, todos: [...p.todos, moved] }
        return p
      })
    })
  }

  // 완전 삭제 — 캘린더에서도 사라진다. 하위 프로젝트는 같이 지우지 않고 최상위로 올리고,
  // 이 프로젝트에 연결해둔 할 일들은 연결만 끊는다.
  function deleteProject(id) {
    if (id === TODOS_ID) return
    setProjects((prev) =>
      prev
        .filter((p) => p.id !== id)
        .map((p) => {
          if (p.parentProjectId === id) return { ...p, parentProjectId: null }
          if (p.id === TODOS_ID) {
            return {
              ...p,
              todos: p.todos.map((t) => (t.linkedProjectId === id ? { ...t, linkedProjectId: null } : t))
            }
          }
          return p
        })
    )
  }

  // 마감 → 지난 프로젝트로.
  function closeProject(id) {
    updateProject(id, (p) => ({ ...p, archived: true }))
  }

  // 복구 → 다시 프로젝트 목록으로. 마감일이 지났어도 계속 보이도록 archived=false로 고정한다.
  // 상위 프로젝트가 여전히 지난 프로젝트라면 이 프로젝트만 독립시켜서 돌아오게 한다.
  function restoreProject(id) {
    setProjects((prev) => {
      const target = prev.find((p) => p.id === id)
      const parent = target?.parentProjectId && prev.find((p) => p.id === target.parentProjectId)
      const parentStillPast = !!parent && pastProjects.some((p) => p.id === parent.id)
      return prev.map((p) =>
        p.id === id ? { ...p, archived: false, parentProjectId: parentStillPast ? null : p.parentProjectId } : p
      )
    })
  }

  function nestProject(draggedId, targetId) {
    setProjects((prev) => {
      if (!canNestProject(prev, draggedId, targetId)) return prev
      return prev.map((p) => (p.id === draggedId ? { ...p, parentProjectId: targetId } : p))
    })
  }

  function unnestProject(id) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, parentProjectId: null } : p)))
  }

  function setTodoDueDate(projectId, todoId, dateStr) {
    updateProject(projectId, (p) => ({
      ...p,
      todos: p.todos.map((t) => (t.id === todoId ? { ...t, dueDate: dateStr } : t))
    }))
  }

  async function exportBackup() {
    await exportBackupData({ projects, settings })
  }

  async function importBackup() {
    const res = await importBackupData()
    if (res.ok) {
      setProjects(normalizeProjects(res.data.projects))
      setSettings(normalizeSettings(res.data.settings))
      setSelectedProjectId(null)
      setShowPastProjects(false)
      setActiveView('projects')
    } else if (res.error === 'invalid-file') {
      alert('올바른 백업 파일이 아닙니다.')
    }
  }

  function goToOwner(projectId) {
    if (projectId === TODOS_ID) {
      setActiveView('todos')
    } else {
      setShowPastProjects(pastProjects.some((p) => p.id === projectId))
      setSelectedProjectId(projectId)
      setActiveView('projects')
    }
  }

  function toggleShowPastProjects() {
    setShowPastProjects((v) => !v)
    setSelectedProjectId(null)
  }

  if (!loaded) {
    return <div className="loading-screen">불러오는 중...</div>
  }

  return (
    <div className="app-shell">
      <div className="titlebar" data-tauri-drag-region>
        <span className="titlebar-title" data-tauri-drag-region>mossy</span>
        <div className="titlebar-controls">
          <button type="button" className="titlebar-btn" onClick={() => windowControls.minimize()} aria-label="최소화">
            <Minus size={14} />
          </button>
          <button type="button" className="titlebar-btn" onClick={() => windowControls.toggleMaximize()} aria-label="최대화">
            <Square size={11} />
          </button>
          <button type="button" className="titlebar-btn titlebar-btn-close" onClick={() => windowControls.close()} aria-label="닫기">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className={`app ${activeView === 'projects' && showPastProjects ? 'is-past-projects' : ''}`}>
        <NavRail activeView={activeView} onChangeView={setActiveView} />

        {activeView === 'projects' && (
          <ProjectSidebar
            projects={sidebarProjects}
            showPast={showPastProjects}
            onToggleShowPast={toggleShowPastProjects}
            selectedId={selectedProjectId}
            onSelect={setSelectedProjectId}
            onAdd={(name) => {
              const p = addProject(name)
              if (p) setSelectedProjectId(p.id)
            }}
            onClose={closeProject}
            onRestore={restoreProject}
            onDelete={deleteProject}
            onNest={nestProject}
            onUnnest={unnestProject}
            linkedTodosByProject={linkedTodosByProject}
          />
        )}

        <div className="app-main">
          {activeView === 'projects' &&
            (selectedProject ? (
              <ProjectView
                key={selectedProject.id}
                project={selectedProject}
                onChange={(updater) => updateProject(selectedProject.id, updater)}
                linkedTodos={linkedTodosByProject.get(selectedProject.id) || []}
                palette={settings.palette}
                childProjects={childProjectsByParent.get(selectedProject.id) || []}
                linkedTodosByProject={linkedTodosByProject}
                onSelectProject={setSelectedProjectId}
                onAddChildProject={() => addChildProject(selectedProject.id)}
                onUpdateProject={updateProject}
                onMoveNodeToProject={(nodeId, toProjectId) =>
                  moveNodeToProject(selectedProject.id, nodeId, toProjectId)
                }
              />
            ) : (
              <div className="empty-state" />
            ))}

          {activeView === 'archive' && (
            <ArchiveView
              project={todosProject}
              onChange={(updater) => updateProject(TODOS_ID, updater)}
              linkableProjects={activeProjects}
              themeColor={settings.themeColor}
            />
          )}

          {activeView === 'todos' && (
            <TodosView
              project={todosProject}
              onChange={(updater) => updateProject(TODOS_ID, updater)}
              linkableProjects={activeProjects}
              themeColor={settings.themeColor}
              onAssignDate={setTodoDueDate}
            />
          )}

          {activeView === 'calendar' && (
            <CalendarView
              projects={projects}
              archiveTodos={todosProject.todos.filter((t) => !t.dueDate)}
              onJumpTo={goToOwner}
              onAssignDate={setTodoDueDate}
              themeColor={settings.themeColor}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              themeColor={settings.themeColor}
              onChangeThemeColor={(themeColor) => setSettings((s) => ({ ...s, themeColor }))}
              palette={settings.palette}
              onChangePaletteColor={updatePaletteColor}
              onExport={exportBackup}
              onImport={importBackup}
            />
          )}
        </div>

        <ArchivePanel
          project={todosProject}
          onChange={(updater) => updateProject(TODOS_ID, updater)}
          visible={activeView === 'todos' || activeView === 'calendar' || activeView === 'projects'}
          position={settings.fabPosition}
          onMove={(fabPosition) => setSettings((s) => ({ ...s, fabPosition }))}
        />
      </div>
    </div>
  )
}
