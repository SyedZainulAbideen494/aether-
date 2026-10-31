import { useAppStore } from '../store/useAppStore'
import { usePomodoro } from '../hooks/usePomodoro'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import { Link } from 'react-router-dom'
import { Target, Layers, BarChart3, Play } from 'lucide-react'

export default function Home() {
  const sessions = useAppStore((s) => s.sessions)
  const pom = usePomodoro()
  const todayFocus = sessions.filter((s) => s.type === 'focus' && s.completed && new Date(s.startedAt).toDateString() === new Date().toDateString())
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-10 safe-top safe-x space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">AETHER</h1>
        <p className="text-muted mt-1">Learn Anything. Understand Everything.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-medium mb-2">Continue Learning</h3>
          <p className="text-sm text-muted mb-3">Pick up where you left off.</p>
          <Link to="/learn"><Button><Play size={16} /> Start Learning</Button></Link>
        </Card>
        <Card>
          <h3 className="font-medium mb-2">Create Study Material</h3>
          <p className="text-sm text-muted mb-3">Generate flashcards, quizzes and explanations.</p>
          <Link to="/flashcards"><Button variant="secondary">Create Deck</Button></Link>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Today's focus" value={`${todayFocus.reduce((a, s) => a + s.duration, 0) / 60000 | 0}m`} />
        <Stat label="Sessions" value={todayFocus.length} />
        <Stat label="Timer" value={pom.running ? 'Running' : 'Idle'} />
        <Stat label="Mode" value={pom.type} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/learn"><Card className="hover:bg-white/5 cursor-pointer"><Target size={20} className="mb-2 text-accent" /><p className="font-medium">Learn</p><p className="text-xs text-muted">Topics, PDFs, images</p></Card></Link>
        <Link to="/flashcards"><Card className="hover:bg-white/5 cursor-pointer"><Layers size={20} className="mb-2 text-accent" /><p className="font-medium">Flashcards</p><p className="text-xs text-muted">Decks and review</p></Card></Link>
        <Link to="/statistics"><Card className="hover:bg-white/5 cursor-pointer"><BarChart3 size={20} className="mb-2 text-accent" /><p className="font-medium">Insights</p><p className="text-xs text-muted">Progress and mastery</p></Card></Link>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <Card>
      <p className="text-[10px] text-muted uppercase tracking-wider">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </Card>
  )
}
