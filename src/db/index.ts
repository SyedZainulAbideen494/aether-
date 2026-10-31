import Dexie, { type Table } from 'dexie'

export interface Card {
  id: string
  deckId: string
  front: string
  back: string
  explanation?: string
  sourcePage?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  topic?: string
  conceptIds?: string[]
  createdAt: number
  updatedAt: number
}

export interface ReviewState {
  cardId: string
  deckId: string
  lastReviewed: number | null
  reviewCount: number
  rating: 'again' | 'hard' | 'good' | 'easy' | null
  nextReview: number
  easeFactor: number
  interval: number
}

export interface Deck {
  id: string
  title: string
  description: string
  color: string
  createdAt: number
  updatedAt: number
  lastStudied: number | null
  isTemporary?: boolean
  sourceConceptId?: string
  originalDeckId?: string
  generationReason?: string
}

export interface SourceFile {
  id: string
  deckId: string
  name: string
  type: 'image' | 'pdf'
  data: Blob
  createdAt: number
}

export interface Concept {
  conceptId: string
  conceptName: string
  parentConceptId?: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  prerequisites: string[]
  totalAttempts: number
  correctAttempts: number
  incorrectAttempts: number
  averageResponseTime: number
  confidenceHistory: number[]
  recentPerformance: number[]
  lastReviewed: number | null
  nextReviewDate: number
  masteryScore: number
  learningStatus: 'struggling' | 'developing' | 'understanding' | 'strong' | 'mastered'
}

export interface Quiz {
  id: string
  title: string
  sourceType: 'deck' | 'topic' | 'pdf' | 'image' | 'mixed'
  sourceRef?: string
  createdAt: number
  settings: any
}

export interface QuizQuestion {
  id: string
  quizId: string
  conceptId?: string
  question: string
  questionType: 'mcq' | 'multi' | 'tf' | 'numeric' | 'scenario' | 'conceptual' | 'formula' | 'fill'
  options?: string[]
  correctAnswer: any
  explanation?: string
  optionFeedback?: Record<string, string>
  hint?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  sourceReference?: string
}

export interface QuizAttempt {
  id: string
  quizId: string
  startedAt: number
  completedAt: number | null
  answers: Record<string, any>
  marked: string[]
  score: number
  total: number
  timeTaken: number
}

export interface ExplanationRecord {
  id: string
  conceptId?: string
  mode: string
  question: string
  answer: string
  createdAt: number
}

export interface LearningPlan {
  id: string
  date: string
  items: { type: string; ref: string; title: string }[]
  createdAt: number
}

class AetherDB extends Dexie {
  decks!: Table<Deck, string>
  cards!: Table<Card, string>
  reviews!: Table<ReviewState, string>
  sources!: Table<SourceFile, string>
  concepts!: Table<Concept, string>
  quizzes!: Table<Quiz, string>
  quizQuestions!: Table<QuizQuestion, string>
  quizAttempts!: Table<QuizAttempt, string>
  explanations!: Table<ExplanationRecord, string>
  learningPlans!: Table<LearningPlan, string>

  constructor() {
    super('aether-flashcards')
    this.version(1).stores({
      decks: 'id, createdAt, updatedAt, lastStudied',
      cards: 'id, deckId, createdAt',
      reviews: 'cardId, deckId, nextReview',
      sources: 'id, deckId',
    })
    this.version(2).stores({
      decks: 'id, createdAt, updatedAt, lastStudied',
      cards: 'id, deckId, createdAt',
      reviews: 'cardId, deckId, nextReview',
      sources: 'id, deckId',
      concepts: 'conceptId, subject, learningStatus',
      quizzes: 'id, createdAt',
      quizQuestions: 'id, quizId, conceptId',
      quizAttempts: 'id, quizId, startedAt',
      explanations: 'id, conceptId, createdAt',
      learningPlans: 'id, date',
    })
    this.version(3).stores({
      concepts: 'conceptId, conceptName, subject, learningStatus',
    })
  }
}

export const db = new AetherDB()
