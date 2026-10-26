export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const

export type UtmKey = typeof UTM_KEYS[number]

export type UtmValues = Partial<Record<UtmKey, string>>

export const QUICK_SOURCES: ReadonlyArray<{ source: string; medium: string }> = [
  { source: "instagram", medium: "social" },
  { source: "facebook", medium: "social" },
  { source: "tiktok", medium: "social" },
  { source: "linkedin", medium: "social" },
  { source: "x", medium: "social" },
  { source: "newsletter", medium: "email" },
  { source: "qr", medium: "qr" },
]

const RECENT_STORAGE_KEY = "hrva:utm-recent"
const RECENT_LIMIT = 5

// Mirrors CreateUrlToUrlConverter.normalizeScheme in the backend, which adds https:// on create and update.
const SCHEME_PREFIX = /^(?:[a-z][a-z0-9+.-]*:(?!\d+(?:[/?#]|$))|https?\/)/i

const isUtmKey = (key: string | undefined): key is UtmKey => (UTM_KEYS as readonly (string | undefined)[]).includes(key)

const parseWebUrl = (destination: string): URL | null => {
  try {
    const url = new URL(destination)
    return url.protocol === "http:" || url.protocol === "https:" ? url : null
  } catch {
    return null
  }
}

const emptyRecent = (): Record<UtmKey, string[]> => ({
  utm_source: [],
  utm_medium: [],
  utm_campaign: [],
  utm_term: [],
  utm_content: [],
})

export function withScheme(destination: string): string {
  const trimmed = destination.trim()
  if (!trimmed || SCHEME_PREFIX.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function hasUtmValues(values: UtmValues): boolean {
  return UTM_KEYS.some((key) => Boolean(values[key]?.trim()))
}

export function withUtm(destination: string, values: UtmValues): string | null {
  const url = parseWebUrl(destination)
  if (!url) return null
  const keys = [...url.searchParams.keys()]
  const kept = url.search
    .slice(1)
    .split("&")
    .filter(Boolean)
    .filter((_, index) => !isUtmKey(keys[index]))
  const added = new URLSearchParams()
  for (const key of UTM_KEYS) {
    const value = values[key]?.trim()
    if (value) added.append(key, value)
  }
  url.search = [...kept, added.toString()].filter(Boolean).join("&")
  return url.toString()
}

export function readUtm(destination: string): UtmValues {
  const found: UtmValues = {}
  const url = parseWebUrl(destination)
  if (!url) return found
  for (const key of UTM_KEYS) {
    const value = url.searchParams.get(key)
    if (value?.trim()) found[key] = value
  }
  return found
}

export function hasUtm(destination: string): boolean {
  return hasUtmValues(readUtm(destination))
}

export function destinationToSend(typed: string, open: boolean, values: UtmValues): string | null {
  if (!open) return typed
  const destination = withScheme(typed)
  if (hasUtmValues(values)) return withUtm(destination, values)
  return hasUtm(destination) ? withUtm(destination, {}) : typed
}

export function recentUtm(): Record<UtmKey, string[]> {
  const recent = emptyRecent()
  try {
    if (typeof window === "undefined") return recent
    const stored: unknown = JSON.parse(window.localStorage.getItem(RECENT_STORAGE_KEY) ?? "null")
    if (!stored || typeof stored !== "object") return recent
    for (const key of UTM_KEYS) {
      const list: unknown = (stored as Record<string, unknown>)[key]
      if (!Array.isArray(list)) continue
      recent[key] = list
        .filter((item): item is string => typeof item === "string" && item.trim() !== "")
        .slice(0, RECENT_LIMIT)
    }
    return recent
  } catch {
    return emptyRecent()
  }
}

export function rememberUtm(values: UtmValues): void {
  if (!hasUtmValues(values)) return
  const recent = recentUtm()
  for (const key of UTM_KEYS) {
    const value = values[key]?.trim()
    if (!value) continue
    recent[key] = [value, ...recent[key].filter((item) => item !== value)].slice(0, RECENT_LIMIT)
  }
  try {
    if (typeof window === "undefined") return
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recent))
  } catch {
    return
  }
}
