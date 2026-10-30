import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import "./resolve-ts-imports.mjs"

const moderation = await import("../lib/moderation.ts")

const { ANONYMOUS_PAUSED, SIGNUPS_PAUSED, SETTING_GROUP_LABELS, safetyOffLines, settingValueText, groupSettings } = moderation

const check = (name, run) => {
  try {
    run()
  } catch (error) {
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
    process.exit(1)
  }
}

const NOT_ASCII = /[^\x00-\x7F]/

const stringsIn = (value) => {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.flatMap(stringsIn)
  if (value !== null && typeof value === "object") return Object.entries(value).flatMap(([key, entry]) => [key, ...stringsIn(entry)])
  return []
}

const setting = (overrides = {}) => ({
  key: "CAMPAIGN_LINKS",
  group: "ALERTS",
  type: "NUMBER",
  label: "Same-shape alert: links",
  description: "Links without an account that share one URL shape.",
  parent: "SAME_SHAPE_ALERT",
  safety: false,
  value: 3,
  defaultValue: 3,
  changed: false,
  changedBy: null,
  changedAt: null,
  min: 2,
  max: 50,
  nullable: false,
  noneLabel: null,
  unit: "links",
  available: true,
  unavailableReason: null,
  ...overrides,
})

const safetySwitch = (label, value, overrides = {}) =>
  setting({ key: "BLOCKLIST_CHECK", group: "SAFETY", type: "SWITCH", label, safety: true, value, defaultValue: true, parent: null, min: null, max: null, unit: null, ...overrides })

check("paused notices", () => {
  assert.equal(ANONYMOUS_PAUSED, "Making links without an account is paused.")
  assert.equal(SIGNUPS_PAUSED, "Creating new accounts is paused.")
})

check("group labels, in the catalogue's order", () => {
  assert.deepEqual(Object.keys(SETTING_GROUP_LABELS), ["ACCESS", "LINKS", "SAFETY", "ALERTS", "DIGEST", "EMAILS", "ABUSE_REPORTS"])
  assert.deepEqual(Object.values(SETTING_GROUP_LABELS), ["Access", "Links", "Safety", "Alerts", "Digest", "Emails", "Abuse reports"])
})

check("safetyOffLines: nothing off", () => {
  assert.deepEqual(safetyOffLines([]), [])
  assert.deepEqual(safetyOffLines([safetySwitch("Blocklist check on new links and clicks", true)]), [])
})

check("safetyOffLines: one safety switch off", () => {
  assert.deepEqual(safetyOffLines([safetySwitch("Blocklist check on new links and clicks", false)]), ["Blocklist check on new links and clicks is off."])
})

check("safetyOffLines: only safety switches count", () => {
  const settings = [
    setting({ type: "SWITCH", label: "Weekly digest", value: false, safety: false }),
    setting({ type: "NUMBER", label: "Hold days", value: 0, safety: true }),
    safetySwitch("Suspicious-link check", false),
  ]
  assert.deepEqual(safetyOffLines(settings), ["Suspicious-link check is off."])
})

check("safetyOffLines: several, in the order given", () => {
  const settings = [safetySwitch("Nightly destination check", false), safetySwitch("Blocklist check on new links and clicks", true), safetySwitch("Nightly Safe Browsing recheck", false)]
  assert.deepEqual(safetyOffLines(settings), ["Nightly destination check is off.", "Nightly Safe Browsing recheck is off."])
})

check("safetyOffLines: a child switch is not listed while its parent is off", () => {
  const parent = safetySwitch("Google Safe Browsing check on new links", false, { key: "SAFE_BROWSING_CHECK" })
  const child = safetySwitch("Refuse links when Google Safe Browsing is down", false, { key: "SAFE_BROWSING_FAIL_CLOSED", parent: "SAFE_BROWSING_CHECK" })
  assert.deepEqual(safetyOffLines([parent, child]), ["Google Safe Browsing check on new links is off."])
  assert.deepEqual(safetyOffLines([child, parent]), ["Google Safe Browsing check on new links is off."])
})

check("safetyOffLines: a child switch is listed while its parent is on", () => {
  const parent = safetySwitch("Google Safe Browsing check on new links", true, { key: "SAFE_BROWSING_CHECK" })
  const child = safetySwitch("Refuse links when Google Safe Browsing is down", false, { key: "SAFE_BROWSING_FAIL_CLOSED", parent: "SAFE_BROWSING_CHECK" })
  assert.deepEqual(safetyOffLines([parent, child]), ["Refuse links when Google Safe Browsing is down is off."])
})

check("safetyOffLines: a grandchild follows the same rule", () => {
  const top = safetySwitch("Top", false, { key: "SAFE_BROWSING_CHECK" })
  const middle = setting({ key: "SAFE_BROWSING_FAIL_CLOSED", type: "NUMBER", parent: "SAFE_BROWSING_CHECK", value: 1 })
  const bottom = safetySwitch("Bottom", false, { key: "BLOCKLIST_CHECK", parent: "SAFE_BROWSING_FAIL_CLOSED" })
  assert.deepEqual(safetyOffLines([top, middle, bottom]), ["Top is off."])
})

const catalogue = () => [
  setting({ key: "ANONYMOUS_LINKS", group: "ACCESS", type: "SWITCH", label: "Links without an account", description: "Visitors can make short links without signing in.", parent: null, value: true, defaultValue: true }),
  setting({ key: "NEW_SIGNUPS", group: "ACCESS", type: "SWITCH", label: "New sign-ups", description: "New accounts can be created, with email or a sign-in provider.", parent: null, value: true, defaultValue: true }),
  setting({ key: "ANONYMOUS_LINKS_PER_HOUR", group: "ACCESS", label: "Links without an account per network per hour", description: "Counted over a fixed hour.", parent: "ANONYMOUS_LINKS", unit: "links" }),
  setting({ key: "CUSTOM_ALIASES", group: "LINKS", type: "SWITCH", label: "Custom aliases", description: "Signed-in users choose their own short link.", parent: null }),
  setting({ key: "SAME_SHAPE_ALERT", group: "ALERTS", type: "SWITCH", label: "Same-shape alert", description: "A Discord alert.", parent: null }),
  setting({ key: "CAMPAIGN_LINKS", group: "ALERTS", label: "Same-shape alert: links", description: "Links without an account that share one URL shape.", parent: "SAME_SHAPE_ALERT" }),
  setting({ key: "WEEKLY_DIGEST", group: "DIGEST", type: "SWITCH", label: "Weekly digest", description: "Monday's summary in Discord.", parent: null }),
  setting({ key: "CAMPAIGN_HOLD", group: "SAFETY", type: "SWITCH", label: "Hold links", description: "Holds the links of a same-shape alert.", parent: null }),
]

const layout = (groups) => groups.map((entry) => ({ group: entry.group, rows: entry.rows.map((row) => `${row.indented ? "  " : ""}${row.setting.key}`) }))

check("groupSettings: groups in the catalogue's order, children under their parent", () => {
  assert.deepEqual(layout(groupSettings(catalogue(), "")), [
    { group: "ACCESS", rows: ["ANONYMOUS_LINKS", "  ANONYMOUS_LINKS_PER_HOUR", "NEW_SIGNUPS"] },
    { group: "LINKS", rows: ["CUSTOM_ALIASES"] },
    { group: "SAFETY", rows: ["CAMPAIGN_HOLD"] },
    { group: "ALERTS", rows: ["SAME_SHAPE_ALERT", "  CAMPAIGN_LINKS"] },
    { group: "DIGEST", rows: ["WEEKLY_DIGEST"] },
  ])
})

check("groupSettings: a filter matches the label and the description, ignoring case", () => {
  assert.deepEqual(layout(groupSettings(catalogue(), "DISCORD ALERT")), [{ group: "ALERTS", rows: ["SAME_SHAPE_ALERT"] }])
  assert.deepEqual(layout(groupSettings(catalogue(), "custom ALIASES")), [{ group: "LINKS", rows: ["CUSTOM_ALIASES"] }])
  assert.deepEqual(layout(groupSettings(catalogue(), "  monday ")), [{ group: "DIGEST", rows: ["WEEKLY_DIGEST"] }])
})

check("groupSettings: every word has to match", () => {
  assert.deepEqual(layout(groupSettings(catalogue(), "shape account")), [{ group: "ALERTS", rows: ["CAMPAIGN_LINKS"] }])
  assert.deepEqual(layout(groupSettings(catalogue(), "shape nonsense")), [])
})

check("groupSettings: a child that matches without its parent is not indented", () => {
  assert.deepEqual(layout(groupSettings(catalogue(), "fixed hour")), [{ group: "ACCESS", rows: ["ANONYMOUS_LINKS_PER_HOUR"] }])
})

check("groupSettings: a parent that matches without its children shows alone, and empty groups are left out", () => {
  assert.deepEqual(layout(groupSettings(catalogue(), "discord alert")), [{ group: "ALERTS", rows: ["SAME_SHAPE_ALERT"] }])
  assert.deepEqual(layout(groupSettings([], "")), [])
})

check("settingValueText: switches", () => {
  const sw = setting({ type: "SWITCH", unit: null })
  assert.equal(settingValueText(sw, true), "On")
  assert.equal(settingValueText(sw, false), "Off")
})

check("settingValueText: numbers use thousands separators and the unit", () => {
  assert.equal(settingValueText(setting(), 3), "3 links")
  assert.equal(settingValueText(setting({ unit: "clicks" }), 1000), "1,000 clicks")
  assert.equal(settingValueText(setting({ unit: "clicks" }), 100000), "100,000 clicks")
  assert.equal(settingValueText(setting({ unit: "visits" }), 1000000), "1,000,000 visits")
  assert.equal(settingValueText(setting({ unit: "hours" }), 24), "24 hours")
})

check("settingValueText: one takes the singular", () => {
  assert.equal(settingValueText(setting(), 1), "1 link")
  assert.equal(settingValueText(setting({ unit: "days" }), 1), "1 day")
})

check("settingValueText: a percent sign sits next to the number", () => {
  assert.equal(settingValueText(setting({ unit: "%" }), 50), "50%")
  assert.equal(settingValueText(setting({ unit: "%" }), 1), "1%")
})

check("settingValueText: a number without a unit", () => {
  assert.equal(settingValueText(setting({ unit: null }), 12), "12")
})

check("settingValueText: no value shows the none label", () => {
  const never = setting({ unit: "days", nullable: true, noneLabel: "Never" })
  assert.equal(settingValueText(never, null), "Never")
  assert.equal(settingValueText(never, 30), "30 days")
  assert.equal(settingValueText(setting({ unit: "visits", nullable: true, noneLabel: "Unlimited" }), null), "Unlimited")
  assert.equal(settingValueText(setting({ noneLabel: null }), null), "None")
})

check("settingValueText: text", () => {
  const text = setting({ type: "TEXT", unit: null })
  assert.equal(settingValueText(text, "Karlo Hrva"), "Karlo Hrva")
  assert.equal(settingValueText(text, ""), "None")
})

check("settingValueText: addresses are joined with a comma and a space", () => {
  const addresses = setting({ type: "ADDRESSES", unit: null })
  assert.equal(settingValueText(addresses, ["abuse@hrva.cc"]), "abuse@hrva.cc")
  assert.equal(settingValueText(addresses, ["abuse@hrva.cc", "reportphishing@apwg.org"]), "abuse@hrva.cc, reportphishing@apwg.org")
  assert.equal(settingValueText(addresses, []), "None")
})

check("strings are ASCII", () => {
  const source = readFileSync(new URL("../lib/moderation.ts", import.meta.url), "utf8")
  const sourceLine = source.split("\n").findIndex((line) => NOT_ASCII.test(line))
  assert.equal(sourceLine, -1, `lib/moderation.ts line ${sourceLine + 1} has a character above U+007F`)
  for (const value of stringsIn(Object.values(moderation))) assert.ok(!NOT_ASCII.test(value), `not ASCII: ${JSON.stringify(value)}`)
})

console.log("ok")
