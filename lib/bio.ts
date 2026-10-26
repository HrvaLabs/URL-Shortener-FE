import type { BioAccent, BioAvatarKind, BioIcon, BioLinkState, BioPage, BioPageButton, BioPageButtonInput, BioPageUpdate, BioTheme } from "./types"

export const BIO_LIMITS = { handleMin: 3, handleMax: 30, displayName: 50, bio: 160, buttonTitle: 60, buttons: 30 } as const

const character = (codePoint: number): string => String.fromCodePoint(codePoint)

const characterRange = (first: number, last: number): string => `${character(first)}-${character(last)}`

const LINE_SEPARATOR = character(0x2028)
const PARAGRAPH_SEPARATOR = character(0x2029)
const VARIATION_SELECTOR_16 = character(0xfe0f)

const JAVA_WHITESPACE = [
  characterRange(0x0009, 0x000d),
  characterRange(0x001c, 0x0020),
  character(0x1680),
  characterRange(0x2000, 0x2006),
  characterRange(0x2008, 0x200a),
  LINE_SEPARATOR,
  PARAGRAPH_SEPARATOR,
  character(0x205f),
  character(0x3000),
].join("")

const JAVA_STRIP_EDGES = new RegExp(`^[${JAVA_WHITESPACE}]+|[${JAVA_WHITESPACE}]+$`, "g")

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
  return handle?.match(/[a-z0-9]/)?.[0].toLocaleUpperCase("en") ?? "?"
}

const OG_DRAWABLE = [
  characterRange(0x0020, 0x007e),
  characterRange(0x00a0, 0x00ac),
  characterRange(0x00ae, 0x0113),
  characterRange(0x0116, 0x012b),
  characterRange(0x012e, 0x0137),
  characterRange(0x0139, 0x013e),
  characterRange(0x0141, 0x0148),
  characterRange(0x014a, 0x014d),
  characterRange(0x0150, 0x017e),
  characterRange(0x0400, 0x045f),
].join("")

const OG_UNSUPPORTED = new RegExp(`[^${OG_DRAWABLE}]`, "gu")

export const ogSafeText = (value: string): string =>
  value.replace(/\s+/gu, " ").replace(OG_UNSUPPORTED, "").replace(/ {2,}/g, " ").trim()

export const ogInitials = (displayName: string, handle: string | null): string =>
  ogSafeText(initialsOf(ogSafeText(displayName), handle)) || initialsOf("", handle)

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

export const isBioIcon = (value: unknown): value is BioIcon =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(BIO_ICON_LABELS, value)

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

const HIGH_SURROGATE = new RegExp(`[${characterRange(0xd800, 0xdbff)}]`)

const cutToLength = (value: string, max: number): string => {
  if (value.length <= max) return value
  const end = HIGH_SURROGATE.test(value.charAt(max - 1)) ? max - 1 : max
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

const JOINERS = new Set([character(0x200c), character(0x200d)])

const startsOrEndsWithJoiner = (value: string): boolean => {
  const codePoints = Array.from(value)
  return JOINERS.has(codePoints[0]) || JOINERS.has(codePoints[codePoints.length - 1])
}

export const isSingleEmoji = (value: string): boolean => {
  if (!value || value.length > 16 || (value.codePointAt(0) ?? 0) <= 0x7f) return false
  if (startsOrEndsWithJoiner(value)) return false
  if (!/^\p{Emoji}/u.test(value)) return false
  return [...graphemes.segment(value)].length === 1
}

export const EMOJI_SUGGESTIONS = ["✨", "🎨", "📸", "🎵", "🎮", "💼", "🌿", "☕", "🚀", "💡", `❤${VARIATION_SELECTOR_16}`, "🐾"] as const

const LINK_STOPPED_HINT = "Not shown on your page until the link works again."

export const LINK_STATE_LABELS: Record<Exclude<BioLinkState, "LIVE">, { badge: string; hint: string }> = {
  IN_REVIEW: { badge: "Waiting for review", hint: "Not shown on your page until an admin has checked the link." },
  DEACTIVATED: { badge: "Link turned off", hint: LINK_STOPPED_HINT },
  EXPIRED: { badge: "Link expired", hint: LINK_STOPPED_HINT },
  LIMIT_REACHED: { badge: "Visit limit reached", hint: LINK_STOPPED_HINT },
  BLOCKED: { badge: "Link blocked", hint: "Not shown on your page. Blocked links can't be shown." },
}

export const AVATAR_EMOJI_REQUIRED = "Pick one emoji for the avatar."

export type BioDraft = {
  displayName: string
  bio: string
  avatarKind: BioAvatarKind
  avatarEmoji: string
  accent: BioAccent
  theme: BioTheme
  indexable: boolean
  buttons: BioPageButton[]
}

export const bioDraftOf = (page: BioPage): BioDraft => ({
  displayName: page.displayName,
  bio: page.bio,
  avatarKind: page.avatarKind,
  avatarEmoji: page.avatarEmoji ?? "",
  accent: page.accent,
  theme: page.theme,
  indexable: page.indexable,
  buttons: page.buttons,
})

const buttonInputsOf = (buttons: readonly BioPageButton[]): BioPageButtonInput[] =>
  buttons.map(({ urlId, title, icon, visible }) => ({ urlId, title, icon, visible }))

export const bioUpdateOf = (draft: BioDraft): BioPageUpdate => ({
  displayName: draft.displayName,
  bio: draft.bio,
  avatarKind: draft.avatarKind,
  avatarEmoji: draft.avatarKind === "EMOJI" ? draft.avatarEmoji.trim() : null,
  accent: draft.accent,
  theme: draft.theme,
  indexable: draft.indexable,
  buttons: buttonInputsOf(draft.buttons),
})

const sameJson = (first: unknown, second: unknown): boolean => JSON.stringify(first) === JSON.stringify(second)

export const sameBioDraft = (first: BioDraft, second: BioDraft): boolean => sameJson(bioUpdateOf(first), bioUpdateOf(second))

const withServerStates = (buttons: readonly BioPageButton[], server: readonly BioPageButton[]): BioPageButton[] => {
  const serverButtons = new Map(server.map((button) => [button.urlId, button]))
  return buttons.map((button) => {
    const known = serverButtons.get(button.urlId)
    if (!known) return button
    const { title, icon, visible } = button
    return { ...known, title, icon, visible, shownOnPage: visible && known.linkState === "LIVE" }
  })
}

const rebaseDraftOn = (draft: BioDraft, base: BioDraft, next: BioDraft): BioDraft => {
  const pick = <K extends keyof BioDraft>(key: K): BioDraft[K] => (sameJson(draft[key], base[key]) ? next[key] : draft[key])
  return {
    displayName: pick("displayName"),
    bio: pick("bio"),
    avatarKind: pick("avatarKind"),
    avatarEmoji: pick("avatarEmoji"),
    accent: pick("accent"),
    theme: pick("theme"),
    indexable: pick("indexable"),
    buttons: sameJson(buttonInputsOf(draft.buttons), buttonInputsOf(base.buttons))
      ? next.buttons
      : withServerStates(draft.buttons, next.buttons),
  }
}

export const rebaseBioDraft = (draft: BioDraft, from: BioPage, to: BioPage): BioDraft =>
  rebaseDraftOn(draft, bioDraftOf(from), bioDraftOf(to))

export const rebaseSavedBioDraft = (draft: BioDraft, sent: BioDraft, saved: BioPage): BioDraft =>
  rebaseDraftOn(draft, sent, bioDraftOf(saved))

export type BioProfileField = "displayName" | "bio" | "avatarEmoji"

const PROFILE_FIELD_TEXTS = new Map<string, BioProfileField>([
  ["Name must be 50 characters or fewer", "displayName"],
  ["Bio must be 160 characters or fewer", "bio"],
  [AVATAR_EMOJI_REQUIRED.replace(/\.$/, ""), "avatarEmoji"],
])

export const bioSaveFieldErrors = (message: string): Partial<Record<BioProfileField, string>> | null => {
  const parts = message.split(". ").map((part) => part.trim()).filter(Boolean)
  if (parts.length === 0) return null
  const errors: Partial<Record<BioProfileField, string>> = {}
  for (const part of parts) {
    const field = PROFILE_FIELD_TEXTS.get(part.replace(/\.$/, ""))
    if (!field) return null
    errors[field] = part
  }
  return errors
}
