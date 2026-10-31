import { generateCards } from './generate'
import type { GenCard } from './generate'

export async function generateRemedialCards(apiKey: string, conceptName: string, prereqGaps: string[], count = 6, model?: string): Promise<GenCard[]> {
  const instructions = `Create a remedial learning sequence for the concept "${conceptName}".
Progression stages:
1. Simple definition.
2. Intuitive explanation.
3. Analogy or real-world example.
4. Worked example.
5. Active recall.
6. Application question.
${prereqGaps.length ? 'Prerequisite gaps to address first: ' + prereqGaps.join(', ') : ''}
Each card one learning objective. Preserve technical terms. Avoid repeating original question.`
  return generateCards({ apiKey, topic: conceptName, instructions, difficulty: 'mixed', count, language: 'English', model })
}
