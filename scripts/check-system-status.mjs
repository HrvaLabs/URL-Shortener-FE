import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import "./resolve-ts-imports.mjs"

const systemStatus = await import("../lib/system-status.ts")
const { formatDateTime, formatTimeAgo } = await import("../lib/utils.ts")
const { ApiError } = await import("../lib/api-client.ts")

const {
  ALL_SYSTEMS_WORKING,
  NOT_SET_UP,
  NEEDS_V230_BACKEND,
  trafficTitle,
  responseTimeText,
  serverErrorsHint,
  formatMilliseconds,
  formatSeconds,
  formatByteSize,
  uptimeText,
  startupText,
  memoryText,
  garbageCollectionText,
  browserTimeText,
  lookupsText,
  queuedText,
  pausedUntilText,
  serviceRows,
  unavailableReason,
  sortedJobs,
  jobOutcome,
  jobLastRunLines,
  jobErrorText,
  jobErrorReason,
  jobGroups,
  jobScheduleText,
  problemLines,
  outOfDate,
  shownError,
  showsSkeleton,
  SCREENSHOTS_SET_UP,
  VIRUSTOTAL_SET_UP,
} = systemStatus

const check = (name, run) => {
  try {
    run()
  } catch (error) {
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
    process.exit(1)
  }
}

const DOT = String.fromCodePoint(0xb7)

const status = (overrides = {}) => ({
  summary: { ok: true, problems: [] },
  traffic: { windowMinutes: 60, requests: 1200, redirects: 900, p50Ms: 62, p95Ms: 240, serverErrors: 0 },
  database: { up: true, latencyMs: 1.2, poolActive: 2, poolMax: 10 },
  redis: { up: true, latencyMs: 0.8, hitRatio: 99.5 },
  email: { lastSentAt: "2026-11-02T15:25:00", failures24h: 0 },
  screenshots: { configured: true, enabled: true, browserSecondsToday: 42, browserSecondsLimit: 600, queued: 0, pausedUntil: null },
  virusTotal: { configured: true, enabled: true, lookupsToday: 3, dailyLimit: 480, queued: 0, pausedUntil: null },
  blocklists: { lastRefreshAt: "2026-11-03T21:00:00", stale: [] },
  server: { version: "v2.30", startedAt: "2026-11-03T21:28:06", uptimeSeconds: 11520, startupSeconds: 25.5, heapUsedBytes: 429916160, heapMaxBytes: 1181116006, gcPauseMsTotal: 340 },
  jobs: [],
  ...overrides,
})

const row = (rows, key) => {
  const found = rows.find((entry) => entry.key === key)
  assert.ok(found, `no ${key} row`)
  return found
}

const job = (overrides = {}) => ({
  name: "deactivateExpiredUrls",
  label: "Turn off expired links",
  lastStartedAt: "2026-11-03T21:00:00",
  lastFinishedAt: "2026-11-03T21:00:01.200",
  lastOutcome: "OK",
  lastError: null,
  ...overrides,
})

check("the fixed copy is exact", () => {
  assert.equal(ALL_SYSTEMS_WORKING, "All systems working")
  assert.equal(NOT_SET_UP, "Not set up")
  assert.equal(NEEDS_V230_BACKEND, "System status needs the v2.30 backend.")
})

check("the traffic title names the window", () => {
  assert.equal(trafficTitle(60), "Traffic, last hour")
  assert.equal(trafficTitle(30), "Traffic, last 30 minutes")
  assert.equal(trafficTitle(1), "Traffic, last minute")
  assert.equal(trafficTitle(120), "Traffic, last 120 minutes")
})

check("milliseconds", () => {
  assert.equal(formatMilliseconds(62), "62 ms")
  assert.equal(formatMilliseconds(240.4), "240 ms")
  assert.equal(formatMilliseconds(1.2), "1.2 ms")
  assert.equal(formatMilliseconds(0.8), "0.8 ms")
  assert.equal(formatMilliseconds(0.04), "0.04 ms")
  assert.equal(formatMilliseconds(0), "0 ms")
  assert.equal(formatMilliseconds(5), "5 ms")
  assert.equal(formatMilliseconds(999.6), "1 s")
  assert.equal(formatMilliseconds(1234), "1.2 s")
  assert.equal(formatMilliseconds(65_000), "1 min 5 s")
})

check("response time is typical and slowest 5%", () => {
  assert.equal(responseTimeText(62, 240), `Typical\u00A062 ms ${DOT} slowest\u00A05%\u00A0240 ms`)
  assert.equal(responseTimeText(1.2, 9.6), `Typical\u00A01.2 ms ${DOT} slowest\u00A05%\u00A09.6 ms`)
  assert.equal(responseTimeText(null, null), "No requests timed")
  assert.equal(responseTimeText(62, null), "Typical 62 ms")
  assert.equal(responseTimeText(null, 240), "Slowest\u00A05%\u00A0240 ms")
})

check("server errors carry their share of requests", () => {
  assert.equal(serverErrorsHint(0, 1200), undefined)
  assert.equal(serverErrorsHint(3, 200), "1.5% of requests")
  assert.equal(serverErrorsHint(1, 3), "33.3% of requests")
  assert.equal(serverErrorsHint(2, 0), undefined)
  assert.equal(serverErrorsHint(3, 200, 0, 5), "1.5% of requests, none in the last 5 minutes")
  assert.equal(serverErrorsHint(3, 200, 2, 5), "1.5% of requests, 2 in the last 5 minutes")
  assert.equal(serverErrorsHint(0, 200, 0, 5), undefined)
})

check("problem sentences show their time in the browser's zone and form, like the tables", () => {
  const at = "2026-11-04T02:19:00Z"
  const lines = problemLines({
    ok: false,
    problems: ["Background jobs: Turn off expired links failed at 4 November 2026 at 02:19 UTC. The database wasn't reachable."],
    items: [
      { text: "Background jobs: Turn off expired links failed at {at}.", at, detail: "The database wasn't reachable." },
      { text: "Cache (Redis): not reachable.", at: null, detail: "Links still open from the database." },
      { text: "Server errors: 82 of 290 requests in the last 60 minutes, none in the last 5 minutes.", at: null, detail: null },
    ],
  })
  assert.deepEqual(lines, [
    { text: `Background jobs: Turn off expired links failed at ${formatDateTime(at)}.`, detail: "The database wasn't reachable." },
    { text: "Cache (Redis): not reachable.", detail: "Links still open from the database." },
    { text: "Server errors: 82 of 290 requests in the last 60 minutes, none in the last 5 minutes." },
  ])
  assert.doesNotMatch(lines[0].text, /UTC/)
})

check("a v2.30 backend's sentences are shown as they are", () => {
  assert.deepEqual(problemLines({ ok: false, problems: ["Redis: not reachable."] }), [{ text: "Redis: not reachable." }])
})

check("seconds as a duration", () => {
  assert.equal(formatSeconds(0), "0 s")
  assert.equal(formatSeconds(42), "42 s")
  assert.equal(formatSeconds(42.0), "42 s")
  assert.equal(formatSeconds(25.5), "25.5 s")
  assert.equal(formatSeconds(25.54), "25.5 s")
  assert.equal(formatSeconds(59.96), "1 min")
  assert.equal(formatSeconds(60), "1 min")
  assert.equal(formatSeconds(90), "1 min 30 s")
  assert.equal(formatSeconds(600), "10 min")
  assert.equal(formatSeconds(3599.6), "1 h")
  assert.equal(formatSeconds(3600), "1 h")
  assert.equal(formatSeconds(11520), "3 h 12 min")
  assert.equal(formatSeconds(86_400), "1 day")
  assert.equal(formatSeconds(86_400 * 2 + 3600 * 4 + 59), "2 days 4 h")
  assert.equal(formatSeconds(86_400 + 120), "1 day")
})

check("bytes", () => {
  assert.equal(formatByteSize(0), "0 B")
  assert.equal(formatByteSize(512), "512 B")
  assert.equal(formatByteSize(2048), "2 KB")
  assert.equal(formatByteSize(429916160), "410 MB")
  assert.equal(formatByteSize(1181116006), "1.1 GB")
  assert.equal(formatByteSize(2 * 1024 ** 3), "2 GB")
  assert.equal(formatByteSize(1023.7 * 1024 ** 2), "1 GB")
})

check("the server lines", () => {
  assert.equal(uptimeText(11520), "3 h 12 min")
  assert.equal(uptimeText(45), "45 s")
  assert.equal(uptimeText(null), "Unknown")
  assert.equal(startupText(25.5), "started in 25.5 s")
  assert.equal(startupText(null), undefined)
  assert.equal(memoryText(429916160, 1181116006), "410 MB of 1.1 GB")
  assert.equal(memoryText(429916160, -1), "410 MB, no maximum set")
  assert.equal(memoryText(429916160, 0), "410 MB, no maximum set")
  assert.equal(memoryText(null, 1181116006), "Unknown")
  assert.equal(garbageCollectionText(340), "340 ms paused in total")
  assert.equal(garbageCollectionText(12_345), "12.3 s paused in total")
  assert.equal(garbageCollectionText(null), "Unknown")
})

check("the browser time and lookup sentences", () => {
  assert.equal(browserTimeText(42, 600), "42 s of 10 min browser time used today")
  assert.equal(browserTimeText(0, 600), "0 s of 10 min browser time used today")
  assert.equal(browserTimeText(125.4, 600), "2 min 5 s of 10 min browser time used today")
  assert.equal(browserTimeText(42, null), "42 s browser time used today")
  assert.equal(browserTimeText(null, 600), "Browser time used today is unknown")
  assert.equal(lookupsText(3, 480), "3 of 480 lookups today")
  assert.equal(lookupsText(1, 480), "1 of 480 lookups today")
  assert.equal(lookupsText(1234, 2000), "1,234 of 2,000 lookups today")
  assert.equal(lookupsText(1, null), "1 lookup today")
  assert.equal(lookupsText(null, 480), "Lookups today are unknown")
})

check("queued and paused", () => {
  assert.equal(queuedText(0), "Nothing queued")
  assert.equal(queuedText(1), "1 queued")
  assert.equal(queuedText(1500), "1,500 queued")
  assert.equal(queuedText(null), undefined)
  assert.equal(pausedUntilText(null), undefined)
  assert.equal(pausedUntilText("2026-11-03T22:00:00"), `Paused until ${formatDateTime("2026-11-03T22:00:00")}`)
})

check("every service gets a row in order", () => {
  assert.deepEqual(
    serviceRows(status()).map((entry) => entry.key),
    ["database", "redis", "email", "screenshots", "virusTotal", "blocklists"],
  )
  for (const entry of serviceRows(status())) {
    assert.ok(entry.name && entry.description && entry.label, `${entry.key} misses copy`)
  }
})

check("all working: every pill is ok", () => {
  const rows = serviceRows(status())
  assert.deepEqual(
    rows.map((entry) => [entry.key, entry.state, entry.label]),
    [
      ["database", "ok", "Connected"],
      ["redis", "ok", "Connected"],
      ["email", "ok", "Working"],
      ["screenshots", "ok", "Working"],
      ["virusTotal", "ok", "Working"],
      ["blocklists", "ok", "Up to date"],
    ],
  )
  assert.deepEqual(row(rows, "database").details, ["Ping 1.2 ms", "2 of 10 connections in use"])
  assert.deepEqual(row(rows, "redis").details, ["Ping 0.8 ms", "Hit ratio 99.5%"])
  assert.deepEqual(row(rows, "email").details, [
    `Last sent ${formatTimeAgo("2026-11-02T15:25:00")} ${DOT} ${formatDateTime("2026-11-02T15:25:00")}`,
    "No failures in the last 24 h",
  ])
  assert.deepEqual(row(rows, "screenshots").details, ["42 s of 10 min browser time used today", "Nothing queued"])
  assert.deepEqual(row(rows, "virusTotal").details, ["3 of 480 lookups today", "Nothing queued"])
  assert.deepEqual(row(rows, "blocklists").details, [
    `Last refresh ${formatTimeAgo("2026-11-03T21:00:00")} ${DOT} ${formatDateTime("2026-11-03T21:00:00")}`,
    "None stale",
  ])
})

check("database and redis down", () => {
  const rows = serviceRows(status({ database: { up: false, latencyMs: null, poolActive: null, poolMax: null }, redis: { up: false, latencyMs: null, hitRatio: null } }))
  assert.equal(row(rows, "database").state, "down")
  assert.equal(row(rows, "database").label, "Disconnected")
  assert.deepEqual(row(rows, "database").details, [])
  assert.equal(row(rows, "redis").state, "down")
  assert.equal(row(rows, "redis").label, "Disconnected")
  assert.deepEqual(row(rows, "redis").details, [])
})

check("email and blocklists are unknown while the database is down", () => {
  const rows = serviceRows(
    status({
      database: { up: false, latencyMs: null, poolActive: null, poolMax: null },
      email: { lastSentAt: "2026-11-02T15:25:00", failures24h: 0 },
      blocklists: { lastRefreshAt: "2026-11-03T21:00:00", stale: [] },
    }),
  )
  for (const key of ["email", "blocklists"]) {
    assert.equal(row(rows, key).state, "off")
    assert.equal(row(rows, key).label, "Unknown")
    assert.deepEqual(row(rows, key).details, ["Not checked while the database is down."])
  }
})

check("a 503 reason is only the problem detail", () => {
  assert.equal(unavailableReason(new ApiError("Database is down.", 503, {}, { detail: "Database is down." })), "Database is down.")
  assert.equal(unavailableReason(new ApiError("Service Unavailable", 503)), undefined)
  assert.equal(unavailableReason(new ApiError("Service Unavailable", 503, {}, { title: "Service Unavailable", detail: "" })), undefined)
  assert.equal(unavailableReason(new ApiError("Bad gateway", 502, {}, { detail: "Upstream failed." })), undefined)
  assert.equal(unavailableReason(new Error("Database is down.")), undefined)
})

check("redis with no cache reads yet", () => {
  assert.deepEqual(row(serviceRows(status({ redis: { up: true, latencyMs: 0.5, hitRatio: null } })), "redis").details, ["Ping 0.5 ms", "No cache reads yet"])
  assert.deepEqual(row(serviceRows(status({ redis: { up: true, latencyMs: 0.5, hitRatio: 100 } })), "redis").details, ["Ping 0.5 ms", "Hit ratio 100%"])
})

check("email failures and no email yet", () => {
  const failing = row(serviceRows(status({ email: { lastSentAt: "2026-11-02T15:25:00", failures24h: 2 } })), "email")
  assert.equal(failing.state, "warning")
  assert.equal(failing.label, "Failures")
  assert.equal(failing.details[1], "2 failures in the last 24 h")
  assert.equal(row(serviceRows(status({ email: { lastSentAt: null, failures24h: 1 } })), "email").details[1], "1 failure in the last 24 h")
  const none = row(serviceRows(status({ email: { lastSentAt: null, failures24h: 0 } })), "email")
  assert.equal(none.state, "off")
  assert.equal(none.label, "No emails yet")
  assert.deepEqual(none.details, ["No email sent yet", "No failures in the last 24 h"])
})

check("screenshots and VirusTotal not set up name the settings to set", () => {
  const rows = serviceRows(
    status({
      screenshots: { configured: false, enabled: true, browserSecondsToday: null, browserSecondsLimit: null, queued: null, pausedUntil: null },
      virusTotal: { configured: false, enabled: false, lookupsToday: null, dailyLimit: null, queued: null, pausedUntil: null },
    }),
  )
  for (const key of ["screenshots", "virusTotal"]) {
    assert.equal(row(rows, key).state, "off")
    assert.equal(row(rows, key).label, NOT_SET_UP)
  }
  assert.deepEqual(row(rows, "screenshots").details, [SCREENSHOTS_SET_UP])
  assert.deepEqual(row(rows, "virusTotal").details, [VIRUSTOTAL_SET_UP])
  assert.equal(SCREENSHOTS_SET_UP, "Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_BROWSER_API_TOKEN.")
  assert.equal(VIRUSTOTAL_SET_UP, "Set VIRUSTOTAL_API_KEY.")
})

check("screenshots and VirusTotal turned off in the settings", () => {
  const rows = serviceRows(
    status({
      screenshots: { configured: true, enabled: false, browserSecondsToday: 0, browserSecondsLimit: 600, queued: 0, pausedUntil: null },
      virusTotal: { configured: true, enabled: false, lookupsToday: 0, dailyLimit: 480, queued: 0, pausedUntil: null },
    }),
  )
  assert.equal(row(rows, "screenshots").state, "off")
  assert.equal(row(rows, "screenshots").label, "Turned off")
  assert.deepEqual(row(rows, "screenshots").details, ["0 s of 10 min browser time used today", "Nothing queued"])
  assert.equal(row(rows, "virusTotal").label, "Turned off")
})

check("screenshots paused, near and at the limit", () => {
  const paused = row(
    serviceRows(status({ screenshots: { configured: true, enabled: true, browserSecondsToday: 600, browserSecondsLimit: 600, queued: 4, pausedUntil: "2026-11-04T00:00:00" } })),
    "screenshots",
  )
  assert.equal(paused.state, "warning")
  assert.equal(paused.label, "Paused")
  assert.deepEqual(paused.details, ["10 min of 10 min browser time used today", "4 queued", `Paused until ${formatDateTime("2026-11-04T00:00:00")}`])
  const used = row(serviceRows(status({ screenshots: { configured: true, enabled: true, browserSecondsToday: 600, browserSecondsLimit: 600, queued: 0, pausedUntil: null } })), "screenshots")
  assert.equal(used.state, "warning")
  assert.equal(used.label, "Limit used up")
  const near = row(serviceRows(status({ screenshots: { configured: true, enabled: true, browserSecondsToday: 540, browserSecondsLimit: 600, queued: 0, pausedUntil: null } })), "screenshots")
  assert.equal(near.state, "warning")
  assert.equal(near.label, "Near the limit")
  const below = row(serviceRows(status({ screenshots: { configured: true, enabled: true, browserSecondsToday: 539, browserSecondsLimit: 600, queued: 0, pausedUntil: null } })), "screenshots")
  assert.equal(below.label, "Working")
})

check("VirusTotal paused and at the limit", () => {
  const paused = row(serviceRows(status({ virusTotal: { configured: true, enabled: true, lookupsToday: 12, dailyLimit: 480, queued: 2, pausedUntil: "2026-11-03T22:01:00" } })), "virusTotal")
  assert.equal(paused.state, "warning")
  assert.equal(paused.label, "Paused")
  assert.deepEqual(paused.details, ["12 of 480 lookups today", "2 queued", `Paused until ${formatDateTime("2026-11-03T22:01:00")}`])
  const used = row(serviceRows(status({ virusTotal: { configured: true, enabled: true, lookupsToday: 480, dailyLimit: 480, queued: 0, pausedUntil: null } })), "virusTotal")
  assert.equal(used.label, "Limit used up")
  const near = row(serviceRows(status({ virusTotal: { configured: true, enabled: true, lookupsToday: 470, dailyLimit: 480, queued: 0, pausedUntil: null } })), "virusTotal")
  assert.equal(near.label, "Working")
})

check("stale blocklists are named", () => {
  const stale = row(serviceRows(status({ blocklists: { lastRefreshAt: "2026-11-03T21:00:00", stale: ["URLhaus", "Phishing Army"] } })), "blocklists")
  assert.equal(stale.state, "down")
  assert.equal(stale.label, "2 stale")
  assert.equal(stale.details[1], "Stale: URLhaus, Phishing Army")
  const never = row(serviceRows(status({ blocklists: { lastRefreshAt: null, stale: [] } })), "blocklists")
  assert.deepEqual(never.details, ["Never refreshed", "None stale"])
})

check("failed jobs come first, the rest keep their order", () => {
  const jobs = [job({ name: "a", label: "A" }), job({ name: "b", label: "B", lastOutcome: "FAILED", lastError: "x" }), job({ name: "c", label: "C" }), job({ name: "d", label: "D", lastOutcome: "FAILED", lastError: "y" })]
  assert.deepEqual(sortedJobs(jobs).map((entry) => entry.name), ["b", "d", "a", "c"])
  assert.deepEqual(jobs.map((entry) => entry.name), ["a", "b", "c", "d"])
})

check("job outcomes", () => {
  assert.deepEqual(jobOutcome(job()), { state: "ok", label: "OK" })
  assert.deepEqual(jobOutcome(job({ lastOutcome: "FAILED", lastError: "boom" })), { state: "down", label: "Failed" })
  assert.deepEqual(jobOutcome(job({ lastStartedAt: null, lastFinishedAt: null, lastOutcome: null })), { state: "off", label: "No run yet" })
  assert.deepEqual(jobOutcome(job({ lastStartedAt: "2026-11-03T21:00:00", lastFinishedAt: null, lastOutcome: null })), { state: "off", label: "Running" })
  assert.deepEqual(jobOutcome(job({ lastStartedAt: "2026-11-03T22:00:00", lastFinishedAt: "2026-11-03T21:00:01", lastOutcome: "OK" })), { state: "off", label: "Running" })
})

check("job last run", () => {
  assert.deepEqual(jobLastRunLines(job()), [formatTimeAgo("2026-11-03T21:00:00"), `${formatDateTime("2026-11-03T21:00:00")}, took 1.2 s`])
  assert.deepEqual(jobLastRunLines(job({ lastFinishedAt: "2026-11-03T21:00:00.040" })), [formatTimeAgo("2026-11-03T21:00:00"), `${formatDateTime("2026-11-03T21:00:00")}, took 40 ms`])
  assert.deepEqual(jobLastRunLines(job({ lastFinishedAt: null, lastOutcome: null })), [formatTimeAgo("2026-11-03T21:00:00"), formatDateTime("2026-11-03T21:00:00")])
  assert.deepEqual(jobLastRunLines(job({ lastStartedAt: null, lastFinishedAt: null, lastOutcome: null })), ["Not since the server started"])
})

check("job errors are shown whole", () => {
  const long = `java.lang.IllegalStateException: ${"x".repeat(600)}`
  assert.equal(jobErrorText(job({ lastOutcome: "FAILED", lastError: long })), long)
  assert.equal(jobErrorText(job()), "None")
  assert.equal(jobErrorText(job({ lastOutcome: "FAILED", lastError: null })), "No error message")
  assert.equal(jobErrorText(job({ lastStartedAt: "2026-11-03T22:00:00", lastFinishedAt: "2026-11-03T21:00:01", lastOutcome: "FAILED", lastError: "boom" })), "None")
})

check("internal jobs come after the others, failed jobs first in each group", () => {
  const groups = jobGroups([
    job({ name: "a" }),
    job({ name: "gauges", internal: true }),
    job({ name: "b", lastOutcome: "FAILED", lastError: "x" }),
    job({ name: "settings", internal: true, lastOutcome: "FAILED", lastError: "y" }),
    job({ name: "c", internal: false }),
  ])
  assert.deepEqual(groups.main.map((entry) => entry.name), ["b", "a", "c"])
  assert.deepEqual(groups.internal.map((entry) => entry.name), ["settings", "gauges"])
  assert.deepEqual(jobGroups([job({ name: "old" })]).internal, [], "a v2.30 backend has no internal flag")
})

check("each job says how often it runs, and when next unless it runs every few minutes", () => {
  const next = "2026-11-05T03:30:00Z"
  assert.equal(jobScheduleText(job({ schedule: "Daily", nextRunAt: next })), `Daily, next run ${formatDateTime(next)}`)
  assert.equal(jobScheduleText(job({ schedule: "Weekly", nextRunAt: next })), `Weekly, next run ${formatDateTime(next)}`)
  assert.equal(jobScheduleText(job({ schedule: "Every hour", nextRunAt: next })), `Every hour, next run ${formatDateTime(next)}`)
  assert.equal(jobScheduleText(job({ schedule: "Every 5 minutes", nextRunAt: next })), "Every 5 minutes")
  assert.equal(jobScheduleText(job({ schedule: "Every minute", nextRunAt: next })), "Every minute")
  assert.equal(jobScheduleText(job({ schedule: "Every 15 seconds", nextRunAt: null })), "Every 15 seconds")
  assert.equal(jobScheduleText(job({ schedule: null, nextRunAt: next })), `Next run ${formatDateTime(next)}`)
  assert.equal(jobScheduleText(job()), undefined, "a v2.30 backend has no schedule")
})

check("a failed job gives its plain reason, and the raw error stays whole", () => {
  const failed = job({ lastOutcome: "FAILED", lastError: "org.springframework.transaction.CannotCreateTransactionException: Could not open JPA EntityManager", lastReason: "The database wasn't reachable." })
  assert.equal(jobErrorReason(failed), "The database wasn't reachable.")
  assert.equal(jobErrorText(failed), "org.springframework.transaction.CannotCreateTransactionException: Could not open JPA EntityManager")
  assert.equal(jobErrorReason(job({ lastOutcome: "FAILED", lastError: "x", lastReason: null })), undefined)
  assert.equal(jobErrorReason(job({ lastOutcome: "OK", lastReason: "The database wasn't reachable." })), undefined)
})

check("a page that can't refresh for longer than the restart window stops looking current", () => {
  const good = 1_000_000
  assert.equal(outOfDate(good, good + 30_000, true), false, "a short restart keeps the last answer with a note")
  assert.equal(outOfDate(good, good + 120_001, true), true)
  assert.equal(outOfDate(good, good + 120_001, false), false, "not while refreshes work")
  assert.equal(outOfDate(0, 500_000, true), false, "nothing loaded yet is the first-load error")
})

check("a refresh after a failure keeps showing that failure instead of the loading skeleton", () => {
  const outage = new ApiError("hrva.cc can't reach its database right now. Try again in a minute.", 503, {}, { outage: "database" })
  assert.equal(showsSkeleton(true, null), true, "the very first load")
  assert.equal(showsSkeleton(true, outage), false, "a refetch after the outage answer")
  assert.equal(shownError(null, outage, false), outage, "TanStack clears error while it refetches a page without data")
  assert.equal(shownError(null, outage, true), null, "with data the page shows the data")
  const fresh = new ApiError("x", 500)
  assert.equal(shownError(fresh, outage, false), fresh)
  const health = readFileSync(new URL("../app/admin/health/page.tsx", import.meta.url), "utf8")
  assert.match(health, /showsSkeleton\(isPending, lastError\)/)
})

console.log("ok")
