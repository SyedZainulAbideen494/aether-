import { db } from '../../db'
import { updateConcept } from '../../utils/mastery'

export async function getOrCreateConcept(name: string, subject = 'General', difficulty: 'easy' | 'medium' | 'hard' = 'medium', parentId?: string, prereqs: string[] = []) {
  const existing = await db.concepts.where('conceptName').equals(name).first()
  if (existing) return existing
  const c = {
    conceptId: crypto.randomUUID(),
    conceptName: name,
    parentConceptId: parentId,
    subject,
    difficulty,
    prerequisites: prereqs,
    totalAttempts: 0,
    correctAttempts: 0,
    incorrectAttempts: 0,
    averageResponseTime: 0,
    confidenceHistory: [],
    recentPerformance: [],
    lastReviewed: null,
    nextReviewDate: Date.now(),
    masteryScore: 0,
    learningStatus: 'struggling' as const,
  }
  await db.concepts.add(c as any)
  return c
}

export async function recordAttempt(conceptName: string, correct: boolean, responseTimeMs: number, confidence?: number) {
  let c = await db.concepts.where('conceptName').equals(conceptName).first()
  if (!c) c = await getOrCreateConcept(conceptName)
  const updated = updateConcept(c, { correct, responseTimeMs, confidence, timestamp: Date.now() })
  await db.concepts.put(updated as any)
  return updated
}

export async function getAllConcepts() {
  return db.concepts.toArray()
}
