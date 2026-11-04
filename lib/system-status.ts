import { ApiError } from "./api-client"
import { formatDateTime, formatTimeAgo, parseServerDateTime, plural } from "./utils"
import type { SystemStatus, SystemStatusJob } from "./types"

export const ALL_SYSTEMS_WORKING = "All systems working"

export const NOT_SET_UP = "Not set up"

export const NEEDS_V230_BACKEND = "System status needs the v2.30 backend."

const UNKNOWN = "Unknown"

const DOT = String.fromCodePoint(0xb7)

const NEAR_LIMIT_SHARE = 0.9

export type ServiceState = "ok" | "warning" | "down" | "off"

export type ServiceKey = "database" | "redis" | "email" | "screenshots" | "virusTotal" | "blocklists"

export interface ServiceRow {
  key: ServiceKey
  name: string
  description: string
  state: ServiceState
  label: string
  details: string[]
}

export interface StateView {
  state: ServiceState
  label: string
}

const oneDecimal = (value: number) => value.toFixed(1).replace(/\.0$/, "")

const count = (value: number) => value.toLocaleString("en-US")

const present = (lines: (string | undefined)[]): string[] => lines.filter((line): line is string => line !== undefined)

export function unavailableReason(error: unknown): string | undefined {
  if (!(error instanceof ApiError) || error.status !== 503) return undefined
  const { detail } = error.problem
  return typeof detail === "string" && detail ? detail : undefined
}

export function trafficTitle(windowMinutes: number): string {
  if (windowMinutes === 60) return "Traffic, last hour"
  if (windowMinutes === 1) return "Traffic, last minute"
  return `Traffic, last ${count(windowMinutes)} minutes`
}

export function formatSeconds(seconds: number): string {
  if (Math.round(seconds * 10) / 10 < 60) return `${oneDecimal(seconds)} s`
  const total = Math.round(seconds)
  if (total < 3600) {
    const minutes = Math.floor(total / 60)
    const rest = total % 60
    return rest > 0 ? `${minutes} min ${rest} s` : `${minutes} min`
  }
  if (total < 86_400) {
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`
  }
  const days = Math.floor(total / 86_400)
  const hours = Math.floor((total % 86_400) / 3600)
  const dayText = `${days} ${days === 1 ? "day" : "days"}`
  return hours > 0 ? `${dayText} ${hours} h` : dayText
}

export function formatMilliseconds(milliseconds: number): string {
  if (milliseconds >= 999.5) return formatSeconds(milliseconds / 1000)
  if (milliseconds >= 10) return `${count(Math.round(milliseconds))} ms`
  return `${milliseconds.toLocaleString("en-US", { maximumSignificantDigits: 2 })} ms`
}

const BYTE_UNITS = ["KB", "MB"]

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${Math.round(bytes)} B`
  let value = bytes
  for (const unit of BYTE_UNITS) {
    value /= 1024
    if (Math.round(value) < 1024) return `${Math.round(value)} ${unit}`
  }
  return `${oneDecimal(value / 1024)} GB`
}

export function responseTimeText(p50Ms: number | null, p95Ms: number | null): string {
  if (p50Ms !== null && p95Ms !== null) return `Typical\u00A0${formatMilliseconds(p50Ms)} ${DOT} slowest\u00A05%\u00A0${formatMilliseconds(p95Ms)}`
  if (p50Ms !== null) return `Typical ${formatMilliseconds(p50Ms)}`
  if (p95Ms !== null) return `Slowest\u00A05%\u00A0${formatMilliseconds(p95Ms)}`
  return "No requests timed"
}

export function serverErrorsHint(serverErrors: number, requests: number): string | undefined {
  if (serverErrors === 0 || requests === 0) return undefined
  return `${oneDecimal((serverErrors / requests) * 100)}% of requests`
}

export function uptimeText(uptimeSeconds: number | null): string {
  return uptimeSeconds === null ? UNKNOWN : formatSeconds(uptimeSeconds)
}

export function startupText(startupSeconds: number | null): string | undefined {
  return startupSeconds === null ? undefined : `started in ${formatSeconds(startupSeconds)}`
}

export function memoryText(usedBytes: number | null, maxBytes: number | null): string {
  if (usedBytes === null) return UNKNOWN
  if (maxBytes === null) return formatByteSize(usedBytes)
  if (maxBytes <= 0) return `${formatByteSize(usedBytes)}, no maximum set`
  return `${formatByteSize(usedBytes)} of ${formatByteSize(maxBytes)}`
}

export function garbageCollectionText(pauseMsTotal: number | null): string {
  return pauseMsTotal === null ? UNKNOWN : `${formatMilliseconds(pauseMsTotal)} paused in total`
}

export function browserTimeText(usedSeconds: number | null, limitSeconds: number | null): string {
  if (usedSeconds === null) return "Browser time used today is unknown"
  if (limitSeconds === null) return `${formatSeconds(usedSeconds)} browser time used today`
  return `${formatSeconds(usedSeconds)} of ${formatSeconds(limitSeconds)} browser time used today`
}

export function lookupsText(lookups: number | null, dailyLimit: number | null): string {
  if (lookups === null) return "Lookups today are unknown"
  if (dailyLimit === null) return `${plural(lookups, "lookup")} today`
  return `${count(lookups)} of ${count(dailyLimit)} lookups today`
}

export function queuedText(queued: number | null): string | undefined {
  if (queued === null) return undefined
  return queued === 0 ? "Nothing queued" : `${count(queued)} queued`
}

export function pausedUntilText(pausedUntil: string | null): string | undefined {
  return pausedUntil === null ? undefined : `Paused until ${formatDateTime(pausedUntil)}`
}

const when = (value: string) => `${formatTimeAgo(value)} ${DOT} ${formatDateTime(value)}`

function limitState(used: number | null, limit: number | null, nearCounts: boolean): StateView {
  if (used !== null && limit !== null && limit > 0) {
    if (used >= limit) return { state: "warning", label: "Limit used up" }
    if (nearCounts && used >= limit * NEAR_LIMIT_SHARE) return { state: "warning", label: "Near the limit" }
  }
  return { state: "ok", label: "Working" }
}

interface LimitedService {
  configured: boolean
  enabled: boolean
  pausedUntil: string | null
}

function limitedServiceState(service: LimitedService, usage: StateView): StateView {
  if (!service.configured) return { state: "off", label: NOT_SET_UP }
  if (!service.enabled) return { state: "off", label: "Turned off" }
  if (service.pausedUntil !== null) return { state: "warning", label: "Paused" }
  return usage
}

export function serviceRows(status: SystemStatus): ServiceRow[] {
  const { database, redis, email, screenshots, virusTotal, blocklists } = status
  const screenshotsState = limitedServiceState(screenshots, limitState(screenshots.browserSecondsToday, screenshots.browserSecondsLimit, true))
  const virusTotalState = limitedServiceState(virusTotal, limitState(virusTotal.lookupsToday, virusTotal.dailyLimit, false))
  const databaseDown = !database.up
  const notChecked = ["Not checked while the database is down."]
  const emailState: StateView = databaseDown
    ? { state: "off", label: UNKNOWN }
    : email.failures24h > 0
      ? { state: "warning", label: "Failures" }
      : email.lastSentAt === null
        ? { state: "off", label: "No emails yet" }
        : { state: "ok", label: "Working" }

  return [
    {
      key: "database",
      name: "Database",
      description: "PostgreSQL connection",
      state: database.up ? "ok" : "down",
      label: database.up ? "Connected" : "Disconnected",
      details: database.up
        ? present([
            database.latencyMs === null ? undefined : `Ping ${formatMilliseconds(database.latencyMs)}`,
            database.poolActive === null || database.poolMax === null ? undefined : `${count(database.poolActive)} of ${count(database.poolMax)} connections in use`,
          ])
        : [],
    },
    {
      key: "redis",
      name: "Cache (Redis)",
      description: "In-memory data store",
      state: redis.up ? "ok" : "down",
      label: redis.up ? "Connected" : "Disconnected",
      details: redis.up
        ? present([
            redis.latencyMs === null ? undefined : `Ping ${formatMilliseconds(redis.latencyMs)}`,
            redis.hitRatio === null ? "No cache reads yet" : `Hit ratio ${oneDecimal(redis.hitRatio)}%`,
          ])
        : [],
    },
    {
      key: "email",
      name: "Email",
      description: "Email delivery over SMTP",
      ...emailState,
      details: databaseDown
        ? notChecked
        : [
            email.lastSentAt === null ? "No email sent yet" : `Last sent ${when(email.lastSentAt)}`,
            email.failures24h === 0 ? "No failures in the last 24 h" : `${plural(email.failures24h, "failure")} in the last 24 h`,
          ],
    },
    {
      key: "screenshots",
      name: "Screenshots",
      description: "Screenshots of link destinations, taken with Cloudflare Browser Run",
      ...screenshotsState,
      details: screenshots.configured
        ? present([
            browserTimeText(screenshots.browserSecondsToday, screenshots.browserSecondsLimit),
            queuedText(screenshots.queued),
            pausedUntilText(screenshots.pausedUntil),
          ])
        : [],
    },
    {
      key: "virusTotal",
      name: "VirusTotal",
      description: "Lookups of link destinations on VirusTotal",
      ...virusTotalState,
      details: virusTotal.configured
        ? present([lookupsText(virusTotal.lookupsToday, virusTotal.dailyLimit), queuedText(virusTotal.queued), pausedUntilText(virusTotal.pausedUntil)])
        : [],
    },
    {
      key: "blocklists",
      name: "Blocklists",
      description: "Lists of harmful domains that links are checked against",
      state: databaseDown ? "off" : blocklists.stale.length > 0 ? "down" : "ok",
      label: databaseDown ? UNKNOWN : blocklists.stale.length > 0 ? `${count(blocklists.stale.length)} stale` : "Up to date",
      details: databaseDown
        ? notChecked
        : [
            blocklists.lastRefreshAt === null ? "Never refreshed" : `Last refresh ${when(blocklists.lastRefreshAt)}`,
            blocklists.stale.length > 0 ? `Stale: ${blocklists.stale.join(", ")}` : "None stale",
          ],
    },
  ]
}

export function sortedJobs(jobs: SystemStatusJob[]): SystemStatusJob[] {
  return [...jobs.filter((job) => job.lastOutcome === "FAILED"), ...jobs.filter((job) => job.lastOutcome !== "FAILED")]
}

const time = (value: string) => parseServerDateTime(value).getTime()

function isRunning(job: SystemStatusJob): boolean {
  if (job.lastStartedAt === null) return false
  return job.lastFinishedAt === null || time(job.lastStartedAt) > time(job.lastFinishedAt)
}

export function jobOutcome(job: SystemStatusJob): StateView {
  if (job.lastStartedAt === null) return { state: "off", label: "No run yet" }
  if (isRunning(job)) return { state: "off", label: "Running" }
  if (job.lastOutcome === "FAILED") return { state: "down", label: "Failed" }
  if (job.lastOutcome === "OK") return { state: "ok", label: "OK" }
  return { state: "off", label: "No run yet" }
}

export function jobLastRunLines(job: SystemStatusJob): string[] {
  if (job.lastStartedAt === null) return ["Not since the server started"]
  const started = formatDateTime(job.lastStartedAt)
  if (job.lastFinishedAt === null || isRunning(job)) return [formatTimeAgo(job.lastStartedAt), started]
  return [formatTimeAgo(job.lastStartedAt), `${started}, took ${formatMilliseconds(time(job.lastFinishedAt) - time(job.lastStartedAt))}`]
}

export function jobErrorText(job: SystemStatusJob): string {
  if (jobOutcome(job).state !== "down") return "None"
  return job.lastError ?? "No error message"
}
