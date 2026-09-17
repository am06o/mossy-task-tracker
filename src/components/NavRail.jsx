import { Calendar, CircleCheck, Folder, Settings, Sparkles } from 'lucide-react'
import './NavRail.css'

const ITEMS = [
  { id: 'todos', label: '할 일', icon: CircleCheck },
  { id: 'calendar', label: '캘린더', icon: Calendar },
  { id: 'projects', label: '프로젝트', icon: Folder },
  { id: 'archive', label: '보관함', icon: Sparkles }
]

export default function NavRail({ activeView, onChangeView }) {
  return (
    <nav className="nav-rail">
      <div className="nav-rail-items">
        {ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-rail-item ${activeView === id ? 'is-active' : ''}`}
            title={label}
            onClick={() => onChangeView(id)}
          >
            <Icon size={20} strokeWidth={activeView === id ? 2.4 : 2} />
          </button>
        ))}
      </div>

      <button
        className={`nav-rail-item ${activeView === 'settings' ? 'is-active' : ''}`}
        title="설정"
        onClick={() => onChangeView('settings')}
      >
        <Settings size={19} strokeWidth={activeView === 'settings' ? 2.4 : 2} />
      </button>
    </nav>
  )
}
