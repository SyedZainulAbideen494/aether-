import Card from '../components/UI/Card'

export default function Help() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pt-6 md:pt-10 safe-top safe-x space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Help & Setup Guide</h1>
      <Card><h3 className="font-medium mb-2">Getting Started</h3><p className="text-sm text-muted">Navigate via sidebar/bottom nav. Open learning sections. Use interactive simulations. Progress saves locally.</p></Card>
      <Card><h3 className="font-medium mb-2">Flashcards</h3><p className="text-sm text-muted">Create decks, upload PDFs/images, generate cards, edit, review with swipe, export/import JSON.</p></Card>
      <Card><h3 className="font-medium mb-2">Quizzes</h3><p className="text-sm text-muted">Generate MCQ quizzes from topics/decks. Review results and weak concepts.</p></Card>
      <Card><h3 className="font-medium mb-2">AI Explain</h3><p className="text-sm text-muted">Request explanations in multiple modes. Generate PDF. Save explanations. Import flashcard decks/cards.</p></Card>
      <Card><h3 className="font-medium mb-2">Privacy</h3><p className="text-sm text-muted">Data stays on device. AI requests send selected content to provider. Clear data in Settings → Privacy & Data.</p></Card>
    </div>
  )
}
