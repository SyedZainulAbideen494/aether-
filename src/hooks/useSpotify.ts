import { useEffect, useRef, useState, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { createAuthorizeUrl, exchangeCode, refreshAccessToken } from '../services/spotify/auth'
import { getCurrentlyPlaying, getCurrentPlayback } from '../services/spotify/api'
import type { SpotifyPlayback, SpotifyTokens } from '../types'

export function useSpotify() {
  const { spotifyConfig, spotifyTokens, setSpotifyTokens, settings } = useAppStore()
  const [playback, setPlayback] = useState<SpotifyPlayback | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState<boolean>(!!spotifyTokens?.accessToken)
  const pollingRef = useRef<number | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  const isExpired = useCallback((t: SpotifyTokens | null) => {
    if (!t) return true
    return Date.now() >= t.expiresAt - 60_000
  }, [])

  const ensureToken = useCallback(async (): Promise<string | null> => {
    let t = useAppStore.getState().spotifyTokens
    if (!t) return null
    if (isExpired(t) && t.refreshToken) {
      try {
        const cfg = useAppStore.getState().spotifyConfig
      const r = await refreshAccessToken(cfg.clientId, t.refreshToken)
        const next: SpotifyTokens = {
          accessToken: r.access_token,
          refreshToken: r.refresh_token ?? t.refreshToken,
          expiresAt: Date.now() + (r.expires_in ?? 3600) * 1000,
          scope: r.scope ?? t.scope,
        }
        setSpotifyTokens(next)
        t = next
      } catch (e) {
        setError('Token refresh failed. Please reconnect Spotify.')
        setSpotifyTokens(null)
        setConnected(false)
        return null
      }
    }
    return t?.accessToken ?? null
  }, [spotifyConfig.clientId, isExpired, setSpotifyTokens])

  const fetchPlayback = useCallback(async () => {
    if (settings.demoMode) return
    const token = await ensureToken()
    if (!token) { setPlayback(null); return }
    try {
      setLoading(true)
      const [playing, player] = await Promise.allSettled([getCurrentlyPlaying(token), getCurrentPlayback(token)])
      if (!mountedRef.current) return
      let data: any = null
      if (playing.status === 'fulfilled' && playing.value) data = playing.value
      else if (player.status === 'fulfilled' && player.value) data = player.value
      if (playing.status === 'rejected' || player.status === 'rejected') {
        const err = (playing.status === 'rejected' ? playing.reason : (player as any).reason)
        if (String(err).includes('unauthorized')) { setError('Unauthorized. Reconnect Spotify.'); setSpotifyTokens(null); setConnected(false) }
        else if (String(err).includes('rate_limited')) { setError('Rate limited by Spotify. Slowing down.') }
        else { /* ignore network */ }
      }
      if (data) {
        setPlayback(data as SpotifyPlayback)
        setError(null)
      } else {
        setPlayback(null)
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to fetch playback')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [ensureToken, settings.demoMode, setSpotifyTokens])

  const connect = useCallback(async () => {
    const cfg = useAppStore.getState().spotifyConfig
    if (!cfg.clientId) { setError('Enter a Client ID first.'); return }
    try {
      const { url, verifier, state } = await createAuthorizeUrl(cfg.clientId, cfg.redirectUri)
      sessionStorage.setItem('aether:pkce:verifier', verifier)
      sessionStorage.setItem('aether:pkce:state', state)
      window.location.href = url
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start auth')
    }
  }, [spotifyConfig])

  const handleCallback = useCallback(async (code: string, state: string) => {
    const savedState = sessionStorage.getItem('aether:pkce:state')
    const verifier = sessionStorage.getItem('aether:pkce:verifier')
    if (!savedState || savedState !== state) { setError('State mismatch.'); return false }
    if (!verifier) { setError('Missing code verifier.'); return false }
    try {
      setLoading(true)
      const cfg = useAppStore.getState().spotifyConfig
      const r = await exchangeCode(cfg.clientId, cfg.redirectUri, code, verifier)
      const next: SpotifyTokens = {
        accessToken: r.access_token,
        refreshToken: r.refresh_token ?? null,
        expiresAt: Date.now() + (r.expires_in ?? 3600) * 1000,
        scope: r.scope ?? '',
      }
      setSpotifyTokens(next)
      setConnected(true)
      sessionStorage.removeItem('aether:pkce:verifier')
      sessionStorage.removeItem('aether:pkce:state')
      setError(null)
      return true
    } catch (e: any) {
      setError(e?.message ?? 'Callback failed')
      return false
    } finally {
      setLoading(false)
    }
  }, [spotifyConfig, setSpotifyTokens])

  const disconnect = useCallback(() => {
    setSpotifyTokens(null)
    setConnected(false)
    setPlayback(null)
    setError(null)
  }, [setSpotifyTokens])

  const clearCredentials = useCallback(() => {
    useAppStore.getState().setSpotifyConfig({ clientId: '', redirectUri: window.location.origin + '/callback' })
    disconnect()
  }, [disconnect])

  const testConfig = useCallback(async () => {
    const cfg = useAppStore.getState().spotifyConfig
    if (!cfg.clientId) { setError('Client ID required'); return false }
    if (cfg.clientId.length < 10) { setError('Client ID looks invalid'); return false }
    if (!/^https?:\/\//.test(cfg.redirectUri)) { setError('Redirect URI must start with http(s)://'); return false }
    setError(null)
    return true
  }, [spotifyConfig])

  // polling
  useEffect(() => {
    if (settings.demoMode) return
    if (!connected) return
    const start = () => {
      fetchPlayback()
      pollingRef.current = window.setInterval(() => {
        if (document.visibilityState === 'visible') fetchPlayback()
      }, 7000)
    }
    start()
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchPlayback()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [connected, settings.demoMode, fetchPlayback])

  useEffect(() => { setConnected(!!spotifyTokens?.accessToken) }, [spotifyTokens])

  return {
    config: spotifyConfig, tokens: spotifyTokens, playback, loading, error, connected,
    connect, disconnect, clearCredentials, testConfig, handleCallback, fetchPlayback, setError,
  }
}
