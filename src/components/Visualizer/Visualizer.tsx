import { useRef, useEffect } from 'react'
import type { VisualizerStyle } from '../../types'
import type { AudioFrame } from '../../types/audio'

interface Props {
  style: VisualizerStyle
  intensity: number
  playing: boolean
  progress: number
  palette: { primary: string; secondary: string; accent: string } | null
  size?: number
  frame?: AudioFrame | null
  source?: 'ambient' | 'webaudio' | 'mic'
}

export default function Visualizer({ style, intensity, playing, progress, palette, size = 320, frame, source }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ t: 0, beatPulse: 0 })

  const real = source !== 'ambient' && !!frame

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = size + 'px'
    canvas.style.height = size + 'px'
    ctx.scale(dpr, dpr)

    const primary = palette?.primary ?? '#7c5cff'
    const secondary = palette?.secondary ?? '#4aa8ff'
    const accent = palette?.accent ?? '#9b6bff'

    let raf = 0
    const render = () => {
      stateRef.current.t += playing ? 0.016 : 0.004
      const t = stateRef.current.t
      if (frame?.beat) stateRef.current.beatPulse = 1
      stateRef.current.beatPulse *= 0.88
      const bp = stateRef.current.beatPulse
      ctx.clearRect(0, 0, size, size)
      const cx = size / 2, cy = size / 2
      const baseR = size * 0.26

      const spec = frame?.spectrum
      const bass = frame?.bass ?? 0
      const treble = frame?.treble ?? 0

      if (style === 'spectrum') {
        const N = 72
        for (let i = 0; i < N; i++) {
          const ang = (i / N) * Math.PI * 2 - Math.PI / 2
          let v = 0
          if (real && spec) {
            const idx = Math.floor((i / N) * spec.length)
            v = spec[idx] * intensity
          } else {
            v = (Math.sin(t * 2 + i * 0.3) * 0.5 + 0.5) * (playing ? 1 : 0.25) * intensity
          }
          const h = 8 + v * 52 + bp * 12
          const x1 = cx + Math.cos(ang) * baseR
          const y1 = cy + Math.sin(ang) * baseR
          const x2 = cx + Math.cos(ang) * (baseR + h)
          const y2 = cy + Math.sin(ang) * (baseR + h)
          const grad = ctx.createLinearGradient(x1, y1, x2, y2)
          grad.addColorStop(0, primary + 'cc')
          grad.addColorStop(1, secondary + '22')
          ctx.strokeStyle = grad
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
        }
      } else if (style === 'waveform') {
        const N = 200
        // outer bass ring
        const bassR = baseR + 28 + bass * 30 * intensity + bp * 18
        ctx.beginPath()
        ctx.arc(cx, cy, bassR, 0, Math.PI * 2)
        ctx.strokeStyle = primary + '66'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.beginPath()
        for (let i = 0; i <= N; i++) {
          const ang = (i / N) * Math.PI * 2
          let v = 0
          if (real && frame?.waveform?.length) {
            const wi = Math.floor((i / N) * frame.waveform.length)
            v = frame.waveform[wi] * 30 * intensity
          } else {
            v = Math.sin(t * 3 + i * 0.15) * (playing ? 18 : 4) * intensity + Math.sin(t * 1.7 + i * 0.07) * 8
          }
          const r = baseR + v
          const x = cx + Math.cos(ang) * r
          const y = cy + Math.sin(ang) * r
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.strokeStyle = primary
        ctx.lineWidth = 1.5
        ctx.stroke()
      } else if (style === 'equalizer') {
        const N = 24
        const barW = (size * 0.7) / N
        const startX = (size - N * barW) / 2
        for (let i = 0; i < N; i++) {
          let v = 0
          if (real && spec) {
            const idx = Math.floor((i / N) * spec.length)
            v = spec[idx] * intensity
          } else {
            v = (Math.sin(t * 2 + i * 0.5) * 0.5 + 0.5) * (playing ? 1 : 0.2) * intensity
          }
          const h = 10 + v * (size * 0.35) + bp * 8
          const x = startX + i * barW + 2
          const y = cy + baseR * 0.5 - h
          const grad = ctx.createLinearGradient(x, y, x, y + h)
          grad.addColorStop(0, primary)
          grad.addColorStop(1, secondary + '44')
          ctx.fillStyle = grad
          ctx.fillRect(x, y, barW - 4, h)
        }
      } else if (style === 'particles') {
        const N = 70
        for (let i = 0; i < N; i++) {
          const ang = (i / N) * Math.PI * 2 + t * 0.3
          const rad = baseR + Math.sin(t + i) * 30 * intensity + treble * 20
          const x = cx + Math.cos(ang) * rad
          const y = cy + Math.sin(ang) * rad
          const r = 1.5 + (Math.sin(t * 2 + i) * 0.5 + 0.5) * 2.5 + bp * 3
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.fillStyle = i % 2 === 0 ? primary : secondary
          ctx.globalAlpha = 0.5 + (Math.sin(t + i) * 0.5 + 0.5) * 0.5
          ctx.fill()
          ctx.globalAlpha = 1
        }
      } else if (style === 'rings') {
        for (let k = 0; k < 4; k++) {
          const r = baseR - 20 + k * 18 + Math.sin(t * 1.5 + k) * 6 * intensity + (k === 0 ? bass * 18 : 0) + bp * 10
          ctx.beginPath()
          ctx.arc(cx, cy, r, 0, Math.PI * 2)
          ctx.strokeStyle = k % 2 === 0 ? primary + 'aa' : secondary + '66'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
      }

      // beat pulse ring
      if (bp > 0.05) {
        ctx.beginPath()
        ctx.arc(cx, cy, baseR + 40 + (1 - bp) * 20, 0, Math.PI * 2)
        ctx.strokeStyle = accent + Math.round(bp * 120).toString(16).padStart(2, '0')
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // progress arc
      ctx.beginPath()
      ctx.arc(cx, cy, baseR + 6, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2)
      ctx.strokeStyle = accent
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.stroke()
      ctx.lineCap = 'butt'

      raf = requestAnimationFrame(render)
    }
    render()
    return () => cancelAnimationFrame(raf)
  }, [style, intensity, playing, progress, palette, size, real, frame, source])

  return <canvas ref={canvasRef} className="block" />
}
