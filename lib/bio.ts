import type { BioAccent, BioIcon, BioLinkState } from "./types"

export const BIO_LIMITS = { handleMin: 3, handleMax: 30, displayName: 50, bio: 160, buttonTitle: 60, buttons: 30 } as const

const JAVA_STRIP_EDGES = /^[\t-\r\u001C-\u0020\u1680\u2000-\u2006\u2008-\u200A\u2028\u2029\u205F\u3000]+|[\t-\r\u001C-\u0020\u1680\u2000-\u2006\u2008-\u200A\u2028\u2029\u205F\u3000]+$/g

export const normalizeHandle = (raw: string): string => {
  const stripped = raw.replace(JAVA_STRIP_EDGES, "")
  const withoutAt = stripped.startsWith("@") ? stripped.slice(1) : stripped
  return withoutAt.toLowerCase()
}

export const handleFormatError = (handle: string): string | null => {
  if (handle.length < BIO_LIMITS.handleMin || handle.length > BIO_LIMITS.handleMax) return "A handle must be 3 to 30 characters."
  if (!/^[a-z0-9_-]+$/.test(handle)) return "Use only letters, numbers, hyphens and underscores."
  if (!/[a-z0-9]/.test(handle)) return "A handle needs at least one letter or number."
  return null
}

export const bioShareUrl = (handle: string, shortBase: string): string => `${shortBase}/@${handle}`

export const displayShareUrl = (handle: string, shortBase: string): string =>
  bioShareUrl(handle, shortBase).replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")

const firstCharacter = (value: string): string => Array.from(value)[0] ?? ""

export const initialsOf = (displayName: string, handle: string | null): string => {
  const initials = displayName
    .split(/\s+/u)
    .filter((word) => /^[\p{L}\p{N}]/u.test(word))
    .slice(0, 2)
    .map((word) => firstCharacter(word).toLocaleUpperCase("en"))
    .join("")
  if (initials) return initials
  if (handle) return firstCharacter(handle).toLocaleUpperCase("en")
  return "?"
}

const OG_UNSUPPORTED = /[^\u0020-\u007E\u00A0-\u00AC\u00AE-\u0113\u0116-\u012B\u012E-\u0137\u0139-\u013E\u0141-\u0148\u014A-\u014D\u0150-\u017E\u0400-\u045F]/gu

export const ogSafeText = (value: string): string =>
  value.replace(/\s+/gu, " ").replace(OG_UNSUPPORTED, "").replace(/ {2,}/g, " ").trim()

export const BIO_ACCENTS: Record<BioAccent, { label: string; light: string; dark: string }> = {
  BLUE: { label: "Blue", light: "#1d4ed8", dark: "#93c5fd" },
  VIOLET: { label: "Violet", light: "#6d28d9", dark: "#c4b5fd" },
  PINK: { label: "Pink", light: "#be185d", dark: "#f9a8d4" },
  RED: { label: "Red", light: "#b91c1c", dark: "#fca5a5" },
  ORANGE: { label: "Orange", light: "#c2410c", dark: "#fdba74" },
  GREEN: { label: "Green", light: "#15803d", dark: "#86efac" },
  TEAL: { label: "Teal", light: "#0f766e", dark: "#5eead4" },
  SLATE: { label: "Slate", light: "#334155", dark: "#cbd5e1" },
}

export const BIO_PAGE_COLORS = {
  light: { bg: "#ffffff", fg: "#0e0e11", muted: "#5c5c66" },
  dark: { bg: "#0b0b0e", fg: "#f5f5f5", muted: "#a1a1aa" },
  onAccentLight: "#ffffff",
  onAccentDark: "#0b0b0e",
} as const

export const BIO_ICON_LABELS: Record<BioIcon, string> = {
  WEBSITE: "Website",
  EMAIL: "Email",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  X: "X",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  GITHUB: "GitHub",
  SPOTIFY: "Spotify",
  WHATSAPP: "WhatsApp",
  TELEGRAM: "Telegram",
}

const ICON_DOMAINS: [BioIcon, string[]][] = [
  ["INSTAGRAM", ["instagram.com"]],
  ["TIKTOK", ["tiktok.com"]],
  ["YOUTUBE", ["youtube.com", "youtu.be"]],
  ["X", ["x.com", "twitter.com"]],
  ["FACEBOOK", ["facebook.com", "fb.com", "fb.me"]],
  ["LINKEDIN", ["linkedin.com", "lnkd.in"]],
  ["GITHUB", ["github.com"]],
  ["SPOTIFY", ["spotify.com", "spotify.link"]],
  ["WHATSAPP", ["wa.me", "whatsapp.com"]],
  ["TELEGRAM", ["t.me", "telegram.me", "telegram.org"]],
]

export const guessIcon = (host: string): BioIcon => {
  const lowerHost = host.toLowerCase()
  const match = ICON_DOMAINS.find(([, domains]) =>
    domains.some((domain) => lowerHost === domain || lowerHost.endsWith(`.${domain}`)),
  )
  return match ? match[0] : "WEBSITE"
}

const cutToLength = (value: string, max: number): string => {
  if (value.length <= max) return value
  const end = /[\uD800-\uDBFF]/.test(value.charAt(max - 1)) ? max - 1 : max
  return value.slice(0, end)
}

export const defaultButtonTitle = (host: string): string => {
  const icon = guessIcon(host)
  const title = icon === "WEBSITE" ? host.replace(/^www\./i, "") : BIO_ICON_LABELS[icon]
  return cutToLength(title, BIO_LIMITS.buttonTitle)
}

export const moveItem = <T>(items: readonly T[], from: number, to: number): T[] => {
  const moved = items.slice()
  if (from === to || from < 0 || to < 0 || from >= moved.length || to >= moved.length) return moved
  const [item] = moved.splice(from, 1)
  moved.splice(to, 0, item)
  return moved
}

export const insertionIndex = (midpoints: number[], y: number): number =>
  midpoints.filter((midpoint) => midpoint < y).length

const channelLuminance = (channel: number): number => {
  const value = channel / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

const relativeLuminance = (color: string): number => {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color)
  if (!match) throw new Error(`Not a hex colour: ${color}`)
  const hex = match[1].length === 3 ? [...match[1]].map((digit) => digit + digit).join("") : match[1]
  const [red, green, blue] = [0, 2, 4].map((start) => channelLuminance(parseInt(hex.slice(start, start + 2), 16)))
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export const contrastRatio = (a: string, b: string): number => {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((first, second) => second - first)
  return (lighter + 0.05) / (darker + 0.05)
}

const graphemes = new Intl.Segmenter("en", { granularity: "grapheme" })

export const isSingleEmoji = (value: string): boolean => {
  if (!value || value.length > 16 || (value.codePointAt(0) ?? 0) <= 0x7f) return false
  if (!/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(value)) return false
  return [...graphemes.segment(value)].length === 1
}

export const EMOJI_SUGGESTIONS = ["✨", "🎨", "📸", "🎵", "🎮", "💼", "🌿", "☕", "🚀", "💡", "❤\uFE0F", "🐾"] as const

const LINK_STOPPED_HINT = "Not shown on your page until the link works again."

export const LINK_STATE_LABELS: Record<Exclude<BioLinkState, "LIVE">, { badge: string; hint: string }> = {
  IN_REVIEW: { badge: "Waiting for review", hint: "Not shown on your page until an admin has checked the link." },
  DEACTIVATED: { badge: "Link turned off", hint: LINK_STOPPED_HINT },
  EXPIRED: { badge: "Link expired", hint: LINK_STOPPED_HINT },
  LIMIT_REACHED: { badge: "Visit limit reached", hint: LINK_STOPPED_HINT },
  BLOCKED: { badge: "Link blocked", hint: "Not shown on your page. Blocked links can't be shown." },
}
