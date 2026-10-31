import type { AudioFrame, AudioProviderType } from '../../types/audio'

const FFT_SIZE = 2048
const SMOOTHING = 0.8

export class AudioEngine {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private sourceNode: AudioNode | null = null
  private mediaEl: HTMLAudioElement | null = null
  private stream: MediaStream | null = null
  private objectUrl: string | null = null

  mode: AudioProviderType = 'ambient'
  micAvailable = false
  micMuted = false
  fileName: string | null = null
  error: string | null = null

  private prevSpectrum: Float32Array = new Float32Array(0)
  private beatThreshold = 0.3
  private lastBeat = 0
  private smoothed = { bass: 0, mid: 0, treble: 0, rms: 0 }
  private ambientT = 0

  async initContext(): Promise<AudioContext | null> {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (e) {
        this.error = 'AudioContext unavailable'
        return null
      }
    }
    if (this.ctx.state === 'suspended') {
      try { await this.ctx.resume() } catch {}
    }
    return this.ctx
  }

  async setMode(mode: AudioProviderType): Promise<void> {
    await this.stop()
    this.mode = mode
    this.error = null
    if (mode === 'webaudio') {
      await this.initContext()
    } else if (mode === 'mic') {
      await this.startMic()
    }
  }

  async startMic(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.stream = stream
      const track = stream.getAudioTracks()[0]
      this.micAvailable = !!track
      this.micMuted = track?.muted ?? false
      track.onmute = () => { this.micMuted = true }
      track.onunmute = () => { this.micMuted = false }
      const ctx = await this.initContext()
      if (!ctx) return
      this.analyser = ctx.createAnalyser()
      this.analyser.fftSize = FFT_SIZE
      this.analyser.smoothingTimeConstant = SMOOTHING
      const src = ctx.createMediaStreamSource(stream)
      src.connect(this.analyser)
      this.sourceNode = src
    } catch (e: any) {
      this.micAvailable = false
      this.error = e?.name === 'NotAllowedError' ? 'Microphone permission denied' : 'Microphone unavailable'
    }
  }

  loadFile(file: File): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl)
    this.objectUrl = URL.createObjectURL(file)
    this.fileName = file.name
    const audio = new Audio()
    audio.src = this.objectUrl
    audio.crossOrigin = 'anonymous'
    audio.loop = true
    this.mediaEl = audio
    // connect lazily when playing
  }

  async playFile(): Promise<void> {
    if (!this.mediaEl) return
    const ctx = await this.initContext()
    if (!ctx || !this.analyser) {
      this.analyser = ctx!.createAnalyser()
      this.analyser.fftSize = FFT_SIZE
      this.analyser.smoothingTimeConstant = SMOOTHING
    }
    if (!this.sourceNode && this.mediaEl) {
      try {
        const src = ctx!.createMediaElementSource(this.mediaEl)
        src.connect(this.analyser!)
        this.analyser!.connect(ctx!.destination)
        this.sourceNode = src
      } catch (e) {
        this.error = 'Failed to connect audio source'
      }
    }
    try { await this.mediaEl.play() } catch (e: any) { this.error = 'Playback failed' }
  }

  pauseFile(): void {
    this.mediaEl?.pause()
  }

  async stop(): Promise<void> {
    this.mediaEl?.pause()
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }
    if (this.sourceNode) {
      try { this.sourceNode.disconnect() } catch {}
      this.sourceNode = null
    }
    if (this.analyser) {
      try { this.analyser.disconnect() } catch {}
      this.analyser = null
    }
    this.micAvailable = false
    this.micMuted = false
  }

  async resumeContext(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      try { await this.ctx.resume() } catch {}
    }
  }

  getFrame(): AudioFrame {
    if (this.mode === 'ambient') return this.ambientFrame()
    if (!this.analyser) return this.silentFrame()
    const bins = this.analyser.frequencyBinCount
    const freq = new Uint8Array(bins)
    const time = new Uint8Array(this.analyser.fftSize)
    this.analyser.getByteFrequencyData(freq)
    this.analyser.getByteTimeDomainData(time)

    const spectrum = new Float32Array(bins)
    for (let i = 0; i < bins; i++) spectrum[i] = freq[i] / 255

    // bass/mid/treble
    const bassEnd = Math.floor(bins * 0.08)
    const midEnd = Math.floor(bins * 0.4)
    let bass = 0, mid = 0, treble = 0, bassN = 0, midN = 0, trebleN = 0
    for (let i = 0; i < bins; i++) {
      if (i < bassEnd) { bass += spectrum[i]; bassN++ }
      else if (i < midEnd) { mid += spectrum[i]; midN++ }
      else { treble += spectrum[i]; trebleN++ }
    }
    bass = bassN ? bass / bassN : 0
    mid = midN ? mid / midN : 0
    treble = trebleN ? treble / trebleN : 0

    // RMS
    let sum = 0
    for (let i = 0; i < time.length; i++) {
      const v = (time[i] - 128) / 128
      sum += v * v
    }
    const rms = Math.sqrt(sum / time.length)

    // spectral flux
    let flux = 0
    if (this.prevSpectrum.length === bins) {
      for (let i = 0; i < bins; i++) {
        const d = spectrum[i] - this.prevSpectrum[i]
        if (d > 0) flux += d
      }
    }
    this.prevSpectrum = new Float32Array(spectrum)

    // smoothing (attack/release)
    const attack = 0.35, release = 0.08
    this.smoothed.bass += (bass > this.smoothed.bass ? attack : release) * (bass - this.smoothed.bass)
    this.smoothed.mid += (mid > this.smoothed.mid ? attack : release) * (mid - this.smoothed.mid)
    this.smoothed.treble += (treble > this.smoothed.treble ? attack : release) * (treble - this.smoothed.treble)
    this.smoothed.rms += (rms > this.smoothed.rms ? attack : release) * (rms - this.smoothed.rms)

    // beat detection
    const now = performance.now()
    const threshold = this.beatThreshold
    let beat = false
    let beatStrength = 0
    if (flux > threshold && now - this.lastBeat > 250) {
      beat = true
      beatStrength = Math.min(1, flux * 2)
      this.lastBeat = now
    }
    // adaptive threshold
    this.beatThreshold = this.beatThreshold * 0.95 + flux * 0.05 * 1.6
    this.beatThreshold = Math.max(0.05, Math.min(0.6, this.beatThreshold))

    const waveform = new Float32Array(time.length)
    for (let i = 0; i < time.length; i++) waveform[i] = (time[i] - 128) / 128

    return {
      spectrum,
      waveform,
      bass: this.smoothed.bass,
      mid: this.smoothed.mid,
      treble: this.smoothed.treble,
      rms: this.smoothed.rms,
      spectralFlux: flux,
      beat,
      beatStrength,
      timestamp: now,
    }
  }

  private silentFrame(): AudioFrame {
    return {
      spectrum: new Float32Array(64),
      waveform: new Float32Array(128),
      bass: 0, mid: 0, treble: 0, rms: 0, spectralFlux: 0,
      beat: false, beatStrength: 0, timestamp: performance.now(),
    }
  }

  private ambientFrame(): AudioFrame {
    this.ambientT += 0.016
    const t = this.ambientT
    const N = 64
    const spectrum = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      spectrum[i] = (Math.sin(t * 1.3 + i * 0.4) * 0.5 + 0.5) * 0.35 + (Math.sin(t * 0.7 + i * 0.1) * 0.5 + 0.5) * 0.15
    }
    const bass = 0.3 + Math.sin(t * 0.9) * 0.15
    const mid = 0.25 + Math.sin(t * 1.4) * 0.1
    const treble = 0.2 + Math.sin(t * 2.1) * 0.1
    const rms = (bass + mid + treble) / 3
    const beat = (Math.sin(t * 2) > 0.92)
    return {
      spectrum, waveform: new Float32Array(128),
      bass, mid, treble, rms, spectralFlux: 0,
      beat, beatStrength: beat ? 0.8 : 0, timestamp: performance.now(),
    }
  }
}
