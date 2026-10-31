// Extract dominant colors from an image URL using canvas sampling.
export async function extractColors(url: string): Promise<{ primary: string; secondary: string; accent: string }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const size = 64
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, size, size)
        const data = ctx.getImageData(0, 0, size, size).data
        // sample pixels, bucket by hue
        const buckets: { r: number; g: number; b: number; count: number }[] = []
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
          if (a < 128) continue
          // skip near-black / near-white
          const lum = 0.299 * r + 0.587 * g + 0.114 * b
          if (lum < 20 || lum > 235) continue
          const existing = buckets.find((bkt) => {
            const dr = bkt.r - r, dg = bkt.g - g, db = bkt.b - b
            return Math.sqrt(dr * dr + dg * dg + db * db) < 40
          })
          if (existing) {
            existing.r = (existing.r * existing.count + r) / (existing.count + 1)
            existing.g = (existing.g * existing.count + g) / (existing.count + 1)
            existing.b = (existing.b * existing.count + b) / (existing.count + 1)
            existing.count++
          } else {
            buckets.push({ r, g, b, count: 1 })
          }
        }
        buckets.sort((a, b) => b.count - a.count)
        const toHex = (c: { r: number; g: number; b: number }) =>
          '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
        const primary = buckets[0] ? toHex(buckets[0]) : '#7c5cff'
        const secondary = buckets[1] ? toHex(buckets[1]) : '#4aa8ff'
        const accent = buckets[2] ? toHex(buckets[2]) : '#9b6bff'
        resolve({ primary, secondary, accent })
      } catch {
        resolve({ primary: '#7c5cff', secondary: '#4aa8ff', accent: '#9b6bff' })
      }
    }
    img.onerror = () => resolve({ primary: '#7c5cff', secondary: '#4aa8ff', accent: '#9b6bff' })
    img.src = url
  })
}
