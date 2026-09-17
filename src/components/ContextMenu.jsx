import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './ContextMenu.css'

// 우클릭 메뉴. items: [{ label, onClick, danger }]
// 화면 밖으로 넘치지 않게 자리를 잡고, 바깥을 누르거나 Esc를 누르면 닫힌다.
export default function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    function handleMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('blur', onClose)
    window.addEventListener('resize', onClose)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('blur', onClose)
      window.removeEventListener('resize', onClose)
    }
  }, [onClose])

  const width = 150
  const height = items.length * 34 + 10
  const left = Math.min(x, window.innerWidth - width - 8)
  const top = Math.min(y, window.innerHeight - height - 8)

  return createPortal(
    <div className="context-menu" ref={ref} style={{ left, top }} onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={item.danger ? 'is-danger' : ''}
          onClick={() => {
            onClose()
            item.onClick()
          }}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  )
}
