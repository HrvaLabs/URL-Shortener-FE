import { formatDateTime, formatTimeAgo, parseServerDateTime, plural, toDateInputValue } from "./utils"

export const MAX_EXPIRY_DAYS = 3650

export type ExpiryChoice = "30" | "90" | "365" | "custom" | "never"

export type ExpiryChange = { expiresInDays: number } | { neverExpires: true }

export type ExpiryResult = { change: ExpiryChange } | { error: string }

export const DEFAULT_EXPIRY_CHOICE: ExpiryChoice = "90"

export const EXPIRY_OPTIONS: { value: ExpiryChoice; label: string }[] = [
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
  { value: "custom", label: "Custom date…" },
  { value: "never", label: "No expiry" },
]

export const NEVER_EXPIRES_NOTE = "This key works until you revoke it."

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const localDayNumber = (year: number, monthIndex: number, day: number): number => Date.UTC(year, monthIndex, day) / MILLISECONDS_PER_DAY

/** Whole calendar days from `today` to a `yyyy-MM-dd` date, or null when the text is not a real date. */
export function daysFromToday(date: string, today: Date): number | null {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!parts) return null
  const [year, month, day] = [Number(parts[1]), Number(parts[2]), Number(parts[3])]
  const real = new Date(year, month - 1, day)
  if (real.getFullYear() !== year || real.getMonth() !== month - 1 || real.getDate() !== day) return null
  return localDayNumber(year, month - 1, day) - localDayNumber(today.getFullYear(), today.getMonth(), today.getDate())
}

/** What to send for the chosen expiry, or the sentence to show when a custom date can't be used. */
export function expiryChange(choice: ExpiryChoice, customDate: string, today: Date): ExpiryResult {
  if (choice === "never") return { change: { neverExpires: true } }
  if (choice !== "custom") return { change: { expiresInDays: Number(choice) } }
  const days = daysFromToday(customDate, today)
  if (days === null) return { error: "Pick a date." }
  if (days < 1) return { error: "Pick a date from tomorrow." }
  if (days > MAX_EXPIRY_DAYS) return { error: `Pick a date within ${MAX_EXPIRY_DAYS.toLocaleString("en-US")} days.` }
  return { change: { expiresInDays: days } }
}

export const keyPrefixText = (keyPrefix: string): string => `${keyPrefix}\u2026`

export const requestsText = (requests: number): string => plural(requests, "request")

export const lastUsedText = (lastUsedAt: string | null | undefined): string =>
  lastUsedAt ? `Last used ${formatTimeAgo(parseServerDateTime(lastUsedAt))}` : "Never used"

/** An expiry from the backend (a UTC instant) as the viewer's local date and time. */
export const expiryDateTimeText = (expirationDate: string): string => formatDateTime(parseServerDateTime(expirationDate))

export const expiresText = (expirationDate: string | null | undefined): string =>
  expirationDate ? `Expires ${expiryDateTimeText(expirationDate)}` : "Never expires"

export interface ExpiryPrefill {
  choice: ExpiryChoice
  date: string
  expiredOn: string | null
}

/** The Expires field's starting state for a key: no expiry, a future instant as its local date, or the default when it has already passed. */
export function expiryPrefill(expirationDate: string | null | undefined, now: Date): ExpiryPrefill {
  if (!expirationDate) return { choice: "never", date: "", expiredOn: null }
  const instant = parseServerDateTime(expirationDate)
  if (Number.isNaN(instant.getTime())) return { choice: DEFAULT_EXPIRY_CHOICE, date: "", expiredOn: null }
  if (instant.getTime() <= now.getTime()) return { choice: DEFAULT_EXPIRY_CHOICE, date: "", expiredOn: expiryDateTimeText(expirationDate) }
  return { choice: "custom", date: toDateInputValue(instant), expiredOn: null }
}
