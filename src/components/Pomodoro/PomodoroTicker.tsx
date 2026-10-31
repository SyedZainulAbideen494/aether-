import { useEffect, useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { SessionType } from '../../types'

const TYPE_LABEL: Record<SessionType, string> = { focus: 'Focus', shortBreak: 'Short Break', longBreak: 'Long Break' }

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 660
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start(); osc.stop(ctx.currentTime + 0.6)
  } catch {}
}

export default function PomodoroTicker() {
  const rafRef = useRef<number | null>(null)
  const completingRef = useRef(false)

  useEffect(() => {
    const tick = () => {
      const st = useAppStore.getState()
      if (st.pomRunning && st.pomEndAt) {
        const rem = st.pomEndAt - Date.now()
        if (rem <= 0 && !completingRef.current) {
          completingRef.current = true
          completeSession()
          completingRef.current = false
        } else if (rem > 0) {
          st.setPomRemaining(rem)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    const onVis = () => {
      const st = useAppStore.getState()
      if (document.visibilityState === 'visible' && st.pomRunning && st.pomEndAt) {
        const rem = st.pomEndAt - Date.now()
        if (rem <= 0) completeSession()
        else st.setPomRemaining(rem)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return null
}

function durationFor(type: SessionType, timer: any) {
  if (type === 'focus') return timer.focus * 60 * 1000
  if (type === 'shortBreak') return timer.shortBreak * 60 * 1000
  return timer.longBreak * 60 * 1000
}

function completeSession() {
  const st = useAppStore.getState()
  const t = st.pomType
  const rec = {
    id: crypto.randomUUID(),
    type: t,
    startedAt: Date.now() - st.pomTotal,
    endedAt: Date.now(),
    duration: st.pomTotal,
    completed: true,
  }
  st.addSession(rec)
  if (st.timer.soundEnabled) playBeep()
  if (st.settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
    try { new Notification('AETHER', { body: `${TYPE_LABEL[t]} complete.` }) } catch {}
  }
  let nextType: SessionType = 'focus'
  if (t === 'focus') {
    const newCount = st.pomCompletedCount + 1
    st.setPomCompletedCount(newCount)
    if (newCount % st.timer.longBreakEvery === 0) nextType = 'longBreak'
    else nextType = 'shortBreak'
  } else {
    nextType = 'focus'
  }
  const d = durationFor(nextType, st.timer)
  st.setPomType(nextType)
  st.setPomRemaining(d)
  st.setPomTotal(d)
  st.setPomRunning(false)
  st.setPomEndAt(null)
  const auto = t === 'focus' ? st.timer.autoStartBreaks : st.timer.autoStartFocus
  if (auto) {
    setTimeout(() => {
      const s2 = useAppStore.getState()
      const dd = durationFor(nextType, s2.timer)
      s2.setPomType(nextType)
      s2.setPomRemaining(dd)
      s2.setPomTotal(dd)
      s2.setPomEndAt(Date.now() + dd)
      s2.setPomRunning(true)
    }, 800)
  }
}
