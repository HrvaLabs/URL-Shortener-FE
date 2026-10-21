const relativeTime = new Intl.RelativeTimeFormat("en")

const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
]

export function formatTimeAgo(date: string | null): string {
  if (!date) return "—"
  const seconds = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000)
  for (const [unit, unitSeconds] of relativeUnits) {
    if (seconds >= unitSeconds) return relativeTime.format(-Math.floor(seconds / unitSeconds), unit)
  }
  return "just now"
}

export function formatMegabytes(bytes: number | null): string {
  if (bytes == null) return "—"
  return `${(bytes / 1_048_576).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MB`
}
