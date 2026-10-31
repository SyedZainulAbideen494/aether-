import { usePomodoro } from '../hooks/usePomodoro'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import Toggle from '../components/UI/Toggle'

export default function Focus() {
  const pom = usePomodoro()
  void pom
  const timer = useAppStore((s) => s.timer)
  const setTimer = useAppStore((s) => s.setTimer)
  const sessions = useAppStore((s) => s.sessions)

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pt-6 md:pt-10 safe-top safe-x space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Focus</h1>
      <p className="text-muted text-sm">Customize your Pomodoro rhythm.</p>

      <Card>
        <h3 className="text-sm font-medium mb-4">Durations (minutes)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Focus" type="number" value={timer.focus} onChange={(v: string) => setTimer({ focus: Math.max(1, Number(v)) })} />
          <Input label="Short break" type="number" value={timer.shortBreak} onChange={(v: string) => setTimer({ shortBreak: Math.max(1, Number(v)) })} />
          <Input label="Long break" type="number" value={timer.longBreak} onChange={(v: string) => setTimer({ longBreak: Math.max(1, Number(v)) })} />
        </div>
        <div className="mt-4">
          <Input label="Long break every (sessions)" type="number" value={timer.longBreakEvery} onChange={(v: string) => setTimer({ longBreakEvery: Math.max(1, Number(v)) })} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-4">Automation</h3>
        <div className="space-y-3">
          <Toggle label="Auto-start breaks" value={timer.autoStartBreaks} onChange={(v) => setTimer({ autoStartBreaks: v })} />
          <Toggle label="Auto-start focus" value={timer.autoStartFocus} onChange={(v) => setTimer({ autoStartFocus: v })} />
          <Toggle label="Sound on complete" value={timer.soundEnabled} onChange={(v) => setTimer({ soundEnabled: v })} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-4">Session history</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
          {sessions.length === 0 && <p className="text-sm text-faint">No sessions yet.</p>}
          {sessions.slice(0, 50).map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm py-2 border-b border-line">
              <span className="capitalize">{s.type.replace(/([A-Z])/g, ' $1')}</span>
              <span className="text-muted">{Math.round(s.duration / 60000)}m</span>
              <span className="text-faint text-xs">{new Date(s.startedAt).toLocaleString()}</span>
              <span className={s.completed ? 'text-green-300 text-xs' : 'text-amber-300 text-xs'}>{s.completed ? 'done' : 'skipped'}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="danger" onClick={() => useAppStore.getState().clearSessions()}>Clear history</Button>
        </div>
      </Card>
    </div>
  )
}
