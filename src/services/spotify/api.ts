const BASE = 'https://api.spotify.com/v1'

export async function getCurrentPlayback(token: string): Promise<any> {
  const res = await fetch(`${BASE}/me/player`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 204) return null
  if (res.status === 401) throw new Error('unauthorized')
  if (res.status === 429) throw new Error('rate_limited')
  if (!res.ok) throw new Error(`player fetch failed: ${res.status}`)
  return res.json()
}

export async function getCurrentlyPlaying(token: string): Promise<any> {
  const res = await fetch(`${BASE}/me/player/currently-playing`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 204) return null
  if (res.status === 401) throw new Error('unauthorized')
  if (res.status === 429) throw new Error('rate_limited')
  if (!res.ok) throw new Error(`currently-playing failed: ${res.status}`)
  return res.json()
}
