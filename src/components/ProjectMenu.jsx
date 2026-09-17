import { useEffect, useRef, useState } from 'react'
import { Menu, Plus } from 'lucide-react'
import './ColorPicker.css'
import './ProjectMenu.css'

const PRIORITY_OPTIONS = [
  { value: 'high', label: '높음' },
  { value: 'medium', label: '보통' },
  { value: 'low', label: '낮음' }
]

export default function ProjectMenu({ color, onChangeColor, priority, onChangePriority, palette }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const customInputRef = useRef(null)
  const isPreset = palette.some((hex) => hex.toLowerCase() === (color || '').toLowerCase())

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="project-menu" ref={rootRef}>
      <button
        type="button"
        className="project-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        title="프로젝트 설정"
      >
        <Menu size={15} />
      </button>

      {open && (
        <div className="project-menu-popover">
          <div className="project-menu-section">
            <span className="project-menu-label">우선순위</span>
            <div className="project-menu-priority-row">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`project-menu-priority-btn ${priority === opt.value ? 'is-active' : ''}`}
                  onClick={() => onChangePriority(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="project-menu-section">
            <span className="project-menu-label">색상</span>
            <div className="project-menu-color-row">
              {palette.map((hex, i) => (
                <button
                  key={i}
                  type="button"
                  className={`color-swatch ${color?.toLowerCase() === hex.toLowerCase() ? 'is-active' : ''}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => onChangeColor(hex)}
                />
              ))}
              <button
                type="button"
                title="커스텀 색"
                className={`color-swatch color-swatch--custom ${!isPreset ? 'is-active' : ''}`}
                style={!isPreset ? { backgroundColor: color } : undefined}
                onClick={() => customInputRef.current?.click()}
              >
                {isPreset && <Plus size={12} />}
              </button>
              <input
                ref={customInputRef}
                type="color"
                value={color}
                onChange={(e) => onChangeColor(e.target.value)}
                className="color-picker-native"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
