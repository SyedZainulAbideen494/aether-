import { z } from 'zod'
import { modelManager } from './modelManager'
import { extractJson } from '../../utils/json'

export type ExplainMode = 'beginner' | 'analogy' | 'stepbystep' | 'practical' | 'exam' | 'formula' | 'compare'

export interface ExplainSection { heading: string; content: string; type?: string }
export interface ExplainResult {
  title: string
  definition: string
  sections: ExplainSection[]
  importantPoints: string[]
  commonMisconceptions: string[]
  memoryTrick: string
  knowledgeCheck?: { question: string; options: string[]; correctAnswer: string; explanation: string }
}

const Schema = z.object({
  title: z.string(),
  definition: z.string(),
  sections: z.array(z.object({ heading: z.string(), content: z.string(), type: z.string().optional() })).default([]),
  importantPoints: z.array(z.string()).default([]),
  commonMisconceptions: z.array(z.string()).default([]),
  memoryTrick: z.string().default(''),
  knowledgeCheck: z.object({ question: z.string(), options: z.array(z.string()), correctAnswer: z.string(), explanation: z.string() }).optional(),
})

const modeInstructions: Record<ExplainMode, string> = {
  beginner: 'Explain from absolute basics using simple language.',
  analogy: 'Use a relatable real-world analogy and clearly state where it stops being accurate.',
  stepbystep: 'Explain each stage in sequence.',
  practical: 'Show where the concept is used in real aviation.',
  exam: 'Explain at DGCA examination level with precision.',
  formula: 'Explain formulas, symbols, units, assumptions and worked calculations.',
  compare: 'Compare two related concepts and explain differences.',
}

export async function explain(apiKey: string, params: {
  model?: string
  concept: string
  mode: ExplainMode
  source?: string
  previousExplanation?: string
  incorrectResponse?: string
  prerequisiteGaps?: string[]
  mastery?: number
  compareWith?: string
  followup?: string
}): Promise<ExplainResult> {
  const parts = [
    `You are a patient aviation instructor. Mode: ${modeInstructions[params.mode]}`,
    `Concept: ${params.concept}`,
    params.source ? `Source material: ${params.source.slice(0, 6000)}` : '',
    params.previousExplanation ? `Previous explanation (do not repeat): ${params.previousExplanation.slice(0, 1500)}` : '',
    params.incorrectResponse ? `Learner's incorrect response: ${params.incorrectResponse}` : '',
    params.prerequisiteGaps?.length ? `Prerequisite gaps: ${params.prerequisiteGaps.join(', ')}` : '',
    params.mastery != null ? `Current mastery: ${params.mastery}` : '',
    params.compareWith ? `Compare with: ${params.compareWith}` : '',
    params.followup ? `Learner follow-up question: ${params.followup}` : '',
    `Return ONLY valid JSON with this structure:
{
  "title": "...",
  "definition": "...",
  "sections": [ { "heading": "...", "content": "markdown text", "type": "paragraph|formula|example" } ],
  "importantPoints": ["..."],
  "commonMisconceptions": ["..."],
  "memoryTrick": "...",
  "knowledgeCheck": { "question": "...", "options": ["..."], "correctAnswer": "...", "explanation": "..." }
}
Use Markdown inside content (bold, lists, code, math with $...$). Follow the teaching structure: Simple Definition, Understand It From Zero, How It Works, Visual/Physical Explanation, Aviation Example, Technical Details, Formula and Variables, Common Misconceptions, Exam Points, Memory Trick, Quick Knowledge Check. Omit irrelevant sections. Explain simply, one idea at a time, with correct aviation terminology. Do not repeat.`
  ].filter(Boolean).join('\n\n')

  const { text } = await modelManager.generate('explain', apiKey, {
    contents: parts,
    config: { responseMimeType: 'application/json', temperature: 0.4 },
  })
  const parsed = extractJson(text)
  const validated = Schema.parse(parsed)
  return validated as ExplainResult
}
