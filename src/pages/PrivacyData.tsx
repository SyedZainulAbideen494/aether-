import { useState } from 'react'
import { db } from '../db'
import { clearAll } from '../utils/storage'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'

export default function PrivacyData() {
  const [msg, setMsg] = useState<string | null>(null)
  const exportData = async () => {
    const data = {
      decks: await db.decks.toArray(),
      cards: await db.cards.toArray(),
      reviews: await db.reviews.toArray(),
      concepts: await db.concepts.toArray(),
      quizzes: await db.quizzes.toArray(),
      questions: await db.quizQuestions.toArray(),
      attempts: await db.quizAttempts.toArray(),
      explanations: await db.explanations.toArray(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'aether-data.json'; a.click(); URL.revokeObjectURL(url)
  }
  const clearAllData = async () => {
    if (!confirm('Clear all local data?')) return
    await db.delete(); await db.open()
    clearAll()
    setMsg('Cleared.')
  }
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pt-6 md:pt-10 safe-top safe-x space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy & Data</h1>
      <Card>
        <h3 className="font-medium mb-2">Data export</h3>
        <Button onClick={exportData}>Export My Data</Button>
      </Card>
      <Card>
        <h3 className="font-medium mb-2">Clear data</h3>
        <Button variant="danger" onClick={clearAllData}>Clear All Local Data</Button>
        {msg && <p className="text-xs text-muted mt-2">{msg}</p>}
      </Card>
      <Card>
        <p className="text-sm text-muted">Learning data is stored locally on this device. Uploaded content sent to AI providers is subject to their privacy policies.</p>
      </Card>
    </div>
  )
}
