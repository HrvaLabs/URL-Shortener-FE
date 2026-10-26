import { DEFAULT_ANALYTICS_RANGE } from "./analytics"
import type { AnalyticsRange, AnalyticsTotals, CreatedVia, EmailStatus, ReviewResolution, ReviewSource } from "./types"

export type StatsTab = "traffic" | "links" | "users" | "safety" | "system"

export const statsTabLabels: Record<StatsTab, string> = {
  traffic: "Traffic",
  links: "Links",
  users: "Users",
  safety: "Safety",
  system: "System",
}

export const STATS_TABS: StatsTab[] = ["traffic", "links", "users", "safety", "system"]

export const DEFAULT_STATS_TAB: StatsTab = "traffic"

export const createdViaLabels: Record<CreatedVia | "unknown", string> = {
  WEB: "Website, signed in",
  API_KEY: "API key",
  BULK: "Bulk",
  MCP: "AI connector, signed in",
  ANONYMOUS_WEB: "Website, no account",
  ANONYMOUS_MCP: "AI connector, no account",
  unknown: "Unknown (made before this was recorded)",
}

export type SignInProvider = "local" | "google" | "github"

export const providerLabels: Record<SignInProvider, string> = {
  local: "Email and password",
  google: "Google",
  github: "GitHub",
}

export const reviewSourceLabels: Record<ReviewSource, string> = {
  SYSTEM: "Flagged by the checks",
  VISITOR: "Reported by visitors",
}

export const resolutionLabels: Record<ReviewResolution, string> = {
  OK: "Looks fine",
  DOMAIN_TRUSTED: "Domain trusted",
  LINK_BLOCKED: "Link blocked",
  DOMAIN_BLOCKED: "Domain blocked",
  USER_BLOCKED: "User blocked",
  DESTINATION_CHANGED: "Destination changed",
}

export const emailStatusLabels: Record<EmailStatus, string> = {
  SENT: "Sent",
  FAILED: "Failed",
  SENDING: "Sending",
  RESENT: "Resent",
}

export const redisPrefixLabels: Record<string, string> = {
  "blocklist:": "Blocklists",
  "rate-limit:": "Rate limits",
  "analytics:": "Visitor counting (daily keys)",
  "rdap:": "Domain age lookups",
  "dbl:": "Spamhaus lookups",
  "mcp:connect:": "AI connector sign-ins",
  "urls::": "Link cache",
}

export function parseStatsTab(value: string | null): StatsTab {
  return STATS_TABS.find((tab) => tab === value) ?? DEFAULT_STATS_TAB
}

export function adminStatsHref({ tab, days }: { tab?: StatsTab; days?: AnalyticsRange } = {}): string {
  const params = new URLSearchParams()
  if (tab != null && tab !== DEFAULT_STATS_TAB) params.set("tab", tab)
  if (days != null && days !== DEFAULT_ANALYTICS_RANGE) params.set("days", String(days))
  const query = params.toString()
  return query ? `/admin/dashboard?${query}` : "/admin/dashboard"
}

/** Bot clicks as a percentage (0 to 100) of all clicks, bots included; `null` when there were none. */
export function botShare(totals: AnalyticsTotals): number | null {
  const all = totals.clicks + totals.botClicks
  return all === 0 ? null : (totals.botClicks / all) * 100
}

const byteUnits = ["KB", "MB", "GB"]

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return "—"
  if (bytes < 1024) return `${bytes} B`
  let value = bytes / 1024
  let unit = 0
  while (unit < byteUnits.length - 1 && Number(value.toFixed(1)) >= 1024) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(1)} ${byteUnits[unit]}`
}

const minutesPerHour = 60
const minutesPerDay = 24 * minutesPerHour

export function formatMinutes(minutes: number | null): string {
  if (minutes == null || !Number.isFinite(minutes)) return "—"
  if (minutes < 1) return "< 1 min"
  if (minutes < minutesPerHour) return `${Math.floor(minutes)} min`
  if (minutes < 2 * minutesPerDay) return `${(minutes / minutesPerHour).toFixed(1)} h`
  return `${(minutes / minutesPerDay).toFixed(1)} days`
}
