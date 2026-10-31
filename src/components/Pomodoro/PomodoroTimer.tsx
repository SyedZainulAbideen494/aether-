import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react'
import Visualizer from '../Visualizer/Visualizer'
import type { VisualizerStyle } from '../../types'
import type { AudioFrame } from '../../types/audio'

interface Props {
  remaining: number
  total: number
  progress: number
  running: boolean
  type: string
  typeLabel: string
  visualizer: VisualizerStyle
  intensity: number
  playing: boolean
  palette: any
  audioFrame?: AudioFrame | null
  audioSource?: 'ambient' | 'webaudio' | 'mic'
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSkip: () => void
}

const TYPE_COLORS: Record<string, string> = {
  focus: '#7c5cff',
  shortBreak: '#4aa8ff',
  longBreak: '#9b6bff',
}

export default function PomodoroTimer(props: Props) {
  const { remaining, progress, running, type, visualizer, intensity, playing, palette, audioFrame, audioSource, onStart, onPause, onReset, onSkip } = props
  const size = 300
  const stroke = 10
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - progress)
  const color = TYPE_COLORS[type] ?? '#7c5cff'

  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size + 80, height: size + 80 }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <Visualizer style={visualizer} intensity={intensity} playing={playing || running} progress={progress} palette={palette} size={size + 80} frame={audioFrame} source={audioSource} />
      </div>
      <svg width={size} height={size} className="relative z-10 -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.3, ease: 'linear' }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute z-20 flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted mb-2">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
        <span className="text-6xl font-light tabular-nums tracking-tight">
          {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
        </span>
        <div className="flex items-center gap-3 mt-6">
          <button onClick={onReset} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-muted hover:text-ink transition">
            <RotateCcw size={16} />
          </button>
          <motion.button
            onClick={running ? onPause : onStart}
            whileTap={{ scale: 0.95 }}
            className="p-4 rounded-full bg-accent text-white shadow-glow"
          >
            {running ? <Pause size={22} /> : <Play size={22} />}
          </motion.button>
          <button onClick={onSkip} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-muted hover:text-ink transition">
            <SkipForward size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
