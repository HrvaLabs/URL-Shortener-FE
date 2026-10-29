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

const MAX_CANDIDATE_LENGTH = 2048

const count = (value: string, character: string) => value.split(character).length - 1

const trimTrailing = (candidate: string) => {
  const unmatched = new Map(
    Object.entries(CLOSING_BRACKETS).map(([closing, opening]) => [closing, count(candidate, closing) - count(candidate, opening)]),
  )
  let end = candidate.length
  while (end > 0) {
    const last = candidate[end - 1]
    if (TRAILING_PUNCTUATION.has(last)) {
      end -= 1
      continue
    }
    const surplus = unmatched.get(last)
    if (surplus === undefined || surplus <= 0) break
    unmatched.set(last, surplus - 1)
    end -= 1
  }
  return candidate.slice(0, end)
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
    if (match[0].length > MAX_CANDIDATE_LENGTH) continue
    const candidate = trimTrailing(match[0])
    if (isHttpUrl(candidate)) return candidate
  }
  return null
}

export const sharedLink = ({ url, text, title }: SharedFields): string | null =>
  firstHttpUrl(url) ?? firstHttpUrl(text) ?? firstHttpUrl(title)
