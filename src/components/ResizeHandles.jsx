import { windowControls } from '../lib/platform.js'
import './ResizeHandles.css'

// decorations: false로 창을 띄우면(직접 그린 타이틀바) OS가 제공하던 크기 조절 테두리도
// 함께 사라진다. 가장자리에 얇은 투명 영역을 깔아 각 방향으로 startResizeDragging을 걸어준다.
const HANDLES = [
  ['n', 'North'],
  ['s', 'South'],
  ['e', 'East'],
  ['w', 'West'],
  ['ne', 'NorthEast'],
  ['nw', 'NorthWest'],
  ['se', 'SouthEast'],
  ['sw', 'SouthWest']
]

export default function ResizeHandles() {
  return (
    <>
      {HANDLES.map(([key, direction]) => (
        <div
          key={key}
          className={`resize-handle resize-handle-${key}`}
          onMouseDown={(e) => {
            if (e.buttons !== 1) return
            windowControls.startResizeDragging(direction)
          }}
        />
      ))}
    </>
  )
}
