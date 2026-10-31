import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import Card from '../../components/UI/Card'

export default function PlannerView() {
  const concepts = useLiveQuery(() => db.concepts.toArray(), []) ?? []
  const weak = concepts.filter((c: any) => (c.masteryScore ?? 0) < 60)
  const due = concepts.filter((c: any) => (c.nextReviewDate ?? 0) <= Date.now())
  const items = [
    ...due.slice(0, 3).map((c: any) => ({ type: 'review', title: `Revise ${c.conceptName}` })),
    ...weak.slice(0, 3).map((c: any) => ({ type: 'practice', title: `Practice ${c.conceptName}` })),
    { type: 'quiz', title: 'Complete a 10-question quiz' },
  ]
  return (
    <Card>
      <h3 className="text-sm font-medium mb-3">Today's learning plan</h3>
      {items.length === 0 && <p className="text-xs text-faint">Nothing planned yet.</p>}
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-accent/15 text-accent text-xs flex items-center justify-center">{i + 1}</span>
            {it.title}
          </li>
        ))}
      </ul>
    </Card>
  )
}
