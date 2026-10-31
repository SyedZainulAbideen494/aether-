import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useAppStore } from '../../store/useAppStore'
import { explain, type ExplainMode } from '../../services/gemini/explain'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import Input from '../../components/UI/Input'

const MODES: ExplainMode[] = ['beginner', 'analogy', 'stepbystep', 'practical', 'exam', 'formula', 'compare']

export default function ExplainView() {
  const apiKey = useAppStore((s) => s.settings.geminiApiKey)
  const geminiModel = useAppStore((s) => s.settings.geminiModel)
  const decks = useLiveQuery(() => db.decks.toArray(), []) ?? []
  const [selectedDeck, setSelectedDeck] = useState('')
  const cards = useLiveQuery(() => selectedDeck ? db.cards.where('deckId').equals(selectedDeck).toArray() : [], [selectedDeck]) ?? []
  const [selectedCard, setSelectedCard] = useState('')
  const [importMode, setImportMode] = useState<'manual' | 'deck' | 'card'>('manual')

  const [concept, setConcept] = useState('')
  const [mode, setMode] = useState<ExplainMode>('beginner')
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [prev, setPrev] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [followup, setFollowup] = useState('')
  const [history, setHistory] = useState<{ q: string; a: string }[]>([])

  const resolveSource = () => {
    if (importMode === 'card') {
      const c = cards.find((x: any) => x.id === selectedCard)
      if (c) return `Front: ${c.front}\nBack: ${c.back}\nExplanation: ${c.explanation ?? ''}`
    }
    if (importMode === 'deck') {
      return cards.map((c: any) => `Q: ${c.front}\nA: ${c.back}`).join('\n\n')
    }
    return source
  }

  const run = async (fu?: string) => {
    if (!apiKey) { setError('Set Gemini API key in Settings.'); return }
    if (!concept.trim() && importMode !== 'card') { setError('Enter a concept.'); return }
    const src = resolveSource()
    const conceptName = concept.trim() || (importMode === 'card' ? (cards.find((x: any) => x.id === selectedCard)?.front ?? '') : '')
    if (!conceptName) { setError('Enter a concept or select a card.'); return }
    setLoading(true); setError(null)
    try {
      const r = await explain(apiKey, { concept: conceptName, mode, source: src || undefined, previousExplanation: prev || undefined, followup: fu, model: geminiModel })
      setResult(r)
      setPrev(r)
      if (fu) setHistory((h) => [...h, { q: fu, a: r }])
    } catch (e: any) { setError(e?.message ?? 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-medium mb-4">Import from flashcards (optional)</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {(['manual', 'deck', 'card'] as const).map((m) => (
            <Button key={m} variant={importMode === m ? 'primary' : 'secondary'} onClick={() => setImportMode(m)}>{m}</Button>
          ))}
        </div>
        {importMode !== 'manual' && (
          <div className="space-y-3">
            <select value={selectedDeck} onChange={(e) => { setSelectedDeck(e.target.value); setSelectedCard('') }} className="w-full bg-white/5 border border-line rounded-xl px-3 py-2.5 text-sm">
              <option value="">Select deck</option>
              {decks.map((d: any) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
            {importMode === 'card' && selectedDeck && (
              <select value={selectedCard} onChange={(e) => setSelectedCard(e.target.value)} className="w-full bg-white/5 border border-line rounded-xl px-3 py-2.5 text-sm">
                <option value="">Select card</option>
                {cards.map((c: any) => <option key={c.id} value={c.id}>{c.front.slice(0, 60)}</option>)}
              </select>
            )}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-4">AI Explain</h3>
        <div className="space-y-3">
          <Input label="Concept" value={concept} onChange={setConcept} placeholder={importMode === 'card' ? 'Auto from card (or override)' : ''} />
          {importMode === 'manual' && <Input label="Source material (optional)" value={source} onChange={setSource} />}
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <Button key={m} variant={mode === m ? 'primary' : 'secondary'} onClick={() => setMode(m)}>{m}</Button>
            ))}
          </div>
          <Button onClick={() => run()} disabled={loading}>{loading ? 'Explaining…' : 'Explain'}</Button>
          {error && <p className="text-xs text-red-300">{error}</p>}
        </div>
      </Card>
      {result && (
        <Card>
          <h3 className="text-sm font-medium mb-2">Explanation</h3>
          <p className="text-sm whitespace-pre-wrap">{result}</p>
          <div className="mt-4 space-y-2">
            <Input label="Follow-up question" value={followup} onChange={setFollowup} />
            <div className="flex gap-2">
              <Button onClick={() => { run(followup); setFollowup('') }} disabled={loading || !followup.trim()}>Ask</Button>
              <Button variant="secondary" onClick={() => run()}>Explain differently</Button>
            </div>
          </div>
          {history.length > 0 && (
            <div className="mt-4 space-y-2">
              {history.map((h, i) => (
                <div key={i} className="border-t border-line pt-2">
                  <p className="text-xs text-muted">Q: {h.q}</p>
                  <p className="text-sm mt-1">{h.a}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
