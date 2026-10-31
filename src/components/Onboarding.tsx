import { useState } from 'react'
import Button from './UI/Button'
import Card from './UI/Card'

const VERSION = '1'

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(() => localStorage.getItem('aether:onboarding-version') === VERSION)
  if (done) return null

  const finish = () => {
    localStorage.setItem('aether:onboarding-version', VERSION)
    setDone(true)
  }

  const screens = [
    {
      title: 'Welcome to AETHER',
      body: 'Your personal aviation learning laboratory.',
      detail: 'Explore aviation concepts through interactive visual lessons, aircraft simulations, AI-assisted explanations, flashcards and quizzes.',
    },
    {
      title: 'Discover the learning tools',
      body: 'Interactive simulations, V-speeds, runway distances, climb profiles, AI explanations, flashcards, quizzes and adaptive revision.',
      detail: 'AETHER is free to explore. No account is required.',
    },
    {
      title: 'Privacy and local storage',
      body: 'Your learning progress is stored locally on this device by default.',
      detail: 'Optional AI integrations may require your own compatible API key or supported service. Uploaded content may be sent to a third-party AI provider when used.',
    },
    {
      title: 'Optional AI configuration',
      body: 'AI features are optional. You can skip setup and use all core learning features.',
      detail: 'Configure AI later in Settings → AI.',
    },
  ]

  const s = screens[step]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Card className="max-w-md w-full">
        <h2 className="text-2xl font-semibold mb-2">{s.title}</h2>
        <p className="text-muted mb-2">{s.body}</p>
        <p className="text-xs text-faint mb-6">{s.detail}</p>
        <div className="flex justify-between">
          <Button variant="ghost" onClick={finish}>Skip</Button>
          <div className="flex gap-2">
            {step > 0 && <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>}
            {step < screens.length - 1 ? (
              <Button onClick={() => setStep(step + 1)}>Next</Button>
            ) : (
              <Button onClick={finish}>Start Learning</Button>
            )}
          </div>
        </div>
        <div className="flex justify-center gap-1 mt-4">
          {screens.map((_, i) => <span key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-accent' : 'bg-white/20'}`} />)}
        </div>
      </Card>
    </div>
  )
}
