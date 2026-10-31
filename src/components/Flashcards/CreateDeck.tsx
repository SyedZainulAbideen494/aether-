import { useState } from 'react'
import { db } from '../../db'
import { generateCards, type GenCard } from '../../services/gemini/generate'
import { extractPdf, pagesToText } from '../../utils/pdf'
import { useAppStore } from '../../store/useAppStore'
import Card from '../UI/Card'
import Button from '../UI/Button'
import Input from '../UI/Input'
import { X, Loader2 } from 'lucide-react'

interface ImgItem { file: File; base64: string; mimeType: string; url: string }

export default function CreateDeck({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const apiKey = useAppStore((s) => s.settings.geminiApiKey)
  const geminiModel = useAppStore((s) => s.settings.geminiModel)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#7c5cff')
  const [topic, setTopic] = useState('')
  const [instructions, setInstructions] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed')
  const [count, setCount] = useState(20)
  const [language, setLanguage] = useState('English')
  const [images, setImages] = useState<ImgItem[]>([])
  const [pdfPages, setPdfPages] = useState<{ page: number; text: string }[]>([])
  const [selectedPages, setSelectedPages] = useState<number[]>([])
  const [generated, setGenerated] = useState<GenCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'config' | 'preview'>('config')

  const handleImages = async (files: FileList | null) => {
    if (!files) return
    const items: ImgItem[] = []
    for (const f of Array.from(files)) {
      if (!/^image\/(jpeg|jpg|png|webp)$/i.test(f.type)) continue
      const base64 = await fileToBase64(f)
      items.push({ file: f, base64: base64.split(',')[1], mimeType: f.type, url: base64 })
    }
    setImages((prev) => [...prev, ...items])
  }

  const handlePdf = async (file: File | null) => {
    if (!file) return
    const { pages, images } = await extractPdf(file)
    setPdfPages(pages)
    setSelectedPages(pages.map((p) => p.page))
    if (images.length) {
      // scanned pdf -> treat images as source images
      setImages((prev) => [...prev, ...images.map((im, i) => ({ file: new File([], `page-${i}.png`), base64: im.base64, mimeType: im.mimeType, url: `data:${im.mimeType};base64,${im.base64}` }))])
    }
  }

  const generate = async () => {
    if (!apiKey) { setError('Set Gemini API key in Settings > AI Integration first.'); return }
    setLoading(true); setError(null)
    try {
      const imgs = images.map((im) => ({ base64: im.base64, mimeType: im.mimeType }))
      const pdfText = pdfPages.length ? pagesToText(pdfPages, selectedPages) : undefined
      const cards = await generateCards({
        apiKey, topic: topic || title, instructions, difficulty, count, language,
        images: imgs.length ? imgs : undefined, pdfText,
        model: geminiModel,
      })
      setGenerated(cards)
      setStep('preview')
    } catch (e: any) {
      setError(e?.message ?? 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const saveDeck = async () => {
    if (!title.trim()) { setError('Deck title required'); return }
    const deckId = crypto.randomUUID()
    const now = Date.now()
    await db.decks.add({ id: deckId, title: title.trim(), description: description.trim(), color, createdAt: now, updatedAt: now, lastStudied: null })
    for (const c of generated) {
      const cardId = crypto.randomUUID()
      await db.cards.add({
        id: cardId, deckId, front: c.front, back: c.back, explanation: c.explanation,
        sourcePage: c.sourcePage, difficulty: c.difficulty, topic: c.topic, createdAt: now, updatedAt: now,
      })
      await db.reviews.add({
        cardId, deckId, lastReviewed: null, reviewCount: 0, rating: null, nextReview: now, easeFactor: 2.5, interval: 0,
      })
    }
    // save source files
    if (images.length) {
      for (const im of images) {
        try {
          const blob = await (await fetch(im.url)).blob()
          await db.sources.add({ id: crypto.randomUUID(), deckId, name: im.file.name || 'image', type: 'image', data: blob, createdAt: now })
        } catch {}
      }
    }
    onCreated(deckId)
  }

  const updateCard = (idx: number, patch: Partial<GenCard>) => {
    setGenerated((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
  }
  const removeCard = (idx: number) => setGenerated((prev) => prev.filter((_, i) => i !== idx))

  if (step === 'preview') {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-6 md:pt-10 safe-top safe-x space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Preview cards</h1>
          <Button variant="secondary" onClick={() => setStep('config')}>Back</Button>
        </div>
        <p className="text-muted text-sm">{generated.length} cards generated. Edit before saving.</p>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar">
          {generated.map((c, i) => (
            <Card key={i}>
              <div className="space-y-2">
                <Input label="Front" value={c.front} onChange={(v: string) => updateCard(i, { front: v })} />
                <Input label="Back" value={c.back} onChange={(v: string) => updateCard(i, { back: v })} />
                <Input label="Explanation" value={c.explanation ?? ''} onChange={(v: string) => updateCard(i, { explanation: v })} />
                <div className="flex justify-end">
                  <Button variant="danger" onClick={() => removeCard(i)}>Remove</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="flex gap-2">
          <Button onClick={saveDeck}>Save deck</Button>
          <Button variant="secondary" onClick={() => setStep('config')}>Regenerate</Button>
        </div>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pt-6 md:pt-10 safe-top safe-x space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Create deck</h1>
        <Button variant="secondary" onClick={onBack}>Back</Button>
      </div>

      <Card>
        <h3 className="text-sm font-medium mb-4">Deck info</h3>
        <div className="space-y-3">
          <Input label="Title" value={title} onChange={setTitle} />
          <Input label="Description" value={description} onChange={setDescription} />
          <div>
            <label className="block text-xs text-muted mb-1.5">Cover color</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-8 rounded" />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-4">AI generation</h3>
        <div className="space-y-3">
          <Input label="Topic" value={topic} onChange={setTopic} placeholder="e.g. Photosynthesis, Calculus derivatives" />
          <Input label="Additional instructions" value={instructions} onChange={setInstructions} placeholder="Focus on definitions, include formulas..." />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1.5">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="w-full bg-white/5 border border-line rounded-xl px-3 py-2.5 text-sm">
                <option value="mixed">Mixed</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Cards</label>
              <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full bg-white/5 border border-line rounded-xl px-3 py-2.5 text-sm">
                {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Language</label>
              <Input value={language} onChange={setLanguage} />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-4">Images</h3>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => handleImages(e.target.files)} />
        <div className="flex flex-wrap gap-2 mt-3">
          {images.map((im, i) => (
            <div key={i} className="relative">
              <img src={im.url} className="w-20 h-20 object-cover rounded-xl" />
              <button className="absolute -top-1 -right-1 bg-black/60 rounded-full p-1" onClick={() => setImages((prev) => prev.filter((_, x) => x !== i))}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium mb-4">PDF</h3>
        <input type="file" accept="application/pdf" onChange={(e) => handlePdf(e.target.files?.[0] ?? null)} />
        {pdfPages.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-muted mb-2">Pages ({pdfPages.length}):</p>
            <div className="flex flex-wrap gap-2">
              {pdfPages.map((p) => (
                <label key={p.page} className="text-xs flex items-center gap-1">
                  <input type="checkbox" checked={selectedPages.includes(p.page)} onChange={(e) => {
                    setSelectedPages((prev) => e.target.checked ? [...prev, p.page] : prev.filter((x) => x !== p.page))
                  }} />
                  {p.page}
                </label>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="flex gap-2">
        <Button onClick={generate} disabled={loading}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : 'Generate cards'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}
