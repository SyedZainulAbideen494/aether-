export type AudioProviderType = 'ambient' | 'webaudio' | 'mic'

export interface AudioFrame {
  spectrum: Float32Array
  waveform: Float32Array
  bass: number
  mid: number
  treble: number
  rms: number
  spectralFlux: number
  beat: boolean
  beatStrength: number
  timestamp: number
}

export interface AudioEngineState {
  mode: AudioProviderType
  running: boolean
  micAvailable: boolean
  micMuted: boolean
  fileName: string | null
  error: string | null
}
