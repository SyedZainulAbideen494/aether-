import { useEffect, useState } from 'react'
import { modelManager } from '../../services/gemini/modelManager'
import { useAppStore } from '../../store/useAppStore'
import Card from '../UI/Card'
import Button from '../UI/Button'
import Input from '../UI/Input'

const FEATURES = ['general', 'flashcards', 'quiz', 'explain', 'pan', 'pdf', 'image', 'adaptive', 'remedial', 'planner']

export default function ModelManager() {
  const apiKey = useAppStore((s) => s.settings.geminiApiKey)
  const [models, setModels] = useState<any[]>(modelManager.getModels())
  const [search, setSearch] = useState('')
  const [filter] = useState("all")
  const [discovering, setDiscovering] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, string>>({})
  const [prefs, setPrefs] = useState(modelManager.getAllPrefs())
  const [activity] = useState(modelManager.getActivity())

  useEffect(() => { modelManager.setApiKey(apiKey) }, [apiKey])

  const refresh = async () => {
    if (!apiKey) return
    setDiscovering(true)
    try {
      modelManager.setApiKey(apiKey)
      const m = await modelManager.discover(true)
      setModels(m)
    } catch (e: any) { alert(e?.message ?? 'Discovery failed') }
    finally { setDiscovering(false) }
  }

  const test = async (id: string) => {
    setTesting(id)
    const r = await modelManager.testModel(id)
    setTestResults((t) => ({ ...t, [id]: r.ok ? `OK ${r.ms}ms` : `FAIL ${r.error ?? ''}` }))
    setModels([...modelManager.getModels()])
    setTesting(null)
  }

  const updatePref = (feature: string, field: 'primary' | 'fallbacks' | 'autoFailover', value: any) => {
    const p = { ...prefs[feature], [field]: value }
    modelManager.setPrefs(feature, p)
    setPrefs(modelManager.getAllPrefs())
  }

  const toggleFallback = (feature: string, id: string) => {
    const p = prefs[feature]
    const fb = p.fallbacks.includes(id) ? p.fallbacks.filter((x) => x !== id) : [...p.fallbacks, id]
    updatePref(feature, 'fallbacks', fb)
  }

  const reset = () => { modelManager.resetPrefs(); setPrefs(modelManager.getAllPrefs()) }

  const filtered = models.filter((m) => {
    if (search && !m.id.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'text') return m.supportedGenerationMethods?.includes('generateContent')
    return true
  })

  return (
    <Card>
      <h3 className="text-sm font-medium mb-4">Gemini Model Management</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={refresh} disabled={discovering || !apiKey}>{discovering ? 'Discovering…' : 'Refresh Models'}</Button>
        <Button variant="secondary" onClick={reset}>Reset Preferences</Button>
      </div>
      <p className="text-xs text-muted mb-3">Discovered: {models.length} models. Last refresh cached locally.</p>
      <Input label="Search models" value={search} onChange={setSearch} />
      <div className="mt-3 space-y-2 max-h-60 overflow-y-auto no-scrollbar">
        {filtered.map((m) => (
          <div key={m.id} className="flex items-center justify-between text-xs py-2 border-b border-line">
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{m.displayName || m.id}</p>
              <p className="text-faint truncate">{m.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-faint">{testResults[m.id] ?? m.status ?? ''}</span>
              <Button variant="secondary" onClick={() => test(m.id)} disabled={testing === m.id}>{testing === m.id ? '…' : 'Test'}</Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-xs text-faint">No models. Enter API key and refresh.</p>}
      </div>

      <h4 className="text-sm font-medium mt-6 mb-3">Per-feature model preferences</h4>
      <div className="space-y-3">
        {FEATURES.map((f) => (
          <div key={f} className="bg-white/5 rounded-xl p-3">
            <p className="text-xs font-medium mb-2 capitalize">{f}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select value={prefs[f]?.primary ?? ''} onChange={(e) => updatePref(f, 'primary', e.target.value)} className="bg-white/5 border border-line rounded-xl px-2 py-1.5 text-xs">
                <option value="">Primary</option>
                {models.map((m) => <option key={m.id} value={m.id}>{m.id}</option>)}
              </select>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={prefs[f]?.autoFailover ?? true} onChange={(e) => updatePref(f, 'autoFailover', e.target.checked)} />
                Auto failover
              </label>
            </div>
            <div className="mt-2">
              <p className="text-[10px] text-faint mb-1">Fallbacks:</p>
              <div className="flex flex-wrap gap-1">
                {models.map((m) => (
                  <button key={m.id} onClick={() => toggleFallback(f, m.id)}
                    className={`px-2 py-0.5 rounded text-[10px] ${prefs[f]?.fallbacks?.includes(m.id) ? 'bg-accent text-white' : 'bg-white/5 text-muted'}`}>
                    {m.id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <h4 className="text-sm font-medium mt-6 mb-3">Activity log</h4>
      <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar text-xs">
        {activity.slice(0, 20).map((a) => (
          <div key={a.id} className="border-b border-line py-1">
            <span className="text-muted">{new Date(a.timestamp).toLocaleTimeString()}</span> · {a.feature} · {a.used} {a.fallback ? '(fallback)' : ''} · {a.success ? 'OK' : 'FAIL'} · {a.durationMs}ms
          </div>
        ))}
        {activity.length === 0 && <p className="text-faint">No activity yet.</p>}
      </div>
    </Card>
  )
}
