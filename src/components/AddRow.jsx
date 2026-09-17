import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import './AddRow.css'

// 할 일 목록 맨 아래, 체크박스가 놓인 자리에 이어서 붙는 "추가" 줄.
// onAdd만 주면 바로 추가하고, onAddTask/onAddProject를 함께 주면 눌렀을 때 무엇을 만들지 고르는
// 작은 팝업이 뜬다(프로젝트 화면처럼 할 일과 하위 프로젝트를 둘 다 만들 수 있는 경우).
export default function AddRow({ onAdd, onAddTask, onAddProject, label = '할 일 추가' }) {
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const rootRef = useRef(null)
  const hasChoice = !!(onAddTask && onAddProject)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleClick() {
    if (!hasChoice) {
      onAdd()
      return
    }
    if (!open && rootRef.current) {
      // 아래에 선택지를 펼칠 공간이 있으면 아래로, 화면 끝이라 모자라면 위로 연다.
      const rect = rootRef.current.getBoundingClientRect()
      setOpenUp(window.innerHeight - rect.bottom < 110)
    }
    setOpen((o) => !o)
  }

  return (
    <li className="todo-add-row" ref={rootRef}>
      <button type="button" className="todo-add-row-btn" onClick={handleClick}>
        <span className="todo-add-row-checkbox">
          <Plus size={13} />
        </span>
        <span className="todo-add-row-label">{label}</span>
      </button>

      {hasChoice && open && (
        <div className={`todo-add-row-popover ${openUp ? 'is-up' : ''}`}>
          <button
            type="button"
            onClick={() => {
              onAddTask()
              setOpen(false)
            }}
          >
            할 일 추가
          </button>
          <button
            type="button"
            onClick={() => {
              onAddProject()
              setOpen(false)
            }}
          >
            프로젝트 추가
          </button>
        </div>
      )}
    </li>
  )
}
