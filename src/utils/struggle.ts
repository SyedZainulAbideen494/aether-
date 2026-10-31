export interface GapReport {
  conceptId: string
  conceptName: string
  evidence: string[]
  likelyKnowledgeGaps: string[]
  prerequisiteGaps: string[]
  recommendedTeachingMethod: string
  recommendedCardCount: number
  recommendedNextAction: string
}

export function detectStruggle(concept: any, prereqConcepts: any[]): GapReport | null {
  const evidence: string[] = []
  const recent = (concept.recentPerformance || []).slice(-8)
  const misses = recent.filter((x: number) => x === 0).length
  if (concept.totalAttempts >= 4 && misses >= 3) evidence.push('Repeated misses on recent attempts')
  if ((concept.incorrectAttempts || 0) >= 3) evidence.push('Multiple incorrect attempts recorded')
  if ((concept.masteryScore ?? 50) < 40) evidence.push('Low mastery score')
  if (evidence.length < 2) return null
  const prereqGaps = prereqConcepts.filter((p: any) => (p.masteryScore ?? 0) < 60).map((p: any) => p.conceptName)
  return {
    conceptId: concept.conceptId,
    conceptName: concept.conceptName,
    evidence,
    likelyKnowledgeGaps: ['Core understanding of ' + concept.conceptName],
    prerequisiteGaps: prereqGaps,
    recommendedTeachingMethod: prereqGaps.length ? 'prerequisite_review' : 'analogy',
    recommendedCardCount: 6,
    recommendedNextAction: prereqGaps.length ? 'review_prerequisites' : 'remedial_cards',
  }
}
