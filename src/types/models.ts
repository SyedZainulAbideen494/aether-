export interface GeminiModelInfo {
  name: string // models/...
  displayName?: string
  description?: string
  inputTokenLimit?: number
  outputTokenLimit?: number
  supportedGenerationMethods?: string[]
  temperature?: number
  topP?: number
  topK?: number
  // derived
  id: string // without models/ prefix
  family?: string
  capabilities?: string[]
  status?: 'available' | 'testing' | 'working' | 'slow' | 'unavailable' | 'permission_denied' | 'unsupported' | 'deprecated' | 'failed'
  lastTestMs?: number
  lastTestAt?: number
}

export interface ModelPrefs {
  primary: string
  fallbacks: string[]
  autoFailover: boolean
}

export interface FeatureModelPrefs {
  [feature: string]: ModelPrefs
}

export interface ModelActivity {
  id: string
  timestamp: number
  feature: string
  primary: string
  used: string
  fallback: boolean
  error?: string
  retries: number
  durationMs: number
  success: boolean
}
