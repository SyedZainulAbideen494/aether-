import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import Card from '../UI/Card'
import Button from '../UI/Button'
import { Layers, Plus } from 'lucide-react'

export default function DeckLibrary({ decks, onCreate, onOpen }: { decks: any[]; onCreate: () => void; onOpen: (id: string) => void }) {
  const stats = useLiveQuery(async () => {
    const allCards = await db.cards.toArray()
    const allReviews = await db.reviews.toArray()
    const due = allReviews.filter((r) => r.nextReview <= Date.now()).length
    return { decks: decks.length, cards: allCards.length, due }
  }, [decks])

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-10 safe-top safe-x space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Flashcards</h1>
          <p className="text-muted text-sm mt-1">AI-powered decks for deep learning.</p>
        </div>
        <Button onClick={onCreate}><Plus size={16} /> New deck</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Decks" value={stats?.decks ?? 0} />
        <StatCard label="Cards" value={stats?.cards ?? 0} />
        <StatCard label="Due today" value={stats?.due ?? 0} />
        <StatCard label="Streak" value={`${computeStreak()}d`} />
      </div>

      {decks.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Layers size={40} className="mx-auto text-faint mb-3" />
            <p className="text-muted">No decks yet. Create your first AI-generated deck.</p>
            <Button className="mt-4" onClick={onCreate}>Create deck</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((d) => (
            <DeckCard key={d.id} deck={d} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  )
}

function DeckCard({ deck, onOpen }: { deck: any; onOpen: (id: string) => void }) {
  const info = useLiveQuery(async () => {
    const cards = await db.cards.where('deckId').equals(deck.id).toArray()
    const reviews = await db.reviews.where('deckId').equals(deck.id).toArray()
    const due = reviews.filter((r) => r.nextReview <= Date.now()).length
    const learned = reviews.filter((r) => r.reviewCount > 0).length
    const pct = cards.length ? Math.round((learned / cards.length) * 100) : 0
    return { count: cards.length, due, pct }
  }, [deck.id])
  return (
    <Card className="cursor-pointer hover:bg-white/5 transition" >
      <div onClick={() => onOpen(deck.id)}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl" style={{ background: deck.color }} />
          <div className="min-w-0">
            <p className="font-semibold truncate">{deck.title}</p>
            <p className="text-xs text-muted truncate">{deck.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted mb-2">
          <span>{info?.count ?? 0} cards</span>
          <span>{info?.due ?? 0} due</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${info?.pct ?? 0}%`, background: deck.color }} />
        </div>
        <p className="text-[10px] text-faint mt-2">{deck.lastStudied ? 'Last studied ' + new Date(deck.lastStudied).toLocaleDateString() : 'Never studied'}</p>
      </div>
    </Card>
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

function computeStreak(): number {
  try { return Number(localStorage.getItem('aether:fc-streak') ?? 0) } catch { return 0 }
}
