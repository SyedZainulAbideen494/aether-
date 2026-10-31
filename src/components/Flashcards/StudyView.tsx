import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '../../db'
import { usePomodoro } from '../../hooks/usePomodoro'
import { useLiveQuery } from 'dexie-react-hooks'
import Card from '../UI/Card'
import Button from '../UI/Button'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

export default function StudyView({ deckId, mode, onBack }: { deckId: string; mode: 'all' | 'due' | 'missed'; onBack: () => void }) {
  const allCards = useLiveQuery(() => db.cards.where('deckId').equals(deckId).toArray(), [deckId]) ?? []
  const reviews = useLiveQuery(() => db.reviews.where('deckId').equals(deckId).toArray(), [deckId]) ?? []
  const reviewMap = new Map(reviews.map((r) => [r.cardId, r]))

  const queue = buildQueue(allCards, reviews, mode)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [direction, setDirection] = useState(0)
  const [studied, setStudied] = useState(0)
  const pom = usePomodoro()
  const [correct, setCorrect] = useState(0)

  // keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f) }
      else if (e.key === 'ArrowUp') rate('good')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, queue.length])

  const safeIndex = Math.min(index, Math.max(0, queue.length - 1))
  const current = queue[safeIndex]

  const next = () => {
    setFlipped(false)
    setDirection(1)
    setIndex((i) => Math.min(i + 1, queue.length - 1))
  }
  const prev = () => {
    setFlipped(false)
    setDirection(-1)
    setIndex((i) => Math.max(i - 1, 0))
  }

  const rate = useCallback(async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!current) return
    const rev = reviewMap.get(current.id) ?? { cardId: current.id, deckId, lastReviewed: null, reviewCount: 0, rating: null, nextReview: Date.now(), easeFactor: 2.5, interval: 0 }
    const updated = sm2(rev, rating)
    await db.reviews.put(updated)
    await db.decks.update(deckId, { lastStudied: Date.now(), updatedAt: Date.now() })
    setStudied((s) => s + 1)
    if (rating === 'good' || rating === 'easy') setCorrect((c) => c + 1)
    // advance
    setFlipped(false)
    setDirection(1)
    if (index < queue.length - 1) setIndex((i) => i + 1)
  }, [current, reviewMap, deckId, index, queue.length])

  const handleDragEnd = (_: any, info: any) => {
    const { offset, velocity } = info
    if (offset.x > 120 || (velocity.x > 500 && offset.x > 40)) {
      rate('good')
    } else if (offset.x < -120 || (velocity.x < -500 && offset.x < -40)) {
      rate('again')
    } else if (offset.y < -120 || (velocity.y < -500 && offset.y < -40)) {
      // skip
      next()
    }
  }

  if (queue.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="text-center max-w-md">
          <p className="text-muted mb-4">No cards to study in this mode.</p>
          <Button onClick={onBack}>Back</Button>
        </Card>
      </div>
    )
  }

  const progress = (safeIndex + 1) / queue.length

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom safe-x">
      <div className="flex items-center justify-between px-4 py-3">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <span className="text-sm text-muted">{safeIndex + 1} / {queue.length}</span>
        <span className="text-xs text-faint">{studied} studied · {correct} correct</span>
        <button onClick={() => { if (!pom.running) { pom.setType('focus' as any); pom.start() } else pom.pause() }} className="text-xs text-accent">{pom.running ? 'Pause focus' : 'Start focus'}</button>
      </div>
      <div className="h-1 bg-white/10 mx-4 rounded-full overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.id + index}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md"
          >
            <motion.div
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.9}
              onDragEnd={handleDragEnd}
              onClick={() => setFlipped((f) => !f)}
              style={{ perspective: 1000 }}
              className="cursor-grab active:cursor-grabbing"
            >
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative w-full aspect-[3/4]"
              >
                {/* front */}
                <div
                  className="absolute inset-0 glass rounded-3xl p-6 flex flex-col justify-between"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="flex justify-between text-xs text-muted">
                    <span>{current.topic ?? 'Card'}</span>
                    <span className="capitalize">{current.difficulty ?? ''}</span>
                  </div>
                  <p className="text-xl font-medium text-center">{current.front}</p>
                  <p className="text-xs text-faint text-center">Tap to flip · swipe to rate</p>
                </div>
                {/* back */}
                <div
                  className="absolute inset-0 glass rounded-3xl p-6 flex flex-col justify-between"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div className="flex justify-between text-xs text-muted">
                    <span>Answer</span>
                    {current.sourcePage && <span>p.{current.sourcePage}</span>}
                  </div>
                  <p className="text-xl font-medium text-center">{current.back}</p>
                  {current.explanation && <p className="text-sm text-muted text-center">{current.explanation}</p>}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-4 pb-6 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" onClick={prev} disabled={index === 0}><ChevronLeft size={16} /></Button>
          <Button variant="secondary" onClick={() => setFlipped(false)}><RotateCcw size={16} /></Button>
          <Button variant="secondary" onClick={next} disabled={index === queue.length - 1}><ChevronRight size={16} /></Button>
        </div>
        {flipped && (
          <div className="grid grid-cols-4 gap-2">
            <Button variant="danger" onClick={() => rate('again')}>Again</Button>
            <Button variant="secondary" onClick={() => rate('hard')}>Hard</Button>
            <Button onClick={() => rate('good')}>Good</Button>
            <Button variant="secondary" onClick={() => rate('easy')}>Easy</Button>
          </div>
        )}
        <p className="text-center text-xs text-faint">Swipe right = Good · left = Again · up = Skip</p>
      </div>
    </div>
  )
}

function buildQueue(cards: any[], reviews: any[], mode: string) {
  const rmap = new Map(reviews.map((r: any) => [r.cardId, r]))
  let filtered = cards
  if (mode === 'due') filtered = cards.filter((c) => (rmap.get(c.id)?.nextReview ?? 0) <= Date.now())
  if (mode === 'missed') filtered = cards.filter((c) => rmap.get(c.id)?.rating === 'again')
  return filtered
}

function sm2(rev: any, rating: 'again' | 'hard' | 'good' | 'easy') {
  const q = rating === 'again' ? 0 : rating === 'hard' ? 2 : rating === 'good' ? 3 : 5
  let ef = rev.easeFactor ?? 2.5
  let interval = rev.interval ?? 0
  let reps = rev.reviewCount ?? 0
  if (q < 3) {
    reps = 0
    interval = 0
  } else {
    if (reps === 0) interval = 1
    else if (reps === 1) interval = 6
    else interval = Math.round(interval * ef)
    reps += 1
    ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if (ef < 1.3) ef = 1.3
  }
  const now = Date.now()
  const nextReview = now + interval * 86400000
  // again -> review soon (10 min)
  const nr = rating === 'again' ? now + 10 * 60 * 1000 : nextReview
  return {
    cardId: rev.cardId,
    deckId: rev.deckId,
    lastReviewed: now,
    reviewCount: (rev.reviewCount ?? 0) + 1,
    rating,
    nextReview: nr,
    easeFactor: ef,
    interval: rating === 'again' ? 0 : interval,
  }
}
