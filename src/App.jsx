import { useEffect, useMemo, useRef, useState } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import NavRail from './components/NavRail.jsx'
import ProjectSidebar from './components/ProjectSidebar.jsx'
import ProjectView from './components/ProjectView.jsx'
import ArchiveView from './components/ArchiveView.jsx'
import TodosView from './components/TodosView.jsx'
import CalendarView from './components/CalendarView.jsx'
import SettingsView from './components/SettingsView.jsx'
import ArchivePanel from './components/ArchivePanel.jsx'
import ResizeHandles from './components/ResizeHandles.jsx'
import TitleBar from './components/TitleBar.jsx'
import AuthView from './components/AuthView.jsx'
import { normalizeSettings } from './lib/theme.js'
import {
  loadData,
  saveData,
  exportBackup as exportBackupData,
  importBackup as importBackupData,
  openThemeEditor
} from './lib/platform.js'
import { supabase, supabaseConfigured } from './lib/supabase.js'
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

const runningInTauri = isTauri()

export default function App() {
  const [projects, setProjects] = useState([])
  const [settings, setSettings] = useState(normalizeSettings())
  const [activeView, setActiveView] = useState('todos')
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [showPastProjects, setShowPastProjects] = useState(false)
  const [todosJumpDate, setTodosJumpDate] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [session, setSession] = useState(undefined) // undefined: 확인 중, null: 로그아웃, 객체: 로그인됨
  const saveTimer = useRef(null)

  // Supabase 연결을 안 해뒀으면(.env 미설정) 로그인 없이 예전처럼 로컬 전용으로 돈다.
  useEffect(() => {
    if (!supabaseConfigured) {
      setSession(null)
      return
    }
    supabase.auth.getSession().then(
      ({ data }) => setSession(data.session),
      () => setSession(null) // 세션 확인이 실패해도(오프라인 등) 로그인 화면은 보여줘야 한다
    )
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signedIn = !supabaseConfigured || Boolean(session)

  useEffect(() => {
    if (!signedIn) return
    setLoaded(false)
    loadData().then((data) => {
      setProjects(normalizeProjects(data.projects))
      setSettings(normalizeSettings(data.settings))
      setLoaded(true)
    })
  }, [signedIn])

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light')
  }, [settings.darkMode])

  // 사용자가 가져온 커스텀 CSS — 다른 스타일시트보다 나중에 <head>에 붙어서 뭐든 덮어쓸 수 있다.
  useEffect(() => {
    let styleEl = document.getElementById('mossy-custom-css')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'mossy-custom-css'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = settings.customCssEnabled ? settings.customCss || '' : ''
  }, [settings.customCss, settings.customCssEnabled])

  // 커스텀 CSS가 --accent를 덮어쓰는 중이면, 실제 화면에 보이는 색(effectiveThemeColor)은
  // 저장된 settings.themeColor가 아니라 이 값을 따라야 한다 — 설정의 테마 색 선택 표시나
  // 테마 색을 그대로 쓰는 할 일들(예: TodosView)이 실제 색과 어긋나지 않도록. settings.themeColor
  // 자체는 건드리지 않아서, 커스텀 CSS를 끄거나 초기화하면 원래 골랐던 색으로 그대로 돌아온다.
  const effectiveThemeColor = useMemo(() => {
    if (settings.customCssEnabled && settings.customCss) {
      const matches = [...settings.customCss.matchAll(/--accent\s*:\s*(#[0-9a-fA-F]{6})\b/g)]
      if (matches.length) return matches[matches.length - 1][1]
    }
    return settings.themeColor
  }, [settings.customCss, settings.customCssEnabled, settings.themeColor])

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
    const parent = parentProjectId ? projects.find((p) => p.id === parentProjectId) : null
    const color = parent ? parent.color : effectiveThemeColor
    const p = { ...makeProject(trimmed), parentProjectId, color }
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

  // 같은 상위 프로젝트 아래 하위 프로젝트끼리, 또는 사이드바의 최상위 프로젝트끼리 순서를
  // 바꾼다 — 끌어놓은 항목이 목표 항목 바로 앞(또는 placeAfter면 바로 뒤)으로 온다.
  function reorderChildProject(draggedId, targetId, placeAfter = false) {
    setProjects((prev) => {
      if (draggedId === targetId) return prev
      const dragged = prev.find((p) => p.id === draggedId)
      if (!dragged) return prev
      const without = prev.filter((p) => p.id !== draggedId)
      let targetIndex = without.findIndex((p) => p.id === targetId)
      if (targetIndex === -1) return prev
      if (placeAfter) targetIndex += 1
      const next = [...without]
      next.splice(targetIndex, 0, dragged)
      return next
    })
  }

  // 사이드바에서 "이 프로젝트 아래 하위 프로젝트들 보이기/접기" — ProjectView 안에서 하위
  // 프로젝트 자신의 할 일을 펼치는 project.expanded와는 다른 필드라, 기본값이 서로 안 엉킨다.
  function toggleChildrenVisible(id) {
    updateProject(id, (p) => ({ ...p, childrenVisible: p.childrenVisible === false }))
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

  // 캘린더에서 날짜 칸을 누르면 그 날짜의 할 일 화면으로 넘어간다.
  function jumpToDate(dateStr) {
    setTodosJumpDate(dateStr)
    setActiveView('todos')
  }

  function toggleShowPastProjects() {
    setShowPastProjects((v) => !v)
    setSelectedProjectId(null)
  }

  const authChecked = session !== undefined
  const needsSignIn = authChecked && supabaseConfigured && !session
  const stillLoading = !authChecked || (!needsSignIn && !loaded)

  // 데스크톱(Tauri)에서는 로딩·로그인 화면에서도 창을 옮기거나 닫을 수 있어야 하므로,
  // 어느 화면이든 타이틀바만은 항상 먼저 그린다.
  if (stillLoading || needsSignIn) {
    return (
      <div className="app-shell">
        {runningInTauri && <ResizeHandles />}
        {runningInTauri && <TitleBar />}
        {stillLoading ? <div className="loading-screen">불러오는 중...</div> : <AuthView />}
      </div>
    )
  }

  return (
    <div className="app-shell">
      {runningInTauri && <ResizeHandles />}
      {runningInTauri && <TitleBar />}

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
            onReorder={reorderChildProject}
            onToggleChildren={toggleChildrenVisible}
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
                onReorderChildProject={reorderChildProject}
                onCloseChildProject={closeProject}
                onDeleteChildProject={deleteProject}
              />
            ) : (
              <div className="empty-state" />
            ))}

          {activeView === 'archive' && (
            <ArchiveView
              project={todosProject}
              onChange={(updater) => updateProject(TODOS_ID, updater)}
              linkableProjects={activeProjects}
              themeColor={effectiveThemeColor}
            />
          )}

          {activeView === 'todos' && (
            <TodosView
              project={todosProject}
              onChange={(updater) => updateProject(TODOS_ID, updater)}
              onUpdateProject={updateProject}
              linkableProjects={activeProjects}
              allProjects={projects}
              themeColor={effectiveThemeColor}
              onAssignDate={setTodoDueDate}
              initialDate={todosJumpDate}
              onConsumeInitialDate={() => setTodosJumpDate(null)}
            />
          )}

          {activeView === 'calendar' && (
            <CalendarView
              projects={projects}
              archiveTodos={todosProject.todos.filter((t) => !t.dueDate)}
              onJumpTo={goToOwner}
              onJumpToDate={jumpToDate}
              onAssignDate={setTodoDueDate}
              themeColor={effectiveThemeColor}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              themeColor={effectiveThemeColor}
              onChangeThemeColor={(themeColor) => setSettings((s) => ({ ...s, themeColor }))}
              palette={settings.palette}
              onChangePaletteColor={updatePaletteColor}
              darkMode={settings.darkMode}
              onChangeDarkMode={(darkMode) => setSettings((s) => ({ ...s, darkMode }))}
              customCss={settings.customCss}
              customCssName={settings.customCssName}
              customCssEnabled={settings.customCssEnabled}
              onImportCustomCss={(customCss, customCssName) =>
                setSettings((s) => ({ ...s, customCss, customCssName, customCssEnabled: true }))
              }
              onToggleCustomCss={(customCssEnabled) => setSettings((s) => ({ ...s, customCssEnabled }))}
              onClearCustomCss={() =>
                setSettings((s) => ({ ...s, customCss: '', customCssName: '', customCssEnabled: true }))
              }
              onOpenThemeEditor={openThemeEditor}
              onExport={exportBackup}
              onImport={importBackup}
              account={supabaseConfigured ? session?.user?.email : null}
              onSignOut={() => supabase.auth.signOut()}
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
