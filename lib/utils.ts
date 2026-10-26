import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—"
  const d = new Date(date)
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—"
  const d = new Date(date)
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return "—"
  const d = new Date(date)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return "Expired"
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays < 7) return `${diffDays} days`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} ${weeks === 1 ? "week" : "weeks"}`
  }
  return formatDate(date)
}

const relativeTime = new Intl.RelativeTimeFormat("en")

const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
]

export function formatTimeAgo(date: string | Date | null): string {
  if (!date) return "—"
  const seconds = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000)
  for (const [unit, unitSeconds] of relativeUnits) {
    if (seconds >= unitSeconds) return relativeTime.format(-Math.floor(seconds / unitSeconds), unit)
  }
  return "just now"
}

export function plural(count: number, word: string): string {
  return `${count.toLocaleString()} ${word}${count === 1 ? "" : "s"}`
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return key
  return key.slice(0, 4) + "••••" + key.slice(-4)
}

const removeRowSelector = "[data-remove-row]"

export function focusTargetAfterRemoving(trigger: HTMLElement | null, fallback: HTMLElement | null): HTMLElement | null {
  const buttons = Array.from(trigger?.closest("table")?.querySelectorAll<HTMLElement>(removeRowSelector) ?? [])
  const index = trigger ? buttons.indexOf(trigger) : -1
  const neighbour = index === -1 ? undefined : (buttons[index + 1] ?? buttons[index - 1])
  return neighbour ?? fallback
}

const MAX_DESTINATION_LENGTH = 2048

export function destinationLengthError(url: string): string | null {
  return url.length > MAX_DESTINATION_LENGTH ? "Destination URL must be 2048 characters or fewer" : null
}

export function getApiBaseUrl(): string {
  if (process.env.NODE_ENV === "production") {
    return "https://hrva.cc/api/v1"
  }
  // Relative path — proxied to DEV_API_ORIGIN (default localhost:8080) via next.config.mjs rewrites during dev.
  return "/api/v1"
}

export function getBackendOrigin(): string {
  const baseUrl = getApiBaseUrl()
  // Strip the /api/v1 suffix to get the origin for OAuth2 endpoints
  return baseUrl.endsWith("/api/v1") ? baseUrl.slice(0, -7) : baseUrl
}

export function getShortBaseUrl(): string {
  if (process.env.NODE_ENV === "production") {
    return "https://hrva.cc"
  }
  return process.env.DEV_API_ORIGIN || "http://localhost:8080"
}

export function formatShortUrl(short: string): string {
  return `${getShortBaseUrl()}/${short}`
}

export function withQrMarker(shortLink: string): string {
  return `${shortLink}?qr`
}

export function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || /[\\\t\n\r]/.test(next)) return "/dashboard"
  return next
}

export function isLocalAccount(user: { authProvider?: string } | null | undefined): boolean {
  return !user?.authProvider || user.authProvider === "local"
}
