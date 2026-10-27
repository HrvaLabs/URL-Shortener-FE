import type { AnalyticsRange, AnalyticsTotals, BreakdownDimension, BreakdownEntry } from "./types"

export const ANALYTICS_RANGES: AnalyticsRange[] = [7, 30, 90, 365]

export const DEFAULT_ANALYTICS_RANGE: AnalyticsRange = 30

export const ANALYTICS_HISTORY_START = "2026-10-24"

export const rangeLabels: Record<AnalyticsRange, string> = {
  7: "7 days",
  30: "30 days",
  90: "90 days",
  365: "1 year",
}

export function parseAnalyticsRange(value: string | null): AnalyticsRange {
  return ANALYTICS_RANGES.find((range) => String(range) === value) ?? DEFAULT_ANALYTICS_RANGE
}

export function parseLinkId(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export type AnalyticsView = "links" | "bio"

export function parseAnalyticsView(value: string | null): AnalyticsView {
  return value === "bio" ? "bio" : "links"
}

export function analyticsHref({ link, days, view }: { link?: number | null; days?: AnalyticsRange; view?: AnalyticsView } = {}): string {
  const params = new URLSearchParams()
  if (link != null) params.set("link", String(link))
  else if (view === "bio") params.set("view", "bio")
  if (days != null && days !== DEFAULT_ANALYTICS_RANGE) params.set("days", String(days))
  const query = params.toString()
  return query ? `/dashboard/analytics?${query}` : "/dashboard/analytics"
}

/** A `yyyy-MM-dd` analytics day as local midnight, so it shows as the same calendar day in every time zone. */
export function analyticsDay(date: string): Date {
  return new Date(`${date}T00:00:00`)
}

const dateTimeWithoutOffset = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/

/** A backend date-time; one without an offset or `Z` is UTC, the server's time zone. */
export function parseServerDateTime(value: string): Date {
  return new Date(dateTimeWithoutOffset.test(value) ? `${value}Z` : value)
}

const fixedLabels: Record<Exclude<BreakdownDimension, "countries" | "referrers">, Record<string, string>> = {
  devices: { mobile: "Mobile", tablet: "Tablet", desktop: "Desktop", unknown: "Unknown" },
  browsers: {
    chrome: "Chrome",
    safari: "Safari",
    firefox: "Firefox",
    edge: "Edge",
    samsung: "Samsung Internet",
    opera: "Opera",
    "in-app": "In-app browser",
    other: "Other",
  },
  operatingSystems: {
    ios: "iOS",
    android: "Android",
    windows: "Windows",
    macos: "macOS",
    linux: "Linux",
    chromeos: "ChromeOS",
    other: "Other",
  },
  sources: { qr: "QR scans", direct: "Other clicks" },
}

export function qrSplit(totals: AnalyticsTotals, sources: BreakdownEntry[] | undefined): BreakdownEntry[] {
  const qr = (sources ?? []).find((entry) => entry.value === "qr")?.clicks ?? 0
  return [
    { value: "qr", clicks: qr },
    { value: "direct", clicks: Math.max(0, totals.clicks - qr) },
  ]
}

const referrerLabels: Record<string, string> = { direct: "Direct (no referrer)", unknown: "Unknown", other: "Other" }

const countryLabels: Record<string, string> = { unknown: "Unknown", tor: "Tor", other: "Other" }

let regionNames: Intl.DisplayNames | undefined

function countryName(code: string): string {
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" })
    return regionNames.of(code) ?? code
  } catch {
    return code
  }
}

export function breakdownLabel(dimension: BreakdownDimension, value: string): string {
  if (dimension === "referrers") {
    if (referrerLabels[value]) return referrerLabels[value]
    return value.startsWith("app:") ? `${value.slice(4)} (Android app)` : value
  }
  if (dimension === "countries") return countryLabels[value] ?? countryName(value)
  return fixedLabels[dimension][value] ?? (value === "other" ? "Other" : value)
}

export function countryFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return ""
  return String.fromCodePoint(...[...code.toUpperCase()].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65))
}
