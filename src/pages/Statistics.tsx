import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/UI/Card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function Statistics() {
  const sessions = useAppStore((s) => s.sessions)

  const focusSessions = sessions.filter((s) => s.type === 'focus' && s.completed)

  const daily = useMemo(() => {
    const map: Record<string, number> = {}
    focusSessions.forEach((s) => {
      const key = new Date(s.startedAt).toLocaleDateString()
      map[key] = (map[key] ?? 0) + s.duration / 60000
    })
    return Object.entries(map).slice(-14).map(([day, mins]) => ({ day: day.slice(0, 6), mins: Math.round(mins) }))
  }, [focusSessions])

  const weekly = useMemo(() => {
    const now = new Date()
    const weeks: number[] = [0, 0, 0, 0]
    focusSessions.forEach((s) => {
      const diff = (now.getTime() - s.startedAt) / (7 * 86400000)
      const idx = Math.floor(diff)
      if (idx >= 0 && idx < 4) weeks[3 - idx] += s.duration / 60000
    })
    return weeks.map((m, i) => ({ week: `W${i + 1}`, mins: Math.round(m) }))
  }, [focusSessions])

  const totalMins = focusSessions.reduce((a, s) => a + s.duration, 0) / 60000
  const totalSessions = focusSessions.length
  const avg = totalSessions ? Math.round(totalMins / totalSessions) : 0
  const streak = computeStreak(focusSessions)

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-10 safe-top safe-x space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Statistics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total focus" value={`${Math.round(totalMins)}m`} />
        <StatCard label="Sessions" value={totalSessions} />
        <StatCard label="Avg session" value={`${avg}m`} />
        <StatCard label="Streak" value={`${streak}d`} />
      </div>

      <Card>
        <h3 className="text-sm font-medium mb-4">Daily focus (last 14 days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily}>
              <XAxis dataKey="day" stroke="#5a637a" fontSize={10} />
              <YAxis stroke="#5a637a" fontSize={10} />
              <Tooltip contentStyle={{ background: '#111626', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }} />
              <Bar dataKey="mins" fill="#7c5cff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-4">Weekly trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekly}>
              <XAxis dataKey="week" stroke="#5a637a" fontSize={10} />
              <YAxis stroke="#5a637a" fontSize={10} />
              <Tooltip contentStyle={{ background: '#111626', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }} />
              <Line type="monotone" dataKey="mins" stroke="#4aa8ff" strokeWidth={2} dot={{ fill: '#4aa8ff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <Card>
      <p className="text-[10px] text-muted uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-semibold mt-2">{value}</p>
    </Card>
  )
}

function computeStreak(sessions: any[]): number {
  const days = new Set(sessions.map((s) => new Date(s.startedAt).toDateString()))
  let streak = 0
  const d = new Date()
  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1) }
  return streak
}
