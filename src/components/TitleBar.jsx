import { Minus, Square, X } from 'lucide-react'
import { windowControls } from '../lib/platform.js'

export default function TitleBar() {
  return (
    <div className="titlebar" data-tauri-drag-region>
      <span className="titlebar-title" data-tauri-drag-region>
        mossy
      </span>
      <div className="titlebar-controls">
        <button type="button" className="titlebar-btn" onClick={() => windowControls.minimize()} aria-label="최소화">
          <Minus size={14} />
        </button>
        <button
          type="button"
          className="titlebar-btn"
          onClick={() => windowControls.toggleMaximize()}
          aria-label="최대화"
        >
          <Square size={11} />
        </button>
        <button
          type="button"
          className="titlebar-btn titlebar-btn-close"
          onClick={() => windowControls.close()}
          aria-label="닫기"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
