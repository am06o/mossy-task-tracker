import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import './LinkMenu.css'

export default function LinkMenu({ value, onChange, projects }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const linked = projects.find((p) => p.id === value)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="link-menu" ref={rootRef}>
      <button
        type="button"
        className="link-menu-trigger"
        title={linked ? `연결됨: ${linked.name}` : '프로젝트에 연결'}
        onClick={() => setOpen((o) => !o)}
      >
        {linked && <span className="link-menu-dot" style={{ backgroundColor: linked.color }} />}
        <ChevronDown size={13} />
      </button>

      {open && (
        <div className="link-menu-popover">
          <button
            type="button"
            className={!value ? 'is-active' : ''}
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
          >
            연결 안 함
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              className={value === p.id ? 'is-active' : ''}
              onClick={() => {
                onChange(p.id)
                setOpen(false)
              }}
            >
              <span className="link-menu-dot" style={{ backgroundColor: p.color }} />
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
