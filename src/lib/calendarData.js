import { flattenTasks } from './tree.js'

// 프로젝트 전체에서 날짜(dueDate)가 있는 항목(할 일, 프로젝트 마감일)을 날짜별로 묶는다.
// CalendarView와 할 일 화면의 미니 달력이 같은 로직을 쓴다.
export function getItemsByDate(projects) {
  const map = new Map()
  const add = (key, item) => {
    const list = map.get(key) || []
    list.push(item)
    map.set(key, list)
  }
  for (const project of projects) {
    for (const todo of flattenTasks(project.todos)) {
      if (todo.dueDate) add(todo.dueDate, { kind: 'todo', todo, project })
    }
    if (!project.isTodos && project.dueDate) {
      add(project.dueDate, { kind: 'deadline', project })
    }
  }
  return map
}
