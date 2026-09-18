// 프로젝트 화면 맨 위층은 (하위 프로젝트 + 이 프로젝트 자신의 할 일/그룹)을 섞어서 보여준다.
// 하위 프로젝트마다 "어느 할 일 앞에 놓일지"를 insertBeforeId로 들고 있고, 값이 없으면
// 맨 앞(START), '__end__'면 맨 뒤(END)에 놓인다. 할 일들의 순서 자체는 그대로 project.todos
// 배열 순서를 따르므로, 하위 프로젝트만 재배치해도 기존 할 일 순서/이어쓰기 동작은 그대로다.
export const START = null
export const END = '__end__'

export function buildTopEntries(topTodos, childProjects) {
  const buckets = new Map()
  const validIds = new Set(topTodos.map((t) => t.id))

  function bucketFor(key) {
    if (!buckets.has(key)) buckets.set(key, [])
    return buckets.get(key)
  }

  for (const child of childProjects) {
    const key = child.insertBeforeId === END || validIds.has(child.insertBeforeId) ? child.insertBeforeId : START
    bucketFor(key).push(child)
  }

  const entries = []
  for (const child of buckets.get(START) || []) entries.push({ type: 'child', child })
  topTodos.forEach((node, index) => {
    for (const child of buckets.get(node.id) || []) entries.push({ type: 'child', child })
    entries.push({ type: 'todo', node, index })
  })
  for (const child of buckets.get(END) || []) entries.push({ type: 'child', child })
  return entries
}

// 할 일 T를 기준으로 "T 위" 또는 "T 아래"에 두고 싶을 때 하위 프로젝트가 가질 새 anchor.
// T 자체의 위치는 건드리지 않는다 — T의 이웃(다음 할 일)을 가리키거나, T를 직접 가리킬 뿐이다.
export function anchorAboveTodo(topTodos, todoId) {
  const index = topTodos.findIndex((t) => t.id === todoId)
  if (index === -1) return null
  const next = topTodos[index + 1]
  return next ? next.id : END
}

export function anchorBelowTodo(topTodos, todoId) {
  const index = topTodos.findIndex((t) => t.id === todoId)
  if (index === -1) return null
  return todoId
}
