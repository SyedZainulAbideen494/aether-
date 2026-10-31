import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import Card from '../../components/UI/Card'

export default function Overview() {
  const concepts = useLiveQuery(() => db.concepts.toArray(), []) ?? []
  const weak = concepts.filter((c: any) => (c.masteryScore ?? 0) < 60).slice(0, 5)
  const due = concepts.filter((c: any) => (c.nextReviewDate ?? 0) <= Date.now()).slice(0, 5)
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-medium mb-3">Today's focus</h3>
        <p className="text-muted text-sm">Review weak concepts, practice due cards, and take a quiz.</p>
      </Card>
      <Card>
        <h3 className="text-sm font-medium mb-3">Weak concepts</h3>
        {weak.length === 0 && <p className="text-xs text-faint">None yet.</p>}
        {weak.map((c: any) => (
          <div key={c.conceptId} className="flex justify-between text-sm py-1 border-b border-line">
            <span>{c.conceptName}</span>
            <span className="text-muted">{c.masteryScore}%</span>
          </div>
        ))}
      </Card>
      <Card>
        <h3 className="text-sm font-medium mb-3">Due for review</h3>
        {due.length === 0 && <p className="text-xs text-faint">Nothing due.</p>}
        {due.map((c: any) => (
          <div key={c.conceptId} className="text-sm py-1 border-b border-line">{c.conceptName}</div>
        ))}
      </Card>
    </div>
  )
}
