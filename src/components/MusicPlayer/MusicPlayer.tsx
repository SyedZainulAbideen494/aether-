import { motion } from 'framer-motion'
import { ExternalLink, Music } from 'lucide-react'
import AlbumArtwork from '../AlbumArtwork/AlbumArtwork'
import { formatTime } from '../../utils/format'
import type { SpotifyPlayback } from '../../types'

interface Props {
  playback: SpotifyPlayback | null
  loading: boolean
  connected: boolean
  demoMode: boolean
  demoTrack: { name: string; artist: string; album: string; art: string; duration: number; progress: number; playing: boolean } | null
}

export default function MusicPlayer({ playback, loading, connected, demoMode, demoTrack }: Props) {
  const isDemo = demoMode && demoTrack
  const track = isDemo ? null : playback?.item
  const isPlaying = isDemo ? (demoTrack!.playing) : !!playback?.is_playing
  const progress = isDemo ? demoTrack!.progress : (playback ? playback.progress_ms / (playback.item?.duration_ms || 1) : 0)
  const art = isDemo ? demoTrack!.art : (track?.album?.images?.[0]?.url ?? null)
  const name = isDemo ? demoTrack!.name : (track?.name ?? 'Nothing playing')
  const artist = isDemo ? demoTrack!.artist : (track?.artists?.map((a) => a.name).join(', ') ?? '')
  const album = isDemo ? demoTrack!.album : (track?.album?.name ?? '')
  const duration = isDemo ? demoTrack!.duration : (track?.duration_ms ?? 0)
  const pos = isDemo ? demoTrack!.progress * duration : (playback?.progress_ms ?? 0)

  const spotifyUrl = track?.external_urls?.spotify

  return (
    <CardInner>
      <div className="flex items-center gap-4">
        <AlbumArtwork url={art} playing={isPlaying} size={72} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Now Playing</p>
          <p className="font-semibold text-ink truncate">{name}</p>
          <p className="text-sm text-muted truncate">{artist}{album ? ` · ${album}` : ''}</p>
          <div className="mt-3">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                animate={{ width: `${Math.min(100, progress * 100)}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-faint mt-1">
              <span>{formatTime(pos)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <span className={`text-xs px-2 py-1 rounded-full ${connected || isDemo ? 'bg-green-500/15 text-green-300' : 'bg-white/5 text-faint'}`}>
          {isDemo ? 'Demo' : connected ? 'Spotify connected' : 'Not connected'}
        </span>
        {loading && <span className="text-xs text-faint">Loading…</span>}
        {spotifyUrl && (
          <a href={spotifyUrl} target="_blank" rel="noreferrer" className="ml-auto text-xs text-accent flex items-center gap-1 hover:underline">
            Open in Spotify <ExternalLink size={12} />
          </a>
        )}
      </div>
      {!connected && !isDemo && (
        <div className="mt-3 text-xs text-faint flex items-center gap-2">
          <Music size={14} /> Connect Spotify in Settings to see real playback.
        </div>
      )}
    </CardInner>
  )
}

function CardInner({ children }: any) {
  return <div className="glass rounded-3xl p-5">{children}</div>
}
