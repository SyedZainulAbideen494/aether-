import * as pdfjsLib from 'pdfjs-dist'

// worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()
}

export interface PdfPage { page: number; text: string }

export async function extractPdf(file: File): Promise<{ pages: PdfPage[]; images: { base64: string; mimeType: string }[] }> {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  const pages: PdfPage[] = []
  let totalText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((it: any) => it.str).join(' ')
    pages.push({ page: i, text })
    totalText += text
  }
  const images: { base64: string; mimeType: string }[] = []
  // If scanned (little text), render pages to images
  if (totalText.trim().length < 50) {
    const max = Math.min(pdf.numPages, 8)
    for (let i = 1; i <= max; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')!
      await page.render({ canvas, canvasContext: ctx, viewport }).promise
      const dataUrl = canvas.toDataURL('image/png')
      images.push({ base64: dataUrl.split(',')[1], mimeType: 'image/png' })
    }
  }
  return { pages, images }
}

export function pagesToText(pages: PdfPage[], selected?: number[]): string {
  const set = selected ? new Set(selected) : null
  return pages
    .filter((p) => !set || set.has(p.page))
    .map((p) => `[Page ${p.page}]\n${p.text}`)
    .join('\n\n')
}
