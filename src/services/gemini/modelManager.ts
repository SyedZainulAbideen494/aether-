import { GoogleGenAI } from '@google/genai'
import type { GeminiModelInfo, ModelPrefs, FeatureModelPrefs, ModelActivity } from '../../types/models'

const CACHE_KEY = 'aether:gemini-models-cache'
const PREFS_KEY = 'aether:gemini-model-prefs'
const ACTIVITY_KEY = 'aether:gemini-activity'
const CACHE_TTL = 24 * 60 * 60 * 1000

const FEATURES = ['general', 'flashcards', 'quiz', 'explain', 'pan', 'pdf', 'image', 'adaptive', 'remedial', 'planner']

const DEFAULT_PREFS: FeatureModelPrefs = {}
for (const f of FEATURES) {
  DEFAULT_PREFS[f] = { primary: 'gemini-2.5-flash', fallbacks: ['gemini-2.5-flash-lite', 'gemini-1.5-flash'], autoFailover: true }
}

export class GeminiModelManager {
  private apiKey = ''
  private models: GeminiModelInfo[] = []
  private prefs: FeatureModelPrefs = { ...DEFAULT_PREFS }
  private activity: ModelActivity[] = []

  constructor() {
    this.loadPrefs()
    this.loadActivity()
    const cached = this.loadCache()
    if (cached) this.models = cached
  }

  setApiKey(k: string) { this.apiKey = k }

  loadPrefs() {
    try { const r = localStorage.getItem(PREFS_KEY); if (r) this.prefs = { ...DEFAULT_PREFS, ...JSON.parse(r) } } catch {}
  }
  savePrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(this.prefs)) } catch {} }

  loadActivity() {
    try { const r = localStorage.getItem(ACTIVITY_KEY); if (r) this.activity = JSON.parse(r) } catch {}
  }
  saveActivity() { try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(this.activity.slice(-200))) } catch {} }

  loadCache(): GeminiModelInfo[] | null {
    try {
      const r = localStorage.getItem(CACHE_KEY)
      if (!r) return null
      const { ts, data } = JSON.parse(r)
      if (Date.now() - ts > CACHE_TTL) return null
      return data
    } catch { return null }
  }
  saveCache(data: GeminiModelInfo[]) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })) } catch {}
  }

  async discover(force = false): Promise<GeminiModelInfo[]> {
    if (!this.apiKey) throw new Error('API key missing')
    if (!force) {
      const cached = this.loadCache()
      if (cached) { this.models = cached; return cached }
    }
    const all: any[] = []
    let pageToken: string | undefined
    do {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?pageSize=100${pageToken ? '&pageToken=' + pageToken : ''}&key=${this.apiKey}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Discovery failed: ${res.status}`)
      const json = await res.json()
      all.push(...(json.models || []))
      pageToken = json.nextPageToken
    } while (pageToken)

    const mapped: GeminiModelInfo[] = all.map((m: any) => ({
      name: m.name,
      id: (m.name || '').replace(/^models\//, ''),
      displayName: m.displayName,
      description: m.description,
      inputTokenLimit: m.inputTokenLimit,
      outputTokenLimit: m.outputTokenLimit,
      supportedGenerationMethods: m.supportedGenerationMethods,
      status: 'available',
    }))
    this.models = mapped
    this.saveCache(mapped)
    return mapped
  }

  getModels() { return this.models }

  getPrefs(feature: string): ModelPrefs {
    return this.prefs[feature] || { primary: 'gemini-2.5-flash', fallbacks: [], autoFailover: true }
  }
  setPrefs(feature: string, p: ModelPrefs) { this.prefs[feature] = p; this.savePrefs() }
  getAllPrefs() { return this.prefs }
  setAllPrefs(p: FeatureModelPrefs) { this.prefs = { ...DEFAULT_PREFS, ...p }; this.savePrefs() }

  getActivity() { return this.activity }

  async testModel(modelId: string): Promise<{ ok: boolean; ms: number; error?: string }> {
    if (!this.apiKey) return { ok: false, ms: 0, error: 'No API key' }
    const t0 = Date.now()
    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey })
      const res = await ai.models.generateContent({ model: modelId, contents: 'Reply with OK' })
      const ms = Date.now() - t0
      const ok = !!(res.text && res.text.trim())
      const m = this.models.find((x) => x.id === modelId)
      if (m) { m.status = ok ? (ms > 5000 ? 'slow' : 'working') : 'failed'; m.lastTestMs = ms; m.lastTestAt = Date.now() }
      return { ok, ms }
    } catch (e: any) {
      const ms = Date.now() - t0
      const m = this.models.find((x) => x.id === modelId)
      if (m) { m.status = 'failed'; m.lastTestMs = ms; m.lastTestAt = Date.now() }
      return { ok: false, ms, error: e?.message ?? String(e) }
    }
  }

  private isRetryable(err: any): boolean {
    const msg = String(err?.message ?? err)
    return /503|502|504|429|UNAVAILABLE|high demand|network/i.test(msg)
  }
  private isAuth(err: any): boolean {
    const msg = String(err?.message ?? err)
    return /401|403|permission|unauthorized|invalid.*key/i.test(msg)
  }

  async generate(feature: string, apiKey: string, params: { contents: any; config?: any }): Promise<{ text: string; model: string }> {
    this.apiKey = apiKey
    const pref = this.getPrefs(feature)
    const modelsToTry = [pref.primary, ...pref.fallbacks].filter(Boolean)
    // filter to discovered models if available
    const discoveredIds = this.models.map((m) => m.id)
    const candidates = discoveredIds.length ? modelsToTry.filter((m) => discoveredIds.includes(m)) : modelsToTry
    const tryList = candidates.length ? candidates : modelsToTry

    let lastErr: any
    let retries = 0
    for (const modelId of tryList) {
      const t0 = Date.now()
      try {
        const ai = new GoogleGenAI({ apiKey })
        const res = await ai.models.generateContent({ model: modelId, contents: params.contents, config: params.config })
        const text = res.text ?? ''
        if (!text.trim()) throw new Error('Empty response')
        const duration = Date.now() - t0
        this.logActivity({ feature, primary: pref.primary, used: modelId, fallback: modelId !== pref.primary, retries, durationMs: duration, success: true })
        return { text, model: modelId }
      } catch (e: any) {
        lastErr = e
        retries++
        if (this.isAuth(e)) {
          this.logActivity({ feature, primary: pref.primary, used: modelId, fallback: modelId !== pref.primary, retries, durationMs: Date.now() - t0, success: false, error: e?.message })
          throw e // don't try others on auth
        }
        if (!this.isRetryable(e)) {
          // try next model anyway
        }
        if (!pref.autoFailover) break
      }
    }
    this.logActivity({ feature, primary: pref.primary, used: tryList[tryList.length - 1] || '', fallback: true, retries, durationMs: 0, success: false, error: lastErr?.message })
    throw lastErr ?? new Error('All models failed')
  }

  private logActivity(partial: Omit<ModelActivity, 'id' | 'timestamp'>) {
    const entry: ModelActivity = { id: crypto.randomUUID(), timestamp: Date.now(), ...partial }
    this.activity.unshift(entry)
    this.activity = this.activity.slice(0, 200)
    this.saveActivity()
  }

  resetPrefs() {
    this.prefs = { ...DEFAULT_PREFS }
    this.savePrefs()
  }
}

export const modelManager = new GeminiModelManager()
