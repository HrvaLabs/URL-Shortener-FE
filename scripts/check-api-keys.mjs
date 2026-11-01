import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import "./resolve-ts-imports.mjs"

const { daysFromToday, expiryChange, expiryDateTimeText, expiryPrefill, keyPrefixText, lastUsedText, requestsText } = await import("../lib/api-keys.ts")
const { parseServerDateTime, toDateInputValue, toDateTimeLocalValue } = await import("../lib/utils.ts")

let failures = 0

const check = (name, run) => {
  try {
    run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

const today = new Date(2026, 9, 30, 23, 59)

check("a custom date is whole calendar days from today", () => {
  assert.equal(daysFromToday("2026-10-31", today), 1)
  assert.equal(daysFromToday("2026-11-29", today), 30)
  assert.equal(daysFromToday("2027-10-30", today), 365)
  assert.equal(daysFromToday("2026-10-30", today), 0)
  assert.equal(daysFromToday("2026-10-29", today), -1)
})

check("the time of day does not change the count", () => {
  assert.equal(daysFromToday("2026-11-01", new Date(2026, 9, 30, 0, 0)), 2)
  assert.equal(daysFromToday("2026-11-01", new Date(2026, 9, 30, 23, 59)), 2)
})

check("daylight saving does not shift the count", () => {
  assert.equal(daysFromToday("2026-11-02", new Date(2026, 9, 24, 12, 0)), 9)
  assert.equal(daysFromToday("2027-03-30", new Date(2027, 2, 25, 12, 0)), 5)
})

check("a text that is not a real date has no day count", () => {
  assert.equal(daysFromToday("", today), null)
  assert.equal(daysFromToday("2026-02-30", today), null)
  assert.equal(daysFromToday("30.10.2026", today), null)
})

check("the fixed choices send their days", () => {
  assert.deepEqual(expiryChange("30", "", today), { change: { expiresInDays: 30 } })
  assert.deepEqual(expiryChange("90", "", today), { change: { expiresInDays: 90 } })
  assert.deepEqual(expiryChange("365", "", today), { change: { expiresInDays: 365 } })
})

check("no expiry sends neverExpires and no days", () => {
  assert.deepEqual(expiryChange("never", "2026-12-01", today), { change: { neverExpires: true } })
})

check("a custom date sends its day count", () => {
  assert.deepEqual(expiryChange("custom", "2026-11-29", today), { change: { expiresInDays: 30 } })
  assert.deepEqual(expiryChange("custom", "2026-10-31", today), { change: { expiresInDays: 1 } })
})

check("a custom date needs at least 1 day and at most 3,650", () => {
  assert.deepEqual(expiryChange("custom", "2026-10-30", today), { error: "Pick a date from tomorrow." })
  assert.deepEqual(expiryChange("custom", "2026-10-01", today), { error: "Pick a date from tomorrow." })
  assert.deepEqual(expiryChange("custom", "", today), { error: "Pick a date." })
  assert.deepEqual(expiryChange("custom", "2036-10-27", today), { change: { expiresInDays: 3650 } })
  assert.deepEqual(expiryChange("custom", "2036-10-28", today), { error: "Pick a date within 3,650 days." })
})

check("the date input value is the local day", () => {
  assert.equal(toDateInputValue(new Date(2026, 0, 5, 23, 30)), "2026-01-05")
})

const localDayOfInstant = {
  UTC: { "2026-11-30T03:30:00": "2026-11-30", "2026-11-30T20:00:00": "2026-11-30" },
  "America/Los_Angeles": { "2026-11-30T03:30:00": "2026-11-29", "2026-11-30T20:00:00": "2026-11-30" },
  "Pacific/Auckland": { "2026-11-30T03:30:00": "2026-11-30", "2026-11-30T20:00:00": "2026-12-01" },
}

check("an expiry timestamp is a UTC instant shown as the local day, in every time zone", () => {
  const zone = process.env.TZ ?? "UTC"
  const expected = localDayOfInstant[zone]
  assert.ok(expected, `no expectations for time zone ${zone}`)
  for (const [instant, day] of Object.entries(expected)) {
    assert.deepEqual(expiryPrefill(instant, new Date("2026-10-30T12:00:00Z")), { choice: "custom", date: day, expiredOn: null }, `${instant} in ${zone}`)
  }
})

check("the shown expiry and the prefill agree", () => {
  const shown = expiryDateTimeText("2026-11-30T03:30:00")
  assert.equal(shown, new Date("2026-11-30T03:30:00Z").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }))
})

check("an expiry written with Z (v2.22) and without an offset (before) is the same expiry", () => {
  const now = new Date("2026-10-30T12:00:00Z")
  assert.deepEqual(expiryPrefill("2026-11-30T03:30:00Z", now), expiryPrefill("2026-11-30T03:30:00", now))
  assert.deepEqual(expiryPrefill("2026-11-30T03:30:00.182010Z", now), expiryPrefill("2026-11-30T03:30:00", now))
  assert.equal(expiryDateTimeText("2026-11-30T03:30:00Z"), expiryDateTimeText("2026-11-30T03:30:00"))
  assert.equal(expiryPrefill("2026-10-30T12:00:00Z", now).choice, "90")
  const lastUsed = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  assert.equal(lastUsedText(lastUsed), lastUsedText(lastUsed.slice(0, 19)))
})

check("the expiry helpers read dates with the one UTC parser", () => {
  const instant = parseServerDateTime("2026-11-30T03:30:00Z")
  assert.equal(expiryPrefill("2026-11-30T03:30:00Z", new Date("2026-10-30T12:00:00Z")).date, toDateTimeLocalValue(instant).slice(0, 10))
  assert.equal(toDateInputValue(instant), toDateTimeLocalValue(instant).slice(0, 10))
})

check("no expiry starts as No expiry", () => {
  assert.deepEqual(expiryPrefill(null, today), { choice: "never", date: "", expiredOn: null })
  assert.deepEqual(expiryPrefill(undefined, today), { choice: "never", date: "", expiredOn: null })
})

check("an expired key starts at the default, so an untouched Save works", () => {
  const prefill = expiryPrefill("2026-01-05T10:00:00", new Date("2026-10-30T12:00:00Z"))
  assert.equal(prefill.choice, "90")
  assert.equal(prefill.date, "")
  assert.match(prefill.expiredOn, /2026/)
  assert.deepEqual(expiryChange(prefill.choice, prefill.date, today), { change: { expiresInDays: 90 } })
})

check("a key that expires this very second counts as expired", () => {
  assert.equal(expiryPrefill("2026-10-30T12:00:00", new Date("2026-10-30T12:00:00Z")).choice, "90")
  assert.equal(expiryPrefill("2026-10-30T12:00:01", new Date("2026-10-30T12:00:00Z")).choice, "custom")
})

check("a key is listed by its prefix and an ellipsis", () => {
  assert.equal(keyPrefixText("hrva_GgwVPd"), "hrva_GgwVPd\u2026")
  assert.equal(keyPrefixText("hrva_G"), "hrva_G\u2026")
})

check("usage lines", () => {
  assert.equal(requestsText(0), "0 requests")
  assert.equal(requestsText(1), "1 request")
  assert.equal(requestsText(1234), "1,234 requests")
  assert.equal(lastUsedText(null), "Never used")
  assert.equal(lastUsedText(undefined), "Never used")
  assert.match(lastUsedText(new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 19)), /^Last used 3 hours ago$/)
})

check("a revoked or expired key can't be turned back on, only deleted", () => {
  const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
  assert.doesNotMatch(source("lib/api-client.ts"), /api-keys\/\$\{id\}\/activate/)
  assert.doesNotMatch(source("lib/hooks/useApiKeys.ts"), /useActivateApiKey/)
  const admin = source("app/admin/api-keys/page.tsx")
  assert.doesNotMatch(admin, /Activate API key|handleActivate/)
  assert.match(admin, /\{key\.active && \(\s*<Tooltip>\s*<TooltipTrigger asChild>\s*<button onClick=\{\(\) => openEdit\(key\)\}/)
  assert.doesNotMatch(source("app/dashboard/api-keys/page.tsx"), /Activate/)
})

if (failures > 0) {
  console.error(`${failures} check${failures === 1 ? "" : "s"} failed`)
  process.exit(1)
}
console.log("ok")
