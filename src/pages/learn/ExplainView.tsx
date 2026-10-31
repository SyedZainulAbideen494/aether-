import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useAppStore } from '../../store/useAppStore'
import { explain, type ExplainMode, type ExplainResult } from '../../services/gemini/explain'
import { generateExplainPdf } from '../../utils/explainPdf'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
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
  const [result, setResult] = useState<ExplainResult | null>(null)
  const [prev, setPrev] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [followup, setFollowup] = useState('')
  const [showSaved, setShowSaved] = useState(false)
  const saved = useLiveQuery(() => db.explanations.toArray(), []) ?? []

  const resolveSource = () => {
    if (importMode === 'card') {
      const c = cards.find((x: any) => x.id === selectedCard)
      if (c) return `Front: ${c.front}\nBack: ${c.back}\nExplanation: ${c.explanation ?? ''}`
    }
    if (importMode === 'deck') return cards.map((c: any) => `Q: ${c.front}\nA: ${c.back}`).join('\n\n')
    return source
  }

  const run = async (fu?: string, newMode?: ExplainMode) => {
    if (!apiKey) { setError('Set Gemini API key in Settings.'); return }
    const m = newMode ?? mode
    if (newMode) setMode(newMode)
    const src = resolveSource()
    const conceptName = concept.trim() || (importMode === 'card' ? (cards.find((x: any) => x.id === selectedCard)?.front ?? '') : '')
    if (!conceptName) { setError('Enter a concept or select a card.'); return }
    setLoading(true); setError(null)
    try {
      const r = await explain(apiKey, { concept: conceptName, mode: m, source: src || undefined, previousExplanation: prev || undefined, followup: fu, model: geminiModel })
      setResult(r)
      setPrev(JSON.stringify(r))
      if (fu) {}
    } catch (e: any) { setError(e?.message ?? 'Failed') }
    finally { setLoading(false) }
  }

  const saveExpl = async () => {
    if (!result) return
    await db.explanations.add({ id: crypto.randomUUID(), conceptId: result.title, mode, question: concept, answer: JSON.stringify(result), createdAt: Date.now() })
    alert('Saved')
  }

  const testUnderstanding = async () => {
    if (!result?.knowledgeCheck) return
    const ans = prompt(result.knowledgeCheck.question + '\n' + result.knowledgeCheck.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n'))
    if (ans === null) return
    const correct = ans.trim().toLowerCase() === result.knowledgeCheck.correctAnswer.trim().toLowerCase() || result.knowledgeCheck.options[ans.charCodeAt(0) - 65]?.toLowerCase() === result.knowledgeCheck.correctAnswer.toLowerCase()
    alert(correct ? 'Correct! ' + result.knowledgeCheck.explanation : 'Not quite. ' + result.knowledgeCheck.explanation)
  }

  const createFlashcards = async () => {
    if (!result) return
    const did = crypto.randomUUID()
    const now = Date.now()
    await db.decks.add({ id: did, title: `Explain: ${result.title}`, description: 'From AI Explain', color: '#7c5cff', createdAt: now, updatedAt: now, lastStudied: null })
    const cards = [result.definition, ...result.sections.map((s) => s.content)].map((c, i) => ({ front: i === 0 ? result.title : (result.sections[i - 1]?.heading ?? result.title), back: c }))
    for (const c of cards) {
      const cid = crypto.randomUUID()
      await db.cards.add({ id: cid, deckId: did, front: c.front, back: c.back, createdAt: now, updatedAt: now })
      await db.reviews.add({ cardId: cid, deckId: did, lastReviewed: null, reviewCount: 0, rating: null, nextReview: now, easeFactor: 2.5, interval: 0 })
    }
    alert('Flashcards created')
  }

  if (showSaved) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" onClick={() => setShowSaved(false)}>Back</Button>
        <h3 className="text-sm font-medium">Saved explanations</h3>
        {saved.map((s: any) => (
          <Card key={s.id}>
            <p className="font-medium text-sm">{s.question}</p>
            <p className="text-xs text-muted">{new Date(s.createdAt).toLocaleString()}</p>
            <div className="flex gap-2 mt-2">
              <Button variant="secondary" onClick={() => { try { setResult(JSON.parse(s.answer)); setShowSaved(false) } catch {} }}>Open</Button>
              <Button variant="danger" onClick={() => db.explanations.delete(s.id)}>Delete</Button>
            </div>
          </Card>
        ))}
        {saved.length === 0 && <p className="text-xs text-faint">None saved.</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-medium mb-4">Import from flashcards (optional)</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {(['manual', 'deck', 'card'] as const).map((m) => (
            <Button key={m} variant={importMode === m ? 'primary' : 'secondary'} onClick={() => setImportMode(m)}>{m}</Button>
          ))}
          <Button variant="secondary" onClick={() => setShowSaved(true)}>Saved explanations</Button>
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
          <Input label="Concept" value={concept} onChange={setConcept} />
          {importMode === 'manual' && <Input label="Source material (optional)" value={source} onChange={setSource} />}
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <Button key={m} variant={mode === m ? 'primary' : 'secondary'} onClick={() => setMode(m)}>{m}</Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => run()} disabled={loading}>{loading ? 'Explaining…' : 'Explain'}</Button>
            <Button variant="secondary" onClick={() => run(undefined, 'beginner')} disabled={loading}>Explain Simpler</Button>
            <Button variant="secondary" onClick={() => run('Give another example')} disabled={loading}>Another Example</Button>
            <Button variant="secondary" onClick={() => run(undefined, 'stepbystep')} disabled={loading}>Step by Step</Button>
          </div>
          {error && <p className="text-xs text-red-300">{error}</p>}
        </div>
      </Card>

      {result && (
        <Card>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="secondary" onClick={testUnderstanding}>Test My Understanding</Button>
            <Button variant="secondary" onClick={createFlashcards}>Create Flashcards</Button>
            <Button variant="secondary" onClick={saveExpl}>Save Explanation</Button>
            <Button onClick={() => generateExplainPdf(result)}>Generate PDF</Button>
          </div>
          <h1 className="text-2xl font-semibold mb-2">{result.title}</h1>
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{result.definition}</ReactMarkdown>
          </div>
          {result.sections.map((s, i) => (
            <div key={i} className="mt-4">
              <h2 className="text-lg font-semibold mb-1">{s.heading}</h2>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{s.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {result.importantPoints?.length > 0 && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-1">Important Points</h2>
              <ul className="list-disc list-inside text-sm text-muted">{result.importantPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
          )}
          {result.commonMisconceptions?.length > 0 && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-1">Common Misconceptions</h2>
              <ul className="list-disc list-inside text-sm text-muted">{result.commonMisconceptions.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
          )}
          {result.memoryTrick && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-1">Memory Trick</h2>
              <p className="text-sm text-muted">{result.memoryTrick}</p>
            </div>
          )}
          {result.knowledgeCheck && (
            <div className="mt-4 bg-white/5 rounded-xl p-4">
              <h2 className="text-lg font-semibold mb-1">Knowledge Check</h2>
              <p className="text-sm">{result.knowledgeCheck.question}</p>
              <ul className="list-disc list-inside text-sm text-muted mt-2">{result.knowledgeCheck.options.map((o, i) => <li key={i}>{o}</li>)}</ul>
            </div>
          )}
          <div className="mt-4">
            <Input label="Follow-up question" value={followup} onChange={setFollowup} />
            <div className="flex gap-2 mt-2">
              <Button onClick={() => { run(followup); setFollowup('') }} disabled={loading || !followup.trim()}>Ask</Button>
              <Button variant="secondary" onClick={() => run()}>Explain differently</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
