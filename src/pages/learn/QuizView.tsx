import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useAppStore } from '../../store/useAppStore'
import { generateQuiz } from '../../services/gemini/quiz'
import { recordAttempt, getOrCreateConcept } from '../../services/learning/concepts'
import { generateRemedialCards } from '../../services/gemini/remedial'
import { detectStruggle } from '../../utils/struggle'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import Input from '../../components/UI/Input'

export default function QuizView() {
  const apiKey = useAppStore((s) => s.settings.geminiApiKey)
  const geminiModel = useAppStore((s) => s.settings.geminiModel)
  const decks = useLiveQuery(() => db.decks.toArray(), []) ?? []
  const [phase, setPhase] = useState<'create' | 'taking' | 'results'>('create')
  const [title, setTitle] = useState('Quiz')
  const [sourceType, setSourceType] = useState<'topic' | 'deck'>('topic')
  const [topic, setTopic] = useState('')
  const [deckId, setDeckId] = useState('')
  const [count, setCount] = useState(10)
  const [difficulty, setDifficulty] = useState('medium')
  const [questions, setQuestions] = useState<any[]>([])
  const [quizId, setQuizId] = useState('')
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [marked, setMarked] = useState<string[]>([])
  const [current, setCurrent] = useState(0)
  const [startedAt, setStartedAt] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<any>(null)

  const createQuiz = async () => {
    if (!apiKey) { setError('Set Gemini API key.'); return }
    setLoading(true); setError(null)
    try {
      let sourceText = ''
      if (sourceType === 'deck' && deckId) {
        const cards = await db.cards.where('deckId').equals(deckId).toArray()
        sourceText = cards.map((c) => `Q: ${c.front}\nA: ${c.back}`).join('\n')
      }
      const qs = await generateQuiz(apiKey, { sourceText: sourceText || undefined, topic: sourceType === 'topic' ? topic : undefined, count, difficulty, types: ['mcq'], model: geminiModel })
      // create quiz + questions
      const qid = crypto.randomUUID()
      await db.quizzes.add({ id: qid, title, sourceType, sourceRef: sourceType === 'deck' ? deckId : topic, createdAt: Date.now(), settings: { count, difficulty } })
      for (const q of qs) {
        const qidq = crypto.randomUUID()
        await db.quizQuestions.add({
          id: qidq, quizId: qid, conceptId: q.concept, question: q.question, questionType: q.questionType,
          options: q.options, correctAnswer: q.correctAnswer, explanation: q.explanation,
          optionFeedback: q.optionFeedback, hint: q.hint, difficulty: q.difficulty, sourceReference: q.sourceReference,
        })
      }
      const loaded = await db.quizQuestions.where('quizId').equals(qid).toArray()
      setQuestions(loaded)
      setQuizId(qid)
      setAnswers({})
      setMarked([])
      setCurrent(0)
      setStartedAt(Date.now())
      setPhase('taking')
    } catch (e: any) { setError(e?.message ?? 'Failed') }
    finally { setLoading(false) }
  }

  const submit = async () => {
    setError(null)
    try {
    const completedAt = Date.now()
    let score = 0
    for (const q of questions) {
      const a = answers[q.id]
      const correct = checkAnswer(q, a)
      if (correct) score++
      // record concept attempt
      if (q.conceptId || q.concept) {
        const conceptName = q.concept || q.conceptId
        await getOrCreateConcept(conceptName, 'General', q.difficulty ?? 'medium')
        await recordAttempt(conceptName, correct, 5000)
      }
    }
    const attempt = {
      id: crypto.randomUUID(), quizId, startedAt, completedAt, answers, marked,
      score, total: questions.length, timeTaken: completedAt - startedAt,
    }
    await db.quizAttempts.add(attempt as any)
    // mistake analysis + remedial for struggling concepts
    const weakConcepts: string[] = []
    for (const q of questions) {
      const a = answers[q.id]
      if (!checkAnswer(q, a)) {
        const name = q.concept || q.conceptId
        if (name) {
          const c = await db.concepts.where('conceptName').equals(name).first()
          if (c) {
            const gap = detectStruggle(c, [])
            if (gap) {
              weakConcepts.push(name)
              // generate remedial deck once per weak concept
              if (apiKey) {
                try {
                  const cards = await generateRemedialCards(apiKey, name, gap.prerequisiteGaps, gap.recommendedCardCount, geminiModel)
                  const did = crypto.randomUUID()
                  const now = Date.now()
                  await db.decks.add({ id: did, title: `Remedial: ${name}`, description: 'AI-generated remedial practice', color: '#ff6b6b', createdAt: now, updatedAt: now, lastStudied: null, isTemporary: true, sourceConceptId: c.conceptId, generationReason: gap.recommendedNextAction })
                  for (const cc of cards) {
                    const cid = crypto.randomUUID()
                    await db.cards.add({ id: cid, deckId: did, front: cc.front, back: cc.back, explanation: cc.explanation, sourcePage: cc.sourcePage, difficulty: cc.difficulty, topic: cc.topic, conceptIds: [c.conceptId], createdAt: now, updatedAt: now })
                    await db.reviews.add({ cardId: cid, deckId: did, lastReviewed: null, reviewCount: 0, rating: null, nextReview: now, easeFactor: 2.5, interval: 0 })
                  }
                } catch {}
              }
            }
          }
        }
      }
    }
    setResults({ score, total: questions.length, weakConcepts, timeTaken: completedAt - startedAt })
    setPhase('results')
    } catch (e: any) { setError(e?.message ?? 'Submit failed') } 
  }

  const resolveCorrect = (q: any) => {
    if (typeof q.correctAnswer === 'number' && Array.isArray(q.options)) return q.options[q.correctAnswer]
    return q.correctAnswer
  }
  const checkAnswer = (q: any, a: any) => {
    if (a == null) return false
    const ca = resolveCorrect(q)
    if (q.questionType === 'mcq' || q.questionType === 'tf') return String(a).trim().toLowerCase() === String(ca).trim().toLowerCase()
    if (q.questionType === 'numeric') return Math.abs(Number(a) - Number(q.correctAnswer)) < 1e-6
    if (q.questionType === 'multi') {
      const ca = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]
      const aa = Array.isArray(a) ? a : [a]
      return ca.length === aa.length && ca.every((x: any) => aa.includes(x))
    }
    return String(a).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
  }

  if (phase === 'create') {
    return (
      <div className="space-y-4">
        <Card>
          <h3 className="text-sm font-medium mb-4">Create quiz</h3>
          <div className="space-y-3">
            <Input label="Title" value={title} onChange={setTitle} />
            <div>
              <label className="block text-xs text-muted mb-1.5">Source</label>
              <div className="flex gap-2">
                <Button variant={sourceType === 'topic' ? 'primary' : 'secondary'} onClick={() => setSourceType('topic')}>Topic</Button>
                <Button variant={sourceType === 'deck' ? 'primary' : 'secondary'} onClick={() => setSourceType('deck')}>Deck</Button>
              </div>
            </div>
            {sourceType === 'topic' && <Input label="Topic" value={topic} onChange={setTopic} />}
            {sourceType === 'deck' && (
              <select value={deckId} onChange={(e) => setDeckId(e.target.value)} className="w-full bg-white/5 border border-line rounded-xl px-3 py-2.5 text-sm">
                <option value="">Select deck</option>
                {decks.map((d: any) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted mb-1.5">Questions</label>
                <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full bg-white/5 border border-line rounded-xl px-3 py-2.5 text-sm">
                  {[5, 10, 15, 20, 30, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">Difficulty</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full bg-white/5 border border-line rounded-xl px-3 py-2.5 text-sm">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>
            <Button onClick={createQuiz} disabled={loading}>{loading ? 'Generating…' : 'Generate quiz'}</Button>
            {error && <p className="text-xs text-red-300">{error}</p>}
          </div>
        </Card>
      </div>
    )
  }

  if (phase === 'taking') {
    const q = questions[current]
    return (
      <div className="space-y-4">
        <Card>
          <div className="flex justify-between text-xs text-muted mb-2">
            <span>Question {current + 1} / {questions.length}</span>
            <button onClick={() => setMarked((m) => m.includes(q.id) ? m.filter((x) => x !== q.id) : [...m, q.id])} className="text-accent">
              {marked.includes(q.id) ? 'Unmark' : 'Mark for review'}
            </button>
          </div>
          <p className="font-medium mb-4">{q.question}</p>
          {q.questionType === 'mcq' || q.questionType === 'tf' ? (
            <div className="space-y-2">
              {(q.options ?? (q.questionType === 'tf' ? ['True', 'False'] : [])).map((opt: string, i: number) => (
                <button key={i} onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  className={`w-full text-left px-4 py-3 rounded-xl border ${answers[q.id] === opt ? 'border-accent bg-accent/15' : 'border-line bg-white/5'}`}>
                  {opt}
                </button>
              ))}
            </div>
          ) : q.questionType === 'numeric' ? (
            <Input label="Answer" value={answers[q.id] ?? ''} onChange={(v: string) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
          ) : q.questionType === 'fill' ? (
            <Input label="Fill in the blank" value={answers[q.id] ?? ''} onChange={(v: string) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
          ) : (
            <Input label="Answer" value={answers[q.id] ?? ''} onChange={(v: string) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
          )}
          {q.hint && <p className="text-xs text-faint mt-3">Hint: {q.hint}</p>}
          {error && <p className="text-xs text-red-300 mt-2">{error}</p>}
          <div className="flex justify-between mt-4">
            <Button variant="secondary" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>Prev</Button>
            {current < questions.length - 1 ? (
              <Button onClick={() => setCurrent((c) => c + 1)}>Next</Button>
            ) : (
              <Button onClick={submit}>Submit</Button>
            )}
          </div>
        </Card>
      </div>
    )
  }

  if (phase === 'results' && results) {
    return (
      <div className="space-y-4">
        <Card>
          <h3 className="text-sm font-medium mb-2">Results</h3>
          <p className="text-2xl font-semibold">{results.score} / {results.total}</p>
          <p className="text-muted text-sm">Time: {Math.round(results.timeTaken / 1000)}s</p>
          {results.weakConcepts?.length > 0 && <p className="text-xs text-amber-300 mt-2">Weak: {results.weakConcepts.join(', ')}</p>}
        </Card>
        <div className="space-y-3">
          {questions.map((q) => {
            const a = answers[q.id]
            const ok = checkAnswer(q, a)
            return (
              <Card key={q.id}>
                <p className="font-medium text-sm">{q.question}</p>
                <p className={`text-xs mt-1 ${ok ? 'text-green-300' : 'text-red-300'}`}>{ok ? 'Correct' : 'Incorrect'}</p>
                <p className="text-xs text-muted mt-1">Your answer: {String(a ?? '—')}</p>
                <p className="text-xs text-muted">Correct: {String(resolveCorrect(q))}</p>
                {q.explanation && <p className="text-xs text-faint mt-1">{q.explanation}</p>}
              </Card>
            )
          })}
        </div>
        <Button onClick={() => setPhase('create')}>New quiz</Button>
      </div>
    )
  }

  return null
}
