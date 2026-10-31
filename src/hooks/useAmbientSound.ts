import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'

export function useAmbientSound() {
  const settings = useAppStore((s) => s.settings)
  const ctxRef = useRef<AudioContext | null>(null)
  const nodesRef = useRef<any>(null)

  useEffect(() => {
    // cleanup previous
    if (nodesRef.current) {
      try { nodesRef.current.stop?.() } catch {}
      nodesRef.current = null
    }
    if (settings.ambientSound === 'none') return
    const ctx = ctxRef.current ?? new (window.AudioContext || (window as any).webkitAudioContext)()
    ctxRef.current = ctx
    const gain = ctx.createGain()
    gain.gain.value = settings.ambientVolume * 0.3
    gain.connect(ctx.destination)

    let stopFn = () => {}
    if (settings.ambientSound === 'white' || settings.ambientSound === 'brown') {
      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      let last = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        if (settings.ambientSound === 'brown') {
          data[i] = (last + 0.02 * white) / 1.02
          last = data[i]
          data[i] *= 3.5
        } else {
          data[i] = white
        }
      }
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      src.connect(gain)
      src.start()
      stopFn = () => { try { src.stop() } catch {} }
    } else {
      // filtered noise for rain/fire/ocean
      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = settings.ambientSound === 'fire' ? 'bandpass' : 'lowpass'
      filter.frequency.value = settings.ambientSound === 'ocean' ? 400 : settings.ambientSound === 'rain' ? 1200 : 800
      src.connect(filter).connect(gain)
      src.start()
      stopFn = () => { try { src.stop() } catch {} }
    }
    nodesRef.current = { stop: stopFn }
    return () => { stopFn() }
  }, [settings.ambientSound, settings.ambientVolume])

  // volume update
  useEffect(() => {}, [])
}
