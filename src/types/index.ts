export type SessionType = 'focus' | 'shortBreak' | 'longBreak'

export interface TimerSettings {
  focus: number
  shortBreak: number
  longBreak: number
  longBreakEvery: number
  autoStartBreaks: boolean
  autoStartFocus: boolean
  soundEnabled: boolean
}

export interface SessionRecord {
  id: string
  type: SessionType
  startedAt: number
  endedAt: number
  duration: number
  completed: boolean
}

export interface SpotifyConfig {
  clientId: string
  redirectUri: string
}

export interface SpotifyTokens {
  accessToken: string
  refreshToken: string | null
  expiresAt: number
  scope: string
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: { name: string; images: { url: string; width: number; height: number }[] }
  duration_ms: number
  external_urls: { spotify: string }
  type: string
}

export interface SpotifyPlayback {
  is_playing: boolean
  progress_ms: number
  item: SpotifyTrack | null
  device?: { id: string; name: string; type: string; volume_percent: number }
  currently_playing_type?: string
  timestamp?: number
}

export type VisualizerStyle = 'spectrum' | 'waveform' | 'equalizer' | 'particles' | 'rings'

export interface AppSettings {
  theme: 'dark' | 'light' | 'system'
  visualizer: VisualizerStyle
  visualizerIntensity: number
  reducedMotion: boolean
  notifications: boolean
  ambientSound: 'none' | 'rain' | 'brown' | 'white' | 'fire' | 'ocean'
  ambientVolume: number
  demoMode: boolean
  geminiApiKey: string
  geminiModel: string
}

export interface PersistedState {
  timer: TimerSettings
  sessions: SessionRecord[]
  spotifyConfig: SpotifyConfig
  spotifyTokens: SpotifyTokens | null
  settings: AppSettings
  palette: { primary: string; secondary: string; accent: string } | null
}
