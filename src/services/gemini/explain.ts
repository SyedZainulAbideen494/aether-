import { GoogleGenAI } from '@google/genai'

export type ExplainMode = 'beginner' | 'analogy' | 'stepbystep' | 'practical' | 'exam' | 'formula' | 'compare'

export async function explain(apiKey: string, params: {
  model?: string;
  concept: string
  mode: ExplainMode
  source?: string
  previousExplanation?: string
  incorrectResponse?: string
  prerequisiteGaps?: string[]
  mastery?: number
  compareWith?: string
  followup?: string
}): Promise<string> {
  const ai = new GoogleGenAI({ apiKey })
  const modeInstructions: Record<ExplainMode, string> = {
    beginner: 'Explain from absolute basics using simple language.',
    analogy: 'Use a relatable real-world analogy.',
    stepbystep: 'Explain each stage in sequence.',
    practical: 'Show where the concept is used in real life.',
    exam: 'Explain at examination level with precision.',
    formula: 'Explain formulas, symbols, units, assumptions and worked calculations.',
    compare: 'Compare two related concepts and explain differences.',
  }
  const parts = [
    `You are a patient tutor. Mode: ${modeInstructions[params.mode]}`,
    `Concept: ${params.concept}`,
    params.source ? `Source material: ${params.source.slice(0, 6000)}` : '',
    params.previousExplanation ? `Previous explanation (do not repeat): ${params.previousExplanation.slice(0, 2000)}` : '',
    params.incorrectResponse ? `Learner's incorrect response: ${params.incorrectResponse}` : '',
    params.prerequisiteGaps?.length ? `Prerequisite gaps: ${params.prerequisiteGaps.join(', ')}` : '',
    params.mastery != null ? `Current mastery: ${params.mastery}` : '',
    params.compareWith ? `Compare with: ${params.compareWith}` : '',
    params.followup ? `Learner follow-up question: ${params.followup}` : '',
    `If the learner still does not understand, try a different approach, reduce complexity, give a new example, explain prerequisites, and ask one small comprehension question. Explain one logical concept at a time.`,
  ].filter(Boolean).join('\n\n')
  const res = await ai.models.generateContent({
    model: params.model || 'gemini-2.5-flash',
    contents: parts,
  })
  return (res.text ?? '').trim()
}
