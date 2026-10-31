import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useSpotify } from './hooks/useSpotify'
import { useAppStore } from './store/useAppStore'
import Onboarding from './components/Onboarding'
import Footer from './components/Footer'
import { modelManager } from './services/gemini/modelManager'
import { useAmbientSound } from './hooks/useAmbientSound'
import Home from './pages/Home'
import PomodoroTicker from './components/Pomodoro/PomodoroTicker'
import Focus from './pages/Focus'
import Statistics from './pages/Statistics'
import Settings from './pages/Settings'
import Flashcards from './pages/flashcards/Flashcards'
import Learn from './pages/learn/Learn'
import Help from './pages/Help'
import Landing from './pages/Landing'
import AiSetup from './pages/AiSetup'
import Legal from './pages/Legal'
import PrivacyData from './pages/PrivacyData'
import BottomNav from './components/Navigation/BottomNav'
import UtilityDrawer from './components/UtilityDrawer'
import { PanelRight } from 'lucide-react'
import Sidebar from './components/Navigation/Sidebar'

export default function App() {
  const spotify = useSpotify()
  const navigate = useNavigate()
  const location = useLocation()
  const settings = useAppStore((s) => s.settings)
  useEffect(() => { modelManager.setApiKey(settings.geminiApiKey) }, [settings.geminiApiKey])
  const [sidebarOpen] = useState(false)
  void sidebarOpen
  const [drawerOpen, setDrawerOpen] = useState(false)
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
    <Onboarding />
    <PomodoroTicker />
    <button onClick={() => setDrawerOpen(true)} className="fixed top-4 right-4 z-30 px-3 py-1.5 rounded-xl bg-elevated border border-line text-sm flex items-center gap-1"><PanelRight size={14} /> More</button>
    <UtilityDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    <div className="min-h-full flex">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 min-w-0 pb-20 md:pb-0 md:ml-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings spotify={spotify} />} />
          <Route path="/flashcards/*" element={<Flashcards />} />
          <Route path="/learn/*" element={<Learn />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/help" element={<Help />} />
          <Route path="/help/ai-setup" element={<AiSetup />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/privacy-data" element={<PrivacyData />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
    <Footer />
    </>
  )
}
