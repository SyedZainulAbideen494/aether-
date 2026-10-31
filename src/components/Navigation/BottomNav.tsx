import { NavLink } from 'react-router-dom'
import { Home, Target, BarChart3, Settings, Layers, Brain } from 'lucide-react'

const items = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/focus', icon: Target, label: 'Focus' },
  { to: '/statistics', icon: BarChart3, label: 'Stats' },
  { to: '/learn', icon: Brain, label: 'Learn' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/flashcards', icon: Layers, label: 'Cards' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom glass border-t border-line">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition ${isActive ? 'text-accent' : 'text-muted'}`
            }
          >
            <it.icon size={20} />
            <span className="text-[10px] font-medium">{it.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
