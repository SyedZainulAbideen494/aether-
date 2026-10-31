import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import Card from '../UI/Card'
import Button from '../UI/Button'
import { Edit, Trash2, Copy, Download, Upload, Play } from 'lucide-react'

export default function DeckDetail({ deckId, onBack, onStudy }: { deckId: string; onBack: () => void; onStudy: (mode: 'all' | 'due' | 'missed') => void }) {
  const deck = useLiveQuery(() => db.decks.get(deckId), [deckId])
  const cards = useLiveQuery(() => db.cards.where('deckId').equals(deckId).toArray(), [deckId]) ?? []

  const delDeck = async () => {
    if (!confirm('Delete deck and all cards?')) return
    await db.cards.where('deckId').equals(deckId).delete()
    await db.reviews.where('deckId').equals(deckId).delete()
    await db.sources.where('deckId').equals(deckId).delete()
    await db.decks.delete(deckId)
    onBack()
  }

  const duplicate = async () => {
    if (!deck) return
    const newId = crypto.randomUUID()
    const now = Date.now()
    await db.decks.add({ ...deck, id: newId, title: deck.title + ' (copy)', createdAt: now, updatedAt: now })
    for (const c of cards) {
      const cid = crypto.randomUUID()
      await db.cards.add({ ...c, id: cid, deckId: newId, createdAt: now, updatedAt: now })
      const rev = await db.reviews.get(c.id)
      if (rev) await db.reviews.add({ ...rev, cardId: cid, deckId: newId })
    }
  }

  const exportDeck = () => {
    const payload = { deck, cards }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${deck?.title ?? 'deck'}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const importCards = async (file: File) => {
    const text = await file.text()
    try {
      const data = JSON.parse(text)
      const arr = Array.isArray(data) ? data : data.cards
      const now = Date.now()
      for (const c of arr) {
        const cid = crypto.randomUUID()
        await db.cards.add({ id: cid, deckId, front: c.front, back: c.back, explanation: c.explanation, sourcePage: c.sourcePage, difficulty: c.difficulty, topic: c.topic, createdAt: now, updatedAt: now })
        await db.reviews.add({ cardId: cid, deckId, lastReviewed: null, reviewCount: 0, rating: null, nextReview: now, easeFactor: 2.5, interval: 0 })
      }
    } catch (e) { alert('Import failed') }
  }

  const delCard = async (id: string) => {
    await db.cards.delete(id)
    await db.reviews.delete(id)
  }

  if (!deck) return <div className="p-8 text-muted">Loading…</div>

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pt-6 md:pt-10 safe-top safe-x space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{deck.title}</h1>
          <p className="text-muted text-sm mt-1">{deck.description}</p>
        </div>
        <Button variant="secondary" onClick={onBack}>Back</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => onStudy('all')}><Play size={16} /> Study all</Button>
        <Button variant="secondary" onClick={() => onStudy('due')}>Due cards</Button>
        <Button variant="secondary" onClick={() => onStudy('missed')}>Missed cards</Button>
        <Button variant="secondary" onClick={duplicate}><Copy size={16} /> Duplicate</Button>
        <Button variant="secondary" onClick={exportDeck}><Download size={16} /> Export</Button>
        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-ink hover:bg-white/10 border border-line cursor-pointer">
          <Upload size={16} /> Import
          <input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCards(f) }} />
        </label>
        <Button variant="danger" onClick={delDeck}><Trash2 size={16} /> Delete deck</Button>
      </div>

      <div className="space-y-3">
        {cards.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{c.front}</p>
                <p className="text-sm text-muted mt-1">{c.back}</p>
                {c.explanation && <p className="text-xs text-faint mt-1">{c.explanation}</p>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" onClick={async () => {
                  const front = prompt('Front', c.front); if (front === null) return
                  const back = prompt('Back', c.back); if (back === null) return
                  await db.cards.update(c.id, { front, back, updatedAt: Date.now() })
                }}><Edit size={14} /></Button>
                <Button variant="ghost" onClick={() => delCard(c.id)}><Trash2 size={14} /></Button>
              </div>
            </div>
          </Card>
        ))}
        {cards.length === 0 && <p className="text-muted text-sm">No cards yet.</p>}
      </div>
    </div>
  )
}
