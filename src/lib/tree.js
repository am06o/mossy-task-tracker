// 프로젝트 내부는 (할 일 | 하위 그룹)을 자유롭게 섞어 담을 수 있는 재귀 트리다.
// 그룹 노드: { isGroup: true, todos: [...] }, 할 일 노드: { progress, dueDate, ... }

export function mapNode(nodes, id, fn) {
  return nodes.map((n) => {
    if (n.id === id) return fn(n)
    if (n.isGroup) return { ...n, todos: mapNode(n.todos, id, fn) }
    return n
  })
}

export function removeNode(nodes, id) {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => (n.isGroup ? { ...n, todos: removeNode(n.todos, id) } : n))
}

export function addChild(nodes, parentId, child) {
  if (parentId === null) return [...nodes, child]
  return nodes.map((n) => {
    if (n.id === parentId && n.isGroup) return { ...n, todos: [...n.todos, child] }
    if (n.isGroup) return { ...n, todos: addChild(n.todos, parentId, child) }
    return n
  })
}

export function findNode(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.isGroup) {
      const found = findNode(n.todos, id)
      if (found) return found
    }
  }
  return null
}

// 할 일 이름을 적고 엔터를 쳤을 때, 방금 그 항목 바로 아래에 새 항목을 이어서 만든다.
export function addSiblingAfter(nodes, targetId, child) {
  const index = nodes.findIndex((n) => n.id === targetId)
  if (index !== -1) {
    const next = [...nodes]
    next.splice(index + 1, 0, child)
    return next
  }
  return nodes.map((n) => (n.isGroup ? { ...n, todos: addSiblingAfter(n.todos, targetId, child) } : n))
}

// 어디에 있던 노드든 꺼내서(nodeId) targetParentId의 targetIndex 위치에 다시 꽂는다.
// 같은 부모 안에서 순서만 바꿀 때도, 다른 그룹으로 옮길 때도 이 함수 하나로 처리한다.
export function moveNode(rootNodes, nodeId, targetParentId, targetIndex) {
  let moved = null

  function extract(nodes) {
    const out = []
    for (const n of nodes) {
      if (n.id === nodeId) {
        moved = n
        continue
      }
      out.push(n.isGroup ? { ...n, todos: extract(n.todos) } : n)
    }
    return out
  }

  const withoutNode = extract(rootNodes)
  if (!moved) return rootNodes

  function insert(nodes, parentId) {
    if (parentId === null) {
      const next = [...nodes]
      next.splice(Math.min(targetIndex, next.length), 0, moved)
      return next
    }
    return nodes.map((n) => {
      if (n.id === parentId && n.isGroup) {
        const next = [...n.todos]
        next.splice(Math.min(targetIndex, next.length), 0, moved)
        return { ...n, todos: next }
      }
      if (n.isGroup) return { ...n, todos: insert(n.todos, parentId) }
      return n
    })
  }

  return insert(withoutNode, targetParentId)
}

export function flattenTasks(nodes) {
  const out = []
  for (const n of nodes) {
    if (n.isGroup) out.push(...flattenTasks(n.todos))
    else out.push(n)
  }
  return out
}
