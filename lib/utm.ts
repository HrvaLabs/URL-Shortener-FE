export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const

export type UtmKey = typeof UTM_KEYS[number]

export type UtmValues = Partial<Record<UtmKey, string>>

export const QUICK_SOURCES = [
  { source: "instagram", medium: "social" },
  { source: "facebook", medium: "social" },
  { source: "tiktok", medium: "social" },
  { source: "linkedin", medium: "social" },
  { source: "x", medium: "social" },
  { source: "newsletter", medium: "email" },
  { source: "qr", medium: "qr" },
] as const

export interface QuickSource {
  source: string
  medium: string
}

export const MAX_DESTINATION_LENGTH = 2048

export const CANT_TAKE_UTM = "This address can't take UTM parameters."

export const tooLongMessage = (noun: string) =>
  `With the UTM parameters added, the link is longer than ${MAX_DESTINATION_LENGTH} characters. Shorten a value or the ${noun}.`

const RECENT_STORAGE_KEY = "hrva:utm-recent"
const RECENT_LIMIT = 5

// Mirrors CreateUrlToUrlConverter.normalizeScheme in the backend, which adds https:// on create and update.
const SCHEME_PREFIX = /^(?:[a-z][a-z0-9+.-]*:(?!\d+(?:[/?#]|$))|https?\/)/i

const isUtmKey = (key: string | undefined): key is UtmKey => (UTM_KEYS as readonly (string | undefined)[]).includes(key)

const pairKey = (pair: string): string | undefined => new URLSearchParams(`&${pair}`).keys().next().value

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

export function utmSignature(values: UtmValues): string {
  return UTM_KEYS.map((key) => values[key]?.trim() ?? "").join("\n")
}

export function hasUtmValues(values: UtmValues): boolean {
  return UTM_KEYS.some((key) => Boolean(values[key]?.trim()))
}

export function withUtm(destination: string, values: UtmValues): string | null {
  if (!parseWebUrl(destination)) return null
  const typed = destination.trim()
  const fragmentAt = typed.indexOf("#")
  const beforeFragment = fragmentAt === -1 ? typed : typed.slice(0, fragmentAt)
  const fragment = fragmentAt === -1 ? "" : typed.slice(fragmentAt)
  const queryAt = beforeFragment.indexOf("?")
  const prefix = queryAt === -1 ? beforeFragment : beforeFragment.slice(0, queryAt)
  const query = queryAt === -1 ? "" : beforeFragment.slice(queryAt + 1)
  const kept = query.split("&").filter((pair) => pair && !isUtmKey(pairKey(pair)))
  const added = UTM_KEYS.flatMap((key) => {
    const value = values[key]?.trim()
    return value ? [`${key}=${encodeURIComponent(value)}`] : []
  })
  const search = [...kept, ...added].join("&")
  return `${prefix}${search ? `?${search}` : ""}${fragment}`
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
  if (utmSignature(values) === utmSignature(readUtm(destination))) return typed
  return withUtm(destination, values)
}

export function tooLongWithUtm(typed: string, sent: string | null): boolean {
  return sent !== null && sent !== typed && sent.length > MAX_DESTINATION_LENGTH
}

export function followTags(previous: UtmValues, found: UtmValues, value: UtmValues): { value: UtmValues; reveal: boolean } | null {
  const previousKey = utmSignature(previous)
  const foundKey = utmSignature(found)
  const noTags = utmSignature({})
  if (foundKey !== noTags) {
    if (foundKey !== previousKey) return { value: found, reveal: previousKey === noTags || !hasUtmValues(value) }
    return hasUtmValues(value) ? null : { value: found, reveal: false }
  }
  if (previousKey !== noTags && utmSignature(value) === previousKey) return { value: {}, reveal: false }
  return null
}

export function pickQuickSource(value: UtmValues, pick: QuickSource, chipMedium: string | null): { value: UtmValues; chipMedium: string | null } {
  const medium = value.utm_medium?.trim() ?? ""
  const mediumFromChip = chipMedium !== null && medium === chipMedium
  if (value.utm_source?.trim() === pick.source) {
    return { value: { ...value, utm_source: "", utm_medium: mediumFromChip ? "" : value.utm_medium }, chipMedium: null }
  }
  if (!medium || mediumFromChip) return { value: { ...value, utm_source: pick.source, utm_medium: pick.medium }, chipMedium: pick.medium }
  return { value: { ...value, utm_source: pick.source }, chipMedium: null }
}

export function valuesNotAdded(value: UtmValues, found: UtmValues): number {
  return UTM_KEYS.filter((key) => {
    const typed = value[key]?.trim()
    return Boolean(typed) && typed !== found[key]?.trim()
  }).length
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
      const strings = list.filter((item): item is string => typeof item === "string" && item.trim() !== "")
      recent[key] = [...new Set(strings)].slice(0, RECENT_LIMIT)
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
