import Card from '../components/UI/Card'

export default function AiSetup() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pt-6 md:pt-10 safe-top safe-x space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">AI Setup & Configuration</h1>
      <Card>
        <h3 className="font-medium mb-2">Gemini (optional)</h3>
        <ol className="list-decimal list-inside text-sm text-muted space-y-1">
          <li>Open Google AI Studio: https://aistudio.google.com/</li>
          <li>Create/obtain an API key (eligibility and terms apply).</li>
          <li>Enter key in Settings → AI → Gemini Configuration.</li>
          <li>Test connection.</li>
          <li>Choose model in Settings → AI → Gemini Model Management.</li>
        </ol>
        <p className="text-xs text-muted mt-3">API quotas, billing, eligibility and terms are controlled by Google. See: https://ai.google.dev/gemini-api/docs, https://ai.google.dev/gemini-api/docs/pricing, https://ai.google.dev/gemini-api/terms, https://ai.google.dev/gemini-api/docs/api-key, https://ai.google.dev/gemini-api/docs/models</p>
      </Card>
      <Card>
        <p className="text-sm text-muted">Core AETHER learning features work without an AI key. AI features are optional and may have provider restrictions (including age/eligibility). Do not attempt to bypass provider restrictions.</p>
      </Card>
    </div>
  )
}
