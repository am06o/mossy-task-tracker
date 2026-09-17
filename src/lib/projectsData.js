import { uid } from './id.js'
import { TODOS_COLOR, DEFAULT_PROJECT_COLOR } from './theme.js'

const IDEAS_ID = 'ideas' // 예전 "아이디어" 보관함 — 지금은 할 일 목록으로 흡수한다
export const TODOS_ID = 'todos'
export const PRIORITIES = ['high', 'medium', 'low']
export const DEFAULT_PRIORITY = 'medium'

export function makeTodosProject() {
  return { id: TODOS_ID, name: '할 일', isTodos: true, color: TODOS_COLOR, todos: [] }
}

export function makeProject(name) {
  return {
    id: uid(),
    name,
    note: '',
    color: DEFAULT_PROJECT_COLOR,
    priority: DEFAULT_PRIORITY,
    startDate: null,
    dueDate: null,
    parentProjectId: null,
    progressOverride: null,
    archived: null,
    expanded: false,
    todos: []
  }
}

// 지난 프로젝트인지:
//  - archived === true  : 사용자가 직접 "마감"한 프로젝트
//  - archived === false : 마감일이 지났어도 사용자가 "복구"해서 계속 쓰는 프로젝트
//  - archived === null  : 기본값 — 마감일이 오늘보다 이전이면 자동으로 지난 프로젝트
export function isProjectPast(project, today) {
  if (project.archived === true) return true
  if (project.archived === false) return false
  return !!project.dueDate && project.dueDate < today
}

// 사이드바의 "프로젝트"와 "지난 프로젝트" 목록으로 나눈다.
// 하위 프로젝트는 상위가 살아있으면 (자기 마감일이 지났더라도) 함께 살아있고,
// 직접 마감한 경우에만 지난 목록으로 간다. 상위가 지난 프로젝트면 하위도 따라간다.
export function partitionProjects(realProjects, today) {
  const byId = new Map(realProjects.map((p) => [p.id, p]))
  const active = []
  const past = []
  for (const p of realProjects) {
    const parent = p.parentProjectId ? byId.get(p.parentProjectId) : null
    let isPast
    if (!parent) isPast = isProjectPast(p, today)
    else if (isProjectPast(parent, today)) isPast = true
    else isPast = p.archived === true
    ;(isPast ? past : active).push(p)
  }
  return { active, past }
}

// 프로젝트를 폴더처럼 다른 프로젝트 아래로 중첩할 수 있되, 너무 깊어지지 않도록 2단계까지만 허용한다.
export function canNestProject(projects, draggedId, targetId) {
  if (draggedId === targetId) return false
  const dragged = projects.find((p) => p.id === draggedId)
  const target = projects.find((p) => p.id === targetId)
  if (!dragged || !target) return false
  if (target.parentProjectId) return false // 대상이 이미 하위 폴더면 더 깊어지므로 금지
  const draggedHasChildren = projects.some((p) => p.parentProjectId === draggedId)
  if (draggedHasChildren) return false // 하위를 가진 프로젝트는 다시 중첩시키지 않음
  return true
}

export function makeTodo(title, dueDate = null) {
  return { id: uid(), title, progress: 0, weight: 1, dueDate, linkedProjectId: null }
}

export function makeGroup(title) {
  return { id: uid(), title, isGroup: true, weight: 1, collapsed: false, todos: [] }
}

function normalizeTaskNode(t, wasDaily) {
  return {
    id: t.id,
    title: t.title,
    progress: wasDaily ? (t.dailyCompletedOn ? 100 : 0) : typeof t.progress === 'number' ? t.progress : 0,
    weight: typeof t.weight === 'number' && t.weight > 0 ? t.weight : 1,
    dueDate: t.dueDate || null,
    linkedProjectId: t.linkedProjectId || null
  }
}

// 프로젝트 내부는 (할 일 | 하위 그룹)을 섞어 담을 수 있는 재귀 트리라 그룹은 재귀적으로 정규화한다.
function normalizeTreeNode(t) {
  if (t && t.isGroup) {
    return {
      id: t.id,
      title: t.title,
      isGroup: true,
      weight: typeof t.weight === 'number' && t.weight > 0 ? t.weight : 1,
      collapsed: !!t.collapsed,
      todos: Array.isArray(t.todos) ? t.todos.map(normalizeTreeNode) : []
    }
  }
  return normalizeTaskNode(t, false)
}

// 예전 버전 데이터(아이디어/데일리 함, 색상, 일정, 트리 구조 필드가 없던 시절)를 열어도 깨지지 않도록 보정한다.
export function normalizeProjects(rawProjects) {
  const list = Array.isArray(rawProjects) ? rawProjects : []
  const normalized = list.map((p) => {
    const wasDaily = !!p.isDaily // 이전 버전의 "데일리 투두"(매일 초기화) 개념은 폐기하고 일반 할 일로 흡수한다
    const isBucket = !!p.isTodos || wasDaily || !!p.isIdeas || p.id === IDEAS_ID
    const isReal = !isBucket
    return {
      id: isBucket ? TODOS_ID : p.id,
      name: p.name,
      note: p.note || '',
      isTodos: isBucket,
      color: p.color || (isBucket ? TODOS_COLOR : DEFAULT_PROJECT_COLOR),
      priority: PRIORITIES.includes(p.priority) ? p.priority : DEFAULT_PRIORITY,
      startDate: p.startDate || null,
      dueDate: isBucket ? null : p.dueDate || null,
      parentProjectId: isReal ? p.parentProjectId || null : null,
      progressOverride: isReal && typeof p.progressOverride === 'number' ? p.progressOverride : null,
      archived: isReal && typeof p.archived === 'boolean' ? p.archived : null,
      expanded: isReal && !!p.expanded,
      todos: Array.isArray(p.todos)
        ? isReal
          ? p.todos.map(normalizeTreeNode)
          : p.todos.map((t) => normalizeTaskNode(t, wasDaily))
        : []
    }
  })

  // 예전 "아이디어" 함에 있던 것들은 날짜 없는 할 일(= 보관함)로 흡수한다.
  const buckets = normalized.filter((p) => p.id === TODOS_ID)
  const todosBucket =
    buckets.length > 0
      ? { ...makeTodosProject(), todos: buckets.flatMap((p) => p.todos) }
      : makeTodosProject()

  const realIds = new Set(normalized.filter((p) => p.id !== TODOS_ID).map((p) => p.id))
  // 부모가 삭제되어 사라진 프로젝트는 최상위로 끌어올린다.
  const real = normalized
    .filter((p) => p.id !== TODOS_ID)
    .map((p) => (p.parentProjectId && !realIds.has(p.parentProjectId) ? { ...p, parentProjectId: null } : p))
  return [todosBucket, ...real]
}

export function isRealProject(project) {
  return !project.isTodos
}
