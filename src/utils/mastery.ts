export interface Attempt { correct: boolean; responseTimeMs: number; confidence?: number; timestamp: number }

export function computeMastery(c: any): number {
  // c has fields; attempts optional recent
  const total = c.totalAttempts || 0
  const correct = c.correctAttempts || 0
  const histAcc = total ? correct / total : 0

  const recent = (c.recentPerformance || []).slice(-10)
  const recentAcc = recent.length ? recent.reduce((a: number, b: number) => a + b, 0) / recent.length : histAcc

  // consistency: variance of recent
  let consistency = 1
  if (recent.length > 1) {
    const mean = recentAcc
    const variance = recent.reduce((a: number, b: number) => a + (b - mean) ** 2, 0) / recent.length
    consistency = Math.max(0, 1 - variance)
  }

  // retention: based on spaced repetition success across sessions (approx by review count)
  const retention = Math.min(1, (c.reviewCount ?? 0) / 5) // placeholder

  // confidence calibration: compare confidence to accuracy
  const conf = c.confidenceHistory?.length ? c.confidenceHistory.reduce((a: number, b: number) => a + b, 0) / c.confidenceHistory.length / 5 : 0.5
  const calib = 1 - Math.abs(conf - histAcc)

  // recall efficiency: not speed over correctness; reward reasonable times
  const avgTime = c.averageResponseTime || 0
  const efficiency = avgTime > 0 ? Math.min(1, 6000 / Math.max(avgTime, 1000)) : 0.5

  const score =
    histAcc * 0.25 +
    recentAcc * 0.25 +
    consistency * 0.15 +
    retention * 0.15 +
    calib * 0.10 +
    efficiency * 0.10

  // require sufficient attempts
  if (total < 3) return Math.min(score * 100, 40)
  return Math.round(score * 100)
}

export function masteryStatus(score: number, thresholds?: any): string {
  const t = thresholds || { struggling: 40, developing: 60, understanding: 80, strong: 95 }
  if (score >= t.strong) return 'mastered'
  if (score >= t.understanding) return 'strong'
  if (score >= t.developing) return 'understanding'
  if (score >= t.struggling) return 'developing'
  return 'struggling'
}

export function updateConcept(c: any, attempt: Attempt): any {
  const total = (c.totalAttempts || 0) + 1
  const correct = (c.correctAttempts || 0) + (attempt.correct ? 1 : 0)
  const incorrect = (c.incorrectAttempts || 0) + (attempt.correct ? 0 : 1)
  const recent = [...(c.recentPerformance || []), attempt.correct ? 1 : 0].slice(-20)
  const conf = attempt.confidence != null ? [...(c.confidenceHistory || []), attempt.confidence].slice(-20) : (c.confidenceHistory || [])
  const avgTime = c.averageResponseTime ? (c.averageResponseTime * (total - 1) + attempt.responseTimeMs) / total : attempt.responseTimeMs
  const updated = {
    ...c,
    totalAttempts: total,
    correctAttempts: correct,
    incorrectAttempts: incorrect,
    recentPerformance: recent,
    confidenceHistory: conf,
    averageResponseTime: avgTime,
    lastReviewed: attempt.timestamp,
  }
  const score = computeMastery(updated)
  updated.masteryScore = score
  updated.learningStatus = masteryStatus(score) as any
  return updated
}
