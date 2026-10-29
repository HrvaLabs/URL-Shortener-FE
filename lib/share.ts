export const NO_LINK_FOUND = "No link found in what was shared."

export interface SharedFields {
  url?: string | null
  text?: string | null
  title?: string | null
}

const HTTP_URL = /https?:\/\/[^\s<>"`]+/gi

const TRAILING_PUNCTUATION = new Set([
  ".", ",", ";", ":", "!", "?", "'",
  String.fromCodePoint(0x2019),
  String.fromCodePoint(0x201c),
  String.fromCodePoint(0x201d),
  String.fromCodePoint(0x00bb),
  String.fromCodePoint(0x2026),
])

const CLOSING_BRACKETS: Record<string, string> = { ")": "(", "]": "[", "}": "{" }

const count = (value: string, character: string) => value.split(character).length - 1

const endsWithStray = (candidate: string) => {
  const last = candidate.at(-1) ?? ""
  if (TRAILING_PUNCTUATION.has(last)) return true
  const opening = CLOSING_BRACKETS[last]
  return opening !== undefined && count(candidate, last) > count(candidate, opening)
}

const trimTrailing = (candidate: string) => {
  let trimmed = candidate
  while (trimmed && endsWithStray(trimmed)) trimmed = trimmed.slice(0, -1)
  return trimmed
}

const isHttpUrl = (candidate: string) => {
  try {
    const parsed = new URL(candidate)
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname !== ""
  } catch {
    return false
  }
}

export const firstHttpUrl = (value: string | null | undefined): string | null => {
  if (!value) return null
  for (const match of value.matchAll(HTTP_URL)) {
    const candidate = trimTrailing(match[0])
    if (isHttpUrl(candidate)) return candidate
  }
  return null
}

export const sharedLink = ({ url, text, title }: SharedFields): string | null =>
  firstHttpUrl(url) ?? firstHttpUrl(text) ?? firstHttpUrl(title)
