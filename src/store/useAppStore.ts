import { create } from 'zustand'
import { load, save } from '../utils/storage'
import type { TimerSettings, SessionRecord, SpotifyConfig, SpotifyTokens, AppSettings } from '../types'

const defaultTimer: TimerSettings = {
  focus: 25, shortBreak: 5, longBreak: 15, longBreakEvery: 4,
  autoStartBreaks: false, autoStartFocus: false, soundEnabled: true,
}
const defaultSettings: AppSettings = {
  theme: 'dark', visualizer: 'spectrum', visualizerIntensity: 0.7,
  reducedMotion: false, notifications: true, ambientSound: 'none', ambientVolume: 0.4, demoMode: false, geminiApiKey: '', geminiModel: 'gemini-2.5-flash',
}

interface State {
  timer: TimerSettings
  sessions: SessionRecord[]
  spotifyConfig: SpotifyConfig
  spotifyTokens: SpotifyTokens | null
  settings: AppSettings
  palette: { primary: string; secondary: string; accent: string } | null
  setTimer: (t: Partial<TimerSettings>) => void
  addSession: (s: SessionRecord) => void
  clearSessions: () => void
  setSpotifyConfig: (c: SpotifyConfig) => void
  setSpotifyTokens: (t: SpotifyTokens | null) => void
  setSettings: (s: Partial<AppSettings>) => void
  setPalette: (p: { primary: string; secondary: string; accent: string } | null) => void
  clearAll: () => void
  // pomodoro global state
  pomType: 'focus' | 'shortBreak' | 'longBreak'
  pomRunning: boolean
  pomEndAt: number | null
  pomRemaining: number
  pomTotal: number
  pomCompletedCount: number
  setPomType: (t: 'focus' | 'shortBreak' | 'longBreak') => void
  setPomRunning: (v: boolean) => void
  setPomEndAt: (v: number | null) => void
  setPomRemaining: (v: number) => void
  setPomTotal: (v: number) => void
  setPomCompletedCount: (v: number) => void
}

export const useAppStore = create<State>((set, get) => ({
  timer: load('timer', defaultTimer),
  sessions: load('sessions', [] as SessionRecord[]),
  spotifyConfig: load('spotifyConfig', { clientId: '', redirectUri: window.location.origin + '/callback' } as SpotifyConfig),
  spotifyTokens: load('spotifyTokens', null as SpotifyTokens | null),
  settings: load('settings', defaultSettings),
  palette: load('palette', null as any),
  pomType: 'focus',
  pomRunning: false,
  pomEndAt: null,
  pomRemaining: 25*60*1000,
  pomTotal: 25*60*1000,
  pomCompletedCount: 0,
  setTimer: (t) => {
    const next = { ...get().timer, ...t }
    save('timer', next)
    set({ timer: next })
  },
  addSession: (s) => {
    const next = [s, ...get().sessions].slice(0, 500)
    save('sessions', next)
    set({ sessions: next })
  },
  clearSessions: () => { save('sessions', []); set({ sessions: [] }) },
  setSpotifyConfig: (c) => { save('spotifyConfig', c); set({ spotifyConfig: c }) },
  setSpotifyTokens: (t) => { save('spotifyTokens', t); set({ spotifyTokens: t }) },
  setSettings: (s) => {
    const next = { ...get().settings, ...s }
    save('settings', next)
    set({ settings: next })
  },
  setPalette: (p) => { save('palette', p); set({ palette: p }) },
  clearAll: () => {
    Object.keys(localStorage).forEach((k) => { if (k.startsWith('aether:')) localStorage.removeItem(k) })
    set({
      timer: defaultTimer, sessions: [], spotifyConfig: { clientId: '', redirectUri: window.location.origin + '/callback' },
      spotifyTokens: null, settings: defaultSettings, palette: null,
    })
  },
  setPomType: (t) => set({ pomType: t }),
  setPomRunning: (v) => set({ pomRunning: v }),
  setPomEndAt: (v) => set({ pomEndAt: v }),
  setPomRemaining: (v) => set({ pomRemaining: v }),
  setPomTotal: (v) => set({ pomTotal: v }),
  setPomCompletedCount: (v) => set({ pomCompletedCount: v }),
}))
