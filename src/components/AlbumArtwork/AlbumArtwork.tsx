import { motion } from 'framer-motion'

export default function AlbumArtwork({ url, playing, size = 120 }: { url?: string | null; playing: boolean; size?: number }) {
  return (
    <motion.div
      animate={{ rotate: playing ? 360 : 0 }}
      transition={playing ? { repeat: Infinity, duration: 12, ease: 'linear' } : { duration: 0.6 }}
      className="rounded-full overflow-hidden shadow-float relative"
      style={{ width: size, height: size }}
    >
      {url ? (
        <img src={url} alt="album" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-accent to-blue flex items-center justify-center">
          <div className="w-1/3 h-1/3 rounded-full bg-canvas/80" />
        </div>
      )}
      <div className="absolute inset-0 rounded-full border border-white/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 rounded-full bg-canvas border border-white/10" />
    </motion.div>
  )
}
