import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useAppStore } from '../../store/useAppStore'
import { detectStruggle } from '../../utils/struggle'
import { generateRemedialCards } from '../../services/gemini/remedial'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'

export default function AdaptiveView() {
  const apiKey = useAppStore((s) => s.settings.geminiApiKey)
  const geminiModel = useAppStore((s) => s.settings.geminiModel)
  const concepts = useLiveQuery(() => db.concepts.toArray(), []) ?? []
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const remediate = async (c: any) => {
    if (!apiKey) { setMsg('Set Gemini API key.'); return }
    setLoading(true); setMsg(null)
    try {
      const prereqs = await db.concepts.where('conceptId').anyOf(c.prerequisites || []).toArray()
      const gap = detectStruggle(c, prereqs)
      if (!gap) { setMsg('No strong evidence of struggle yet.'); setLoading(false); return }
      const cards = await generateRemedialCards(apiKey, c.conceptName, gap.prerequisiteGaps, gap.recommendedCardCount, geminiModel)
      const did = crypto.randomUUID()
      const now = Date.now()
      await db.decks.add({ id: did, title: `Remedial: ${c.conceptName}`, description: 'AI remedial practice', color: '#ff6b6b', createdAt: now, updatedAt: now, lastStudied: null, isTemporary: true, sourceConceptId: c.conceptId, generationReason: gap.recommendedNextAction })
      for (const cc of cards) {
        const cid = crypto.randomUUID()
        await db.cards.add({ id: cid, deckId: did, front: cc.front, back: cc.back, explanation: cc.explanation, sourcePage: cc.sourcePage, difficulty: cc.difficulty, topic: cc.topic, conceptIds: [c.conceptId], createdAt: now, updatedAt: now })
        await db.reviews.add({ cardId: cid, deckId: did, lastReviewed: null, reviewCount: 0, rating: null, nextReview: now, easeFactor: 2.5, interval: 0 })
      }
      setMsg(`Created remedial deck for ${c.conceptName}`)
    } catch (e: any) { setMsg(e?.message ?? 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-medium mb-3">Concept mastery</h3>
        {concepts.length === 0 && <p className="text-xs text-faint">No concepts tracked yet. Take quizzes to build data.</p>}
        {concepts.map((c: any) => (
          <div key={c.conceptId} className="flex items-center justify-between py-2 border-b border-line">
            <div>
              <p className="text-sm">{c.conceptName}</p>
              <p className="text-xs text-muted">{c.learningStatus} · {c.totalAttempts} attempts</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">{c.masteryScore}%</span>
              <Button variant="secondary" onClick={() => remediate(c)} disabled={loading}>Remediate</Button>
            </div>
          </div>
        ))}
      </Card>
      {msg && <p className="text-xs text-muted">{msg}</p>}
    </div>
  )
}
