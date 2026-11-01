import assert from "node:assert/strict"
import "./resolve-ts-imports.mjs"

const { daysFromToday, expiryChange, keyPrefixText, lastUsedText, requestsText, dateInputValue } = await import("../lib/api-keys.ts")

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
  assert.equal(dateInputValue(new Date(2026, 0, 5, 23, 30)), "2026-01-05")
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

if (failures > 0) {
  console.error(`${failures} check${failures === 1 ? "" : "s"} failed`)
  process.exit(1)
}
console.log("ok")
