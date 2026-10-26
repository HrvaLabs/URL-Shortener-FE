import { DEFAULT_ANALYTICS_RANGE } from "./analytics"
import type { AnalyticsRange, AnalyticsTotals } from "./types"

export type StatsTab = "traffic" | "links" | "users" | "safety" | "system"

export const statsTabLabels: Record<StatsTab, string> = {
  traffic: "Traffic",
  links: "Links",
  users: "Users",
  safety: "Safety",
  system: "System",
}

export const STATS_TABS: StatsTab[] = ["traffic"]

export const DEFAULT_STATS_TAB: StatsTab = "traffic"

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
