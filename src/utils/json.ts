export function extractJson(text: string): any {
  // strip code fences
  let t = text.trim()
  t = t.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '')
  // find first { or [
  const start = Math.min(
    t.indexOf('{') === -1 ? Infinity : t.indexOf('{'),
    t.indexOf('[') === -1 ? Infinity : t.indexOf('[')
  )
  if (!isFinite(start)) throw new Error('No JSON found')
  // find matching end
  let depth = 0
  let inStr = false
  let esc = false
  let end = -1
  for (let i = start; i < t.length; i++) {
    const ch = t[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
    } else {
      if (ch === '"') inStr = true
      else if (ch === '{' || ch === '[') depth++
      else if (ch === '}' || ch === ']') {
        depth--
        if (depth === 0) { end = i + 1; break }
      }
    }
  }
  if (end === -1) end = t.length
  let slice = t.slice(start, end)
  // remove trailing commas
  slice = slice.replace(/,\s*([}\]])/g, '$1')
  return JSON.parse(slice)
}
