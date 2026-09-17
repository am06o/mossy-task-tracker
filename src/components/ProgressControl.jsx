import { clampProgress } from '../lib/progress.js'
import { progressGradient } from '../lib/theme.js'
import './ProgressControl.css'

export default function ProgressControl({ value, onChange, onAdjust, size = 'md', color = 'var(--accent)' }) {
  function handleWheel(e) {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 1 : -1
    if (onAdjust) {
      onAdjust(delta)
    } else {
      onChange(clampProgress(value + delta))
    }
  }

  function handleKeyDown(e) {
    // 좌우 화살표는 브라우저 기본 동작(1%씩)을 그대로 쓰고,
    // 위아래 화살표만 5%씩 크게 움직이도록 가로챈다.
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const delta = e.key === 'ArrowUp' ? 5 : -5
    if (onAdjust) {
      onAdjust(delta)
    } else {
      onChange(clampProgress(value + delta))
    }
  }

  return (
    <div className={`progress-control progress-control--${size}`}>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(clampProgress(Number(e.target.value)))}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        className="progress-slider"
        style={{ '--pct': `${value}%`, '--color': color, '--fill': progressGradient(color) }}
        aria-label="진행률"
      />
      <span className="progress-pct">{value}%</span>
    </div>
  )
}
