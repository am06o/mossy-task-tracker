// 할 일이 하나도 없는(빈) 그룹은 채울 것 자체가 없으므로 평균에서 제외한다.
// 그렇지 않으면 빈 그룹이 0%로 계산되어 다른 할 일을 전부 완료해도 100%에 못 미치는
// 버그가 생긴다.
function isEffectivelyEmpty(node) {
  if (!node.isGroup) return false
  const children = node.todos || []
  if (children.length === 0) return true
  return children.every(isEffectivelyEmpty)
}

function weightedAverage(children) {
  const counted = children.filter((c) => !isEffectivelyEmpty(c))
  if (counted.length === 0) return 0
  const totalWeight = counted.reduce((s, c) => s + (c.weight || 1), 0)
  if (totalWeight === 0) return 0
  const weighted = counted.reduce((s, c) => s + nodeProgress(c) * (c.weight || 1), 0)
  return Math.round(weighted / totalWeight)
}

export function nodeProgress(node) {
  if (node.isGroup) return weightedAverage(node.todos || [])
  return node.progress || 0
}

// childProjectProgresses: 이 프로젝트 바로 아래 하위 프로젝트들의 진행률(0~100) 배열.
// 하위 프로젝트도 가중치 1짜리 항목처럼 평균에 함께 들어간다.
export function projectProgress(project, linkedTodos = [], childProjectProgresses = []) {
  const children = [
    ...(project.todos || []),
    ...linkedTodos,
    ...childProjectProgresses.map((pct) => ({ progress: pct, weight: 1 }))
  ]
  return weightedAverage(children)
}

export function clampProgress(value) {
  return Math.min(100, Math.max(0, Math.round(value)))
}

// 프로젝트 전체 진척도는 보통 할 일들로부터 자동 계산되지만, "할 일은 다 끝냈는데
// 실제로는 아직 안 끝났다"는 걸 표시하려고 사용자가 직접 끌어내릴 수도 있다.
// progressOverride가 있으면 그 값을 그대로 보여주고(할 일 각각의 진행률은 건드리지 않는다),
// 없으면 평소처럼 할 일들의 가중평균을 보여준다.
export function projectDisplayProgress(project, linkedTodos = [], childProjectProgresses = []) {
  if (typeof project.progressOverride === 'number') return project.progressOverride
  return projectProgress(project, linkedTodos, childProjectProgresses)
}
