import { useEffect, useState } from 'react'
import { usePomodoro } from '../hooks/usePomodoro'
import { useSpotify } from '../hooks/useSpotify'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { useAppStore } from '../store/useAppStore'
import PomodoroTimer from '../components/Pomodoro/PomodoroTimer'
import MusicPlayer from '../components/MusicPlayer/MusicPlayer'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import { extractColors } from '../utils/color'

export default function Home({ spotify }: { spotify: ReturnType<typeof useSpotify> }) {
  const pom = usePomodoro()
  const audio = useAudioEngine()
  const settings = useAppStore((s) => s.settings)
  const palette = useAppStore((s) => s.palette)
  const setPalette = useAppStore((s) => s.setPalette)
  const sessions = useAppStore((s) => s.sessions)
  const [demoTrack, setDemoTrack] = useState<any>(null)

  // demo track generator
  useEffect(() => {
    if (!settings.demoMode) { setDemoTrack(null); return }
    const tracks = [
      { name: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', art: 'https://picsum.photos/seed/m83/300/300', duration: 243000 },
      { name: 'Breathe', artist: 'Télépopmusik', album: 'Genetic World', art: 'https://picsum.photos/seed/telepop/300/300', duration: 274000 },
    ]
    let idx = 0
    const update = () => {
      const t = tracks[idx % tracks.length]
      setDemoTrack({ ...t, progress: Math.random() * 0.8, playing: true })
      idx++
    }
    update()
    const i = setInterval(update, 8000)
    return () => clearInterval(i)
  }, [settings.demoMode])

  // extract colors from album art
  useEffect(() => {
    const url = settings.demoMode ? demoTrack?.art : spotify.playback?.item?.album?.images?.[0]?.url
    if (!url) return
    extractColors(url).then((c) => setPalette(c))
  }, [spotify.playback?.item?.album?.images, demoTrack?.art, settings.demoMode, setPalette])

  // ambient background
  const bg = palette
    ? `radial-gradient(1200px 600px at 50% -10%, ${palette.primary}22, transparent 60%), radial-gradient(900px 500px at 80% 100%, ${palette.secondary}18, transparent 60%), #05070d`
    : '#05070d'

  const todaySessions = sessions.filter((s) => new Date(s.startedAt).toDateString() === new Date().toDateString() && s.type === 'focus' && s.completed)

  const playing = settings.demoMode ? (demoTrack?.playing ?? false) : !!spotify.playback?.is_playing

  return (
    <div className="min-h-screen" style={{ background: bg, transition: 'background 1.2s ease' }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10 safe-top safe-x">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">AETHER</h1>
            <p className="text-sm text-muted mt-1">Focus, in rhythm.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {todaySessions.length} sessions today
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="flex flex-col items-center">
            <PomodoroTimer
              remaining={pom.remaining}
              total={pom.total}
              progress={pom.progress}
              running={pom.running}
              type={pom.type}
              typeLabel={pom.type}
              visualizer={settings.visualizer}
              intensity={settings.visualizerIntensity}
              playing={playing}
              palette={palette}
              audioFrame={audio.frame}
              audioSource={audio.mode}
              onStart={pom.start}
              onPause={pom.pause}
              onReset={pom.reset}
              onSkip={pom.skip}
            />
            <div className="flex gap-2 mt-6 flex-wrap justify-center">
              {(['focus', 'shortBreak', 'longBreak'] as const).map((t) => (
                <Button key={t} variant={pom.type === t ? 'primary' : 'secondary'} onClick={() => pom.setType(t as any)}>
                  {t === 'focus' ? 'Focus' : t === 'shortBreak' ? 'Short Break' : 'Long Break'}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <MusicPlayer
              playback={spotify.playback}
              loading={spotify.loading}
              connected={spotify.connected}
              demoMode={settings.demoMode}
              demoTrack={demoTrack}
            />
            <Card>
              <h3 className="text-sm font-medium mb-3">Audio source</h3>
              <p className="text-xs text-muted mb-3">
                Current: <span className="text-ink">{audio.sourceLabel}</span>
                {audio.mode !== 'ambient' && <span className="text-faint"> (real FFT)</span>}
                {audio.mode === 'ambient' && <span className="text-faint"> (demo, not Spotify audio)</span>}
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <Button variant={audio.mode === 'ambient' ? 'primary' : 'secondary'} onClick={() => audio.setMode('ambient')}>Ambient</Button>
                <Button variant={audio.mode === 'mic' ? 'primary' : 'secondary'} onClick={() => audio.setMode('mic')}>Microphone</Button>
                <Button variant={audio.mode === 'webaudio' ? 'primary' : 'secondary'} onClick={() => audio.setMode('webaudio')}>Audio file</Button>
              </div>
              {audio.mode === 'mic' && (
                <p className="text-xs text-muted">
                  {audio.micAvailable ? (audio.micMuted ? 'Mic muted' : 'Mic active') : (audio.error ?? 'Requesting permission…')}
                </p>
              )}
              {audio.mode === 'webaudio' && (
                <div className="space-y-2">
                  <input type="file" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) audio.loadFile(f) }} className="text-xs text-muted" />
                  {audio.fileName && <p className="text-xs text-muted">{audio.fileName}</p>}
                  <div className="flex gap-2">
                    <Button onClick={audio.playFile}>Play</Button>
                    <Button variant="secondary" onClick={audio.pauseFile}>Pause</Button>
                  </div>
                </div>
              )}
              {audio.error && <p className="text-xs text-red-300 mt-2">{audio.error}</p>}
            </Card>
            <Card>
              <h3 className="text-sm font-medium mb-3">Today</h3>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Sessions" value={todaySessions.length} />
                <Stat label="Focus time" value={`${Math.round(todaySessions.reduce((a, s) => a + s.duration, 0) / 60000)}m`} />
                <Stat label="Streak" value={`${computeStreak(sessions)}d`} />
                <Stat label="Mode" value={pom.type === 'focus' ? 'Focus' : 'Break'} />
              </div>
            </Card>
            {spotify.error && (
              <Card>
                <p className="text-xs text-red-300">{spotify.error}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white/5 rounded-2xl p-3">
      <p className="text-[10px] text-muted uppercase tracking-wider">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  )
}

function computeStreak(sessions: any[]): number {
  const days = new Set(sessions.filter((s) => s.type === 'focus' && s.completed).map((s) => new Date(s.startedAt).toDateString()))
  let streak = 0
  const d = new Date()
  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1) }
  return streak
}
