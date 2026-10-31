import { useEffect, useRef, useState, useCallback } from 'react'
import { AudioEngine } from '../services/audio/AudioEngine'
import type { AudioFrame, AudioProviderType } from '../types/audio'

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine | null>(null)
  if (!engineRef.current) engineRef.current = new AudioEngine()
  const engine = engineRef.current

  const [mode, setModeState] = useState<AudioProviderType>('ambient')
  const [frame, setFrame] = useState<AudioFrame | null>(null)
  const [running, setRunning] = useState(true)
  const [fileName, setFileName] = useState<string | null>(null)
  const [micAvailable, setMicAvailable] = useState(false)
  const [micMuted, setMicMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rafRef = useRef<number | null>(null)

  const tick = useCallback(() => {
    const f = engine.getFrame()
    setFrame(f)
    setMicAvailable(engine.micAvailable)
    setMicMuted(engine.micMuted)
    setError(engine.error)
    setFileName(engine.fileName)
    rafRef.current = requestAnimationFrame(tick)
  }, [engine])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    const onVis = () => {
      if (document.visibilityState === 'visible') engine.resumeContext()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [tick, engine])

  const setMode = useCallback(async (m: AudioProviderType) => {
    await engine.setMode(m)
    setModeState(m)
  }, [engine])

  const loadFile = useCallback((file: File) => {
    engine.loadFile(file)
    setFileName(file.name)
  }, [engine])

  const playFile = useCallback(async () => {
    await engine.playFile()
  }, [engine])

  const pauseFile = useCallback(() => {
    engine.pauseFile()
  }, [engine])

  const resume = useCallback(() => engine.resumeContext(), [engine])

  // user gesture resume
  useEffect(() => {
    const handler = () => { engine.resumeContext() }
    window.addEventListener('click', handler, { once: true })
    window.addEventListener('touchstart', handler, { once: true })
    return () => {
      window.removeEventListener('click', handler)
      window.removeEventListener('touchstart', handler)
    }
  }, [engine])

  const sourceLabel = mode === 'ambient' ? 'Ambient (demo)' : mode === 'mic' ? 'Microphone' : 'Audio file'

  return {
    mode, setMode, frame, running, setRunning, fileName, loadFile, playFile, pauseFile,
    micAvailable, micMuted, error, sourceLabel, resume,
  }
}
