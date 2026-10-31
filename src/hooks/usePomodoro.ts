import { useCallback, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { SessionType } from '../types'

export function usePomodoro() {
  const timer = useAppStore((s) => s.timer)
  const setTimer = useAppStore((s) => s.setTimer)
  const pomType = useAppStore((s) => s.pomType)
  const pomRunning = useAppStore((s) => s.pomRunning)
  const pomRemaining = useAppStore((s) => s.pomRemaining)
  const pomTotal = useAppStore((s) => s.pomTotal)
  const pomCompletedCount = useAppStore((s) => s.pomCompletedCount)
  const setPomType = useAppStore((s) => s.setPomType)
  const setPomRunning = useAppStore((s) => s.setPomRunning)
  const setPomEndAt = useAppStore((s) => s.setPomEndAt)
  const setPomRemaining = useAppStore((s) => s.setPomRemaining)
  const setPomTotal = useAppStore((s) => s.setPomTotal)

  const durationFor = useCallback((t: SessionType) => {
    if (t === 'focus') return timer.focus * 60 * 1000
    if (t === 'shortBreak') return timer.shortBreak * 60 * 1000
    return timer.longBreak * 60 * 1000
  }, [timer])

  // reset remaining when type changes and not running


  const type = pomType as SessionType
  const running = pomRunning
  const remaining = pomRemaining
  const total = pomTotal
  const progress = total ? 1 - remaining / total : 0

  const start = useCallback(() => {
    if (running) return
    const rem = remaining
    setPomEndAt(Date.now() + rem)
    setPomRunning(true)
  }, [running, remaining, setPomEndAt, setPomRunning])

  const pause = useCallback(() => {
    if (!running) return
    setPomRunning(false)
    setPomEndAt(null)
  }, [running, setPomRunning, setPomEndAt])

  const reset = useCallback(() => {
    setPomRunning(false)
    setPomEndAt(null)
    const d = durationFor(type)
    setPomRemaining(d)
    setPomTotal(d)
  }, [type, durationFor, setPomRunning, setPomEndAt, setPomRemaining, setPomTotal])

  const skip = useCallback(() => {
    setPomRunning(false)
    setPomEndAt(null)
    let nextType: SessionType = 'focus'
    if (type === 'focus') {
      const newCount = pomCompletedCount + 1
      useAppStore.getState().setPomCompletedCount(newCount)
      if (newCount % timer.longBreakEvery === 0) nextType = 'longBreak'
      else nextType = 'shortBreak'
    } else nextType = 'focus'
    setPomType(nextType)
    const d = durationFor(nextType)
    setPomRemaining(d)
    setPomTotal(d)
  }, [type, pomCompletedCount, timer, durationFor, setPomRunning, setPomEndAt, setPomType, setPomRemaining, setPomTotal])

  const setType = useCallback((t: SessionType) => {
    if (running) return
    setPomType(t)
    const d = durationFor(t)
    setPomRemaining(d)
    setPomTotal(d)
  }, [running, durationFor, setPomType, setPomRemaining, setPomTotal])

  const startWithType = useCallback((t: SessionType) => {
    setPomType(t)
    const d = durationFor(t)
    setPomRemaining(d)
    setPomTotal(d)
    setPomEndAt(Date.now() + d)
    setPomRunning(true)
  }, [durationFor, setPomType, setPomRemaining, setPomTotal, setPomEndAt, setPomRunning])

  // sync remaining when timer settings change and not running
  useEffect(() => {
    if (!running) {
      const d = durationFor(type)
      setPomRemaining(d)
      setPomTotal(d)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer])

  return {
    type, running, remaining, total, progress, completedCount: pomCompletedCount,
    start, pause, reset, skip, setType, startWithType,
    setDurations: setTimer,
  }
}
