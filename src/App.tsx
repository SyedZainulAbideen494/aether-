import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useSpotify } from './hooks/useSpotify'
import { useAppStore } from './store/useAppStore'
import { useAmbientSound } from './hooks/useAmbientSound'
import Home from './pages/Home'
import PomodoroTicker from './components/Pomodoro/PomodoroTicker'
import Focus from './pages/Focus'
import Statistics from './pages/Statistics'
import Settings from './pages/Settings'
import Flashcards from './pages/flashcards/Flashcards'
import Learn from './pages/learn/Learn'
import BottomNav from './components/Navigation/BottomNav'
import Sidebar from './components/Navigation/Sidebar'

export default function App() {
  const spotify = useSpotify()
  const navigate = useNavigate()
  const location = useLocation()
  const settings = useAppStore((s) => s.settings)
  const [sidebarOpen] = useState(false)
  void sidebarOpen
  useAmbientSound()

  // handle oauth callback
  useEffect(() => {
    if (location.pathname.startsWith('/callback')) {
      const params = new URLSearchParams(location.search)
      const code = params.get('code')
      const state = params.get('state')
      const error = params.get('error')
      if (error) { spotify.setError(error); navigate('/', { replace: true }); return }
      if (code && state) {
        spotify.handleCallback(code, state).then(() => navigate('/', { replace: true }))
      } else {
        navigate('/', { replace: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // apply reduced motion
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', settings.reducedMotion)
  }, [settings.reducedMotion])

  return (
    <>
    <PomodoroTicker />
    <div className="min-h-full flex">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 min-w-0 pb-20 md:pb-0 md:ml-0">
        <Routes>
          <Route path="/" element={<Home spotify={spotify} />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings spotify={spotify} />} />
          <Route path="/flashcards/*" element={<Flashcards />} />
          <Route path="/learn/*" element={<Learn />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
    </>
  )
}
