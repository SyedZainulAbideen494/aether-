import { GoogleGenAI } from '@google/genai'
import { modelManager } from './modelManager'
import { extractJson } from '../../utils/json'

export interface GenCard {
  front: string
  back: string
  explanation?: string
  sourcePage?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  topic?: string
}

export interface GenParams {
  apiKey: string
  topic?: string
  instructions?: string
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
  count: number
  language?: string
  images?: { base64: string; mimeType: string }[]
  pdfText?: string
  model?: string
}

function buildPrompt(p: GenParams): string {
  const parts: string[] = []
  parts.push(`You are an expert educator creating high-quality flashcards.`)
  if (p.topic) parts.push(`Topic: ${p.topic}`)
  if (p.instructions) parts.push(`Additional instructions: ${p.instructions}`)
  parts.push(`Difficulty: ${p.difficulty ?? 'mixed'}`)
  parts.push(`Number of cards: ${p.count}`)
  parts.push(`Language: ${p.language ?? 'English'}`)
  if (p.pdfText) parts.push(`Source text (from PDF, may be truncated):\n${p.pdfText.slice(0, 12000)}`)
  if (p.images && p.images.length) parts.push(`Also use the provided images as source material.`)
  parts.push(`Rules:
- One learning objective per card.
- Avoid duplicate questions.
- Preserve technical terminology and math formulas.
- Concise front (question), clear back (answer).
- Add explanation when helpful.
- If source-derived, set sourcePage when possible.
- Distinguish AI-added knowledge in explanation.
- Return ONLY valid JSON matching schema.`)
  return parts.join('\n\n')
}

export async function generateCards(p: GenParams): Promise<GenCard[]> {
  if (!p.apiKey) throw new Error('Gemini API key missing')
  const contents: any[] = [{ text: buildPrompt(p) }]
  if (p.images) {
    for (const img of p.images) {
      contents.push({ inlineData: { data: img.base64, mimeType: img.mimeType } })
    }
  }
  const { text } = await modelManager.generate('flashcards', p.apiKey, {
    contents: [{ role: 'user', parts: contents }],
    config: { responseMimeType: 'application/json', temperature: 0.4 },
  })
  if (!text.trim()) throw new Error('Empty response from Gemini')
  const parsed = extractJson(text)
  const cards = Array.isArray(parsed?.cards) ? parsed.cards : []
  if (!cards.length) throw new Error('No cards generated')
  const valid: GenCard[] = []
  for (const c of cards) {
    if (typeof c.front === 'string' && typeof c.back === 'string' && c.front.trim() && c.back.trim()) {
      valid.push({
        front: c.front.trim(),
        back: c.back.trim(),
        explanation: typeof c.explanation === 'string' ? c.explanation.trim() : undefined,
        sourcePage: typeof c.sourcePage === 'number' ? c.sourcePage : undefined,
        difficulty: ['easy', 'medium', 'hard'].includes(c.difficulty) ? c.difficulty : undefined,
        topic: typeof c.topic === 'string' ? c.topic.trim() : undefined,
      })
    }
  }
  if (!valid.length) throw new Error('No valid cards after validation')
  return valid.slice(0, p.count)
}

export async function testGemini(apiKey: string, model?: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey })
  const res = await ai.models.generateContent({
    model: model || 'gemini-2.5-flash',
    contents: 'Reply with the single word: OK',
  })
  return (res.text ?? '').trim()
}
