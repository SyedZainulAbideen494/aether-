import { GoogleGenAI } from '@google/genai'
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

const SCHEMA = {
  type: 'object',
  properties: {
    cards: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          front: { type: 'string' },
          back: { type: 'string' },
          explanation: { type: 'string' },
          sourcePage: { type: 'integer' },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          topic: { type: 'string' },
        },
        required: ['front', 'back'],
      },
    },
  },
  required: ['cards'],
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
  const ai = new GoogleGenAI({ apiKey: p.apiKey })
  const contents: any[] = [{ text: buildPrompt(p) }]
  if (p.images) {
    for (const img of p.images) {
      contents.push({ inlineData: { data: img.base64, mimeType: img.mimeType } })
    }
  }

  let lastErr: any
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: p.model || 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: contents }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: SCHEMA as any,
          temperature: 0.4,
        },
      })
      const text = res.text ?? ''
      if (!text.trim()) throw new Error('Empty response from Gemini')
      const parsed = extractJson(text)
      const cards = Array.isArray(parsed?.cards) ? parsed.cards : []
      if (!cards.length) throw new Error('No cards generated')
      // validate
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
    } catch (e: any) {
      lastErr = e
      const msg = String(e?.message ?? e)
      if (msg.includes('429') || msg.toLowerCase().includes('rate')) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
        continue
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500))
    }
  }
  throw lastErr ?? new Error('Generation failed')
}

export async function testGemini(apiKey: string, model?: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey })
  const res = await ai.models.generateContent({
    model: model || 'gemini-2.5-flash',
    contents: 'Reply with the single word: OK',
  })
  return (res.text ?? '').trim()
}
