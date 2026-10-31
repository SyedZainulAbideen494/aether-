import { NavLink } from 'react-router-dom'
import { Home, Target, BarChart3, Settings, Layers, Brain, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const items = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/focus', icon: Target, label: 'Focus' },
  { to: '/statistics', icon: BarChart3, label: 'Stats' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/flashcards', icon: Layers, label: 'Flashcards' },
  { to: '/learn', icon: Brain, label: 'Learn' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <aside className={`h-screen sticky top-0 border-r border-line glass flex flex-col transition-all ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="flex items-center justify-between p-4">
        {!collapsed && <span className="text-lg font-semibold tracking-tight">AETHER</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="text-muted hover:text-ink p-1 rounded-lg">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      <nav className="flex-1 px-2 space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:text-ink hover:bg-white/5'}`
            }
          >
            <it.icon size={18} />
            {!collapsed && <span className="text-sm font-medium">{it.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 text-xs text-faint">v1.0</div>
    </aside>
  )
}
