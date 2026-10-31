const PREFIX = 'aether:'

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (e) {
    console.warn('storage save failed', e)
  }
}

export function remove(key: string): void {
  try { localStorage.removeItem(PREFIX + key) } catch {}
}

export function clearAll(): void {
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(PREFIX)) localStorage.removeItem(k)
    })
  } catch {}
}
