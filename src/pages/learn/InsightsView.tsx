import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import Card from '../../components/UI/Card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function InsightsView() {
  const concepts = useLiveQuery(() => db.concepts.toArray(), []) ?? []
  const attempts = useLiveQuery(() => db.quizAttempts.toArray(), []) ?? []
  const data = concepts.map((c: any) => ({ name: c.conceptName.slice(0, 12), mastery: c.masteryScore ?? 0 }))
  const avgScore = attempts.length ? Math.round(attempts.reduce((a: number, b: any) => a + (b.score / b.total) * 100, 0) / attempts.length) : 0
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card><p className="text-[10px] text-muted uppercase">Concepts</p><p className="text-2xl font-semibold mt-2">{concepts.length}</p></Card>
        <Card><p className="text-[10px] text-muted uppercase">Avg quiz score</p><p className="text-2xl font-semibold mt-2">{avgScore}%</p></Card>
      </div>
      <Card>
        <h3 className="text-sm font-medium mb-4">Mastery by concept</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#5a637a" fontSize={10} />
              <YAxis stroke="#5a637a" fontSize={10} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#111626', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }} />
              <Bar dataKey="mastery" fill="#7c5cff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
