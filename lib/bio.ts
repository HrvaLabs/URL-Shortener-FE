import { parseServerDateTime } from "./analytics"
import type { BioAccent, BioAvatarKind, BioIcon, BioLinkState, BioPage, BioPageButton, BioPageButtonInput, BioPageUpdate, BioTheme, UrlResponse } from "./types"

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

const LETTERS_WITHOUT_MARKS = new Map([
  [character(0x0111), "d"],
  [character(0x0110), "d"],
  [character(0x00df), "ss"],
  [character(0x1e9e), "ss"],
  [character(0x0142), "l"],
  [character(0x0141), "l"],
  [character(0x00f8), "o"],
  [character(0x00d8), "o"],
])

const LETTER_WITHOUT_MARK = new RegExp(`[${[...LETTERS_WITHOUT_MARKS.keys()].join("")}]`, "gu")

export const suggestHandle = (raw: string): string | null => {
  const handle = normalizeHandle(raw)
  const suggestion = handle
    .replace(LETTER_WITHOUT_MARK, (letter) => LETTERS_WITHOUT_MARKS.get(letter) ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[\s.]+/gu, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
  return suggestion !== handle && handleFormatError(suggestion) === null ? suggestion : null
}

export const bioShareUrl = (handle: string, shortBase: string): string => `${shortBase}/@${handle}`

export const BIO_PAGE_NAME_ID = "bio-page-name"

export const freshBioPagePath = (handle: string, savedAt: string | null | undefined): string =>
  savedAt ? `/bio/${handle}?saved=${encodeURIComponent(savedAt)}` : `/bio/${handle}`

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

const ALIAS = "{alias}"

export const URLS_PAGE = "URLs page"

export const LINK_STATE_LABELS: Record<Exclude<BioLinkState, "LIVE">, { badge: string; hint: string }> = {
  IN_REVIEW: { badge: "Waiting for review", hint: "Not shown on your page until an admin has checked the link." },
  DEACTIVATED: { badge: "Link turned off", hint: `Turn ${ALIAS} back on on the ${URLS_PAGE} to show it again.` },
  EXPIRED: { badge: "Link expired", hint: `Give ${ALIAS} a later expiry date on the ${URLS_PAGE} to show it again.` },
  LIMIT_REACHED: { badge: "Visit limit reached", hint: `Raise the visit limit of ${ALIAS} on the ${URLS_PAGE} to show it again.` },
  BLOCKED: { badge: "Link blocked", hint: "Blocked links can't be shown. Remove this button." },
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
  return buttons.flatMap((button) => {
    const known = serverButtons.get(button.urlId)
    if (!known) return button.id === 0 ? [button] : []
    const { title, icon, visible } = button
    return [{ ...known, title, icon, visible, shownOnPage: visible && known.linkState === "LIVE" }]
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

export const isOlderBioPage = (page: Pick<BioPage, "updatedAt">, than: Pick<BioPage, "updatedAt">): boolean =>
  parseServerDateTime(page.updatedAt).getTime() < parseServerDateTime(than.updatedAt).getTime()

export const BIO_PAGE_CHANGED = "This page changed. Reload and try again."

export const BIO_LINK_DELETED = "A link on your page was deleted, so its button was removed. Check your page and save again."

export const bioConflictText = (message: string): string => (message === BIO_PAGE_CHANGED ? BIO_LINK_DELETED : message)

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

export const BUTTON_TITLE_REQUIRED = "Give the button a title"

export const BUTTON_TITLE_TOO_LONG = "Button title must be 60 characters or fewer"

const ASCII_SPACE_CONTROLS = new Set([0x09, 0x0a, 0x0b, 0x0c, 0x0d])
const KEPT_FORMAT_CHARACTERS = new Set([0x200c, 0x200d])
const FIRST_TAG = 0xe0020
const LAST_TAG = 0xe007f
const STRIPPED_FILLERS = new Set([0x115f, 0x1160, 0x3164, 0xffa0, 0x2065])
const BLANK_SYMBOLS = new Set([0x2800, 0xfffc])

const CONTROL = /^\p{Cc}$/u
const FORMAT = /^\p{Cf}$/u
const NEVER_VISIBLE = /^[\p{Cc}\p{Cf}\p{Mn}\p{Me}\p{Z}]$/u
const STACKED_MARKS = /([\p{Mn}\p{Me}](?:\p{Cf}*[\p{Mn}\p{Me}]){3})(?:\p{Cf}*[\p{Mn}\p{Me}])+/gu
const WHITESPACE_RUN = /[\s\p{Z}]+/gu
const LINE_BREAK = /\r\n?|\n/
const WHITESPACE_WITHIN_A_LINE = /(?:(?!\n)[\s\p{Z}])+/gu
const MAX_BIO_LINES = 5

const codePointOf = (value: string): number => value.codePointAt(0) ?? 0

const isStripped = (value: string): boolean => {
  const codePoint = codePointOf(value)
  if (CONTROL.test(value)) return !ASCII_SPACE_CONTROLS.has(codePoint)
  if (FORMAT.test(value)) return !KEPT_FORMAT_CHARACTERS.has(codePoint) && (codePoint < FIRST_TAG || codePoint > LAST_TAG)
  return STRIPPED_FILLERS.has(codePoint)
}

const isVisible = (value: string): boolean => !NEVER_VISIBLE.test(value) && !BLANK_SYMBOLS.has(codePointOf(value))

const normalizedText = (text: string): string =>
  Array.from(text)
    .filter((value) => !isStripped(value))
    .join("")
    .normalize("NFC")
    .replace(STACKED_MARKS, "$1")

const hasVisible = (text: string): boolean => Array.from(text).some(isVisible)

export const cleanBioText = (text: string): string => {
  const cleaned = normalizedText(text).replace(WHITESPACE_RUN, " ").replace(JAVA_STRIP_EDGES, "")
  return hasVisible(cleaned) ? cleaned : ""
}

export const cleanBioLines = (text: string): string => {
  const lines = normalizedText(text)
    .split(LINE_BREAK)
    .map((line) => line.replace(WHITESPACE_WITHIN_A_LINE, " ").replace(JAVA_STRIP_EDGES, ""))
    .filter(hasVisible)
  if (lines.length <= MAX_BIO_LINES) return lines.join("\n")
  return `${lines.slice(0, MAX_BIO_LINES - 1).join("\n")}\n${lines.slice(MAX_BIO_LINES - 1).join(" ")}`
}

export const bioOnOneLine = (bio: string): string => bio.split("\n").join(" · ")

export const buttonTitleError = (title: string): string | null => {
  const cleaned = cleanBioText(title)
  if (!cleaned) return BUTTON_TITLE_REQUIRED
  if (title.length > BIO_LIMITS.buttonTitle || cleaned.length > BIO_LIMITS.buttonTitle) return BUTTON_TITLE_TOO_LONG
  return null
}

export type BioButtonError = { field: "title" | "link"; text: string }

export type BioButtonErrors = Record<number, BioButtonError>

export const bioButtonTitleErrors = (buttons: readonly Pick<BioPageButton, "urlId" | "title">[]): BioButtonErrors => {
  const errors: BioButtonErrors = {}
  for (const button of buttons) {
    const text = buttonTitleError(button.title)
    if (text) errors[button.urlId] = { field: "title", text }
  }
  return errors
}

export const destinationHostOf = (longUrl: string): string => {
  if (!longUrl.trim()) return ""
  try {
    return new URL(longUrl.includes("://") ? longUrl : `https://${longUrl}`).hostname.toLowerCase()
  } catch {
    return ""
  }
}

export const newBioButton = ({ id, shortUrl, longUrl }: Pick<UrlResponse, "id" | "shortUrl" | "longUrl">): BioPageButton => {
  const destinationHost = destinationHostOf(longUrl)
  return {
    id: 0,
    urlId: id,
    shortUrl,
    destinationHost,
    title: defaultButtonTitle(destinationHost) || cutToLength(shortUrl, BIO_LIMITS.buttonTitle) || "Link",
    icon: guessIcon(destinationHost),
    visible: true,
    linkState: "LIVE",
    shownOnPage: true,
  }
}

export const bioButtonLabel = (button: Pick<BioPageButton, "title" | "shortUrl">): string =>
  cleanBioText(button.title) || `/${button.shortUrl}`

export const linkStateLabel = (state: unknown): { badge: string; hint: string } | null =>
  typeof state === "string" && Object.prototype.hasOwnProperty.call(LINK_STATE_LABELS, state)
    ? LINK_STATE_LABELS[state as Exclude<BioLinkState, "LIVE">]
    : null

export const linkStateHint = (state: unknown, shortUrl: string): string | null =>
  linkStateLabel(state)?.hint.replace(ALIAS, `/${shortUrl}`) ?? null

export type BioSaveErrors = { profile: Partial<Record<BioProfileField, string>>; buttons: BioButtonErrors }

const PROFILE_FIELD_KEYS = new Set<string>(["displayName", "bio"])

const BUTTON_FIELD_KEY = /^buttons\[(0|[1-9][0-9]*)\](?:\.(title|urlId))?$/

const LINK_NOT_WORKING = /^Only working links can be added\. \/(.+) isn't working right now\.$/

export const isLinkNotWorkingError = (text: string): boolean => LINK_NOT_WORKING.test(text)

type SentButton = Pick<BioPageButton, "urlId" | "shortUrl" | "title">

const oneButtonError = (button: SentButton | undefined, error: BioButtonError): BioSaveErrors | null =>
  button ? { profile: {}, buttons: { [button.urlId]: error } } : null

export const bioSaveErrors = (
  message: string,
  fields: Readonly<Record<string, string>>,
  sent: readonly SentButton[],
): BioSaveErrors | null => {
  const entries = Object.entries(fields)
  if (entries.length > 0) {
    const errors: BioSaveErrors = { profile: {}, buttons: {} }
    for (const [key, text] of entries) {
      if (PROFILE_FIELD_KEYS.has(key)) {
        errors.profile[key as BioProfileField] = text
        continue
      }
      const match = BUTTON_FIELD_KEY.exec(key)
      const button = match ? sent[Number(match[1])] : undefined
      if (!match || !button) return null
      errors.buttons[button.urlId] = { field: match[2] === "title" ? "title" : "link", text }
    }
    return errors
  }
  const profile = bioSaveFieldErrors(message)
  if (profile) return { profile, buttons: {} }
  if (message === BUTTON_TITLE_REQUIRED || message === BUTTON_TITLE_TOO_LONG) {
    return oneButtonError(sent.find((button) => buttonTitleError(button.title) === message), { field: "title", text: message })
  }
  const notWorking = LINK_NOT_WORKING.exec(message)
  if (notWorking) {
    return oneButtonError(sent.find((button) => button.shortUrl === notWorking[1]), { field: "link", text: message })
  }
  return null
}
