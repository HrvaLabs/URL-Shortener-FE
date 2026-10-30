import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import "./resolve-ts-imports.mjs"

const moderation = await import("../lib/moderation.ts")

const { ANONYMOUS_PAUSED, SIGNUPS_PAUSED, ALIASES_PAUSED, ANONYMOUS_REFUSED, refusedSwitch, noEffectText, SETTING_GROUP_LABELS, safetyOffLines, settingValueText, groupSettings, anonymousLinksPaused, signupsPaused, aliasFieldShown, reportStatusText, BULK_BLOCK_BATCH, inBatches, NO_BULK_BLOCKS, addBulkBlock, blockSummaryText, RETRYABLE_BLOCK_STATUSES, campaignStatusLabel, campaignCountsText, campaignReportsText, MAILTO_MAX_LENGTH, mailtoHref, markedStatus, markedText, LOOKUP_FAILED } = moderation

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

check("refusal texts and the switch each one points at", () => {
  assert.equal(ALIASES_PAUSED, "Custom aliases are turned off right now.")
  assert.equal(ANONYMOUS_REFUSED, "Sign in to create short URLs")
  assert.equal(refusedSwitch("Sign in to create short URLs"), "anonymousLinks")
  assert.equal(refusedSwitch("Custom aliases are turned off right now."), "customAliases")
  assert.equal(refusedSwitch("Sign in to create short URLs."), null)
  assert.equal(refusedSwitch("Could not shorten that URL."), null)
  assert.equal(refusedSwitch(undefined), null)
})

check("noEffectText", () => {
  assert.equal(noEffectText("Same-shape alert"), "Has no effect while Same-shape alert is off.")
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

const offParents = (groups) => Object.fromEntries(groups.flatMap((entry) => entry.rows.map((row) => [row.setting.key, row.offParent])))

check("groupSettings: a child under an off parent names it, any other row has none", () => {
  const settings = catalogue().map((entry) => (entry.key === "SAME_SHAPE_ALERT" ? { ...entry, value: false } : entry))
  const parents = offParents(groupSettings(settings, ""))
  assert.equal(parents.CAMPAIGN_LINKS, "Same-shape alert")
  assert.equal(parents.SAME_SHAPE_ALERT, null)
  assert.equal(parents.ANONYMOUS_LINKS_PER_HOUR, null)
  assert.equal(parents.CUSTOM_ALIASES, null)
})

check("groupSettings: a grandchild names the nearest off ancestor, and the parent is looked up past the filter", () => {
  const top = setting({ key: "SAME_SHAPE_ALERT", type: "SWITCH", label: "Top", parent: null, value: false })
  const middle = setting({ key: "CAMPAIGN_LINKS", type: "SWITCH", label: "Middle", parent: "SAME_SHAPE_ALERT", value: true })
  const bottom = setting({ key: "CAMPAIGN_HOLD", label: "Bottom", description: "Only this one matches.", parent: "CAMPAIGN_LINKS" })
  assert.equal(offParents(groupSettings([top, middle, bottom], "")).CAMPAIGN_HOLD, "Top")
  assert.equal(offParents(groupSettings([top, middle, bottom], "only this")).CAMPAIGN_HOLD, "Top")
})

check("groupSettings: a child under a number parent or an on parent has none", () => {
  const settings = catalogue()
  assert.equal(offParents(groupSettings(settings, "")).CAMPAIGN_LINKS, null)
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

check("anonymousLinksPaused: only for a signed-out visitor once the settings say so", () => {
  const off = { anonymousLinks: false, newSignups: true, customAliases: true }
  const on = { ...off, anonymousLinks: true }
  assert.equal(anonymousLinksPaused(off, false, false), true)
  assert.equal(anonymousLinksPaused(on, false, false), false)
  assert.equal(anonymousLinksPaused(off, true, false), false)
})

check("anonymousLinksPaused: loading or failed settings and a loading sign-in leave the form alone", () => {
  const off = { anonymousLinks: false, newSignups: true, customAliases: true }
  assert.equal(anonymousLinksPaused(undefined, false, false), false)
  assert.equal(anonymousLinksPaused(off, false, true), false)
})

check("signupsPaused: only when the settings say so", () => {
  const base = { anonymousLinks: true, newSignups: true, customAliases: true }
  assert.equal(signupsPaused({ ...base, newSignups: false }), true)
  assert.equal(signupsPaused(base), false)
  assert.equal(signupsPaused(undefined), false)
})

check("aliasFieldShown: hidden only on hrva.cc links while aliases are off", () => {
  const base = { anonymousLinks: true, newSignups: true, customAliases: true }
  const off = { ...base, customAliases: false }
  assert.equal(aliasFieldShown(off, null), false)
  assert.equal(aliasFieldShown(off, "go.example.com"), true)
  assert.equal(aliasFieldShown(base, null), true)
  assert.equal(aliasFieldShown(undefined, null), true)
})

check("reportStatusText: not reported", () => {
  assert.equal(reportStatusText(null, new Date("2026-10-30T12:00:00Z")), "Not reported")
})

check("reportStatusText: reported, not suspended yet", () => {
  const report = (reportedAt) => ({ reportedAt, reportedBy: "karlo@hrva.cc", registrar: "NameSilo, LLC", suspendedAt: null })
  const now = new Date("2026-10-30T12:00:00Z")
  assert.equal(reportStatusText(report("2026-10-30T00:05:00"), now), "Reported today, not suspended yet")
  assert.equal(reportStatusText(report("2026-10-29T23:59:00"), now), "Reported 1 day ago, not suspended yet")
  assert.equal(reportStatusText(report("2026-10-27T18:00:00Z"), now), "Reported 3 days ago, not suspended yet")
  assert.equal(reportStatusText(report("2026-10-31T01:00:00"), now), "Reported today, not suspended yet")
  assert.equal(reportStatusText(report("2026-09-30T10:00:00"), now), "Reported 30 days ago, not suspended yet")
})

check("reportStatusText: suspended, in UTC d MMM", () => {
  const suspended = (suspendedAt) => ({ reportedAt: "2026-10-20T10:00:00", reportedBy: "karlo@hrva.cc", registrar: null, suspendedAt })
  const now = new Date("2026-11-20T12:00:00Z")
  assert.equal(reportStatusText(suspended("2026-10-31T09:00:00"), now), "Suspended on 31 Oct")
  assert.equal(reportStatusText(suspended("2026-11-01T23:30:00Z"), now), "Suspended on 1 Nov")
  assert.equal(reportStatusText(suspended("2026-12-05T00:00:00+02:00"), now), "Suspended on 4 Dec")
})

check("inBatches: at most 100, in order, none for nothing", () => {
  assert.equal(BULK_BLOCK_BATCH, 100)
  assert.deepEqual(inBatches([]), [])
  const domains = Array.from({ length: 250 }, (_, index) => `d${index}.example`)
  const batches = inBatches(domains)
  assert.deepEqual(batches.map((batch) => batch.length), [100, 100, 50])
  assert.deepEqual(batches.flat(), domains)
  assert.deepEqual(inBatches(domains.slice(0, 100)).map((batch) => batch.length), [100])
  assert.deepEqual(inBatches([1, 2, 3], 2), [[1, 2], [3]])
})

check("addBulkBlock sums the batches", () => {
  const result = (blocked, skipped, linksDeactivated, heldLinksConverted) => ({
    blocked: blocked.map((domain) => ({ domain, linksDeactivated: 0, domainsDisabled: 0, heldLinksConverted: 0 })),
    skipped: skipped.map((domain) => ({ domain, reason: "Already blocked" })),
    linksDeactivated,
    heldLinksConverted,
  })
  const first = addBulkBlock(NO_BULK_BLOCKS, result(["a.example", "b.example"], [], 5, 3))
  const second = addBulkBlock(first, result(["c.example"], ["d.example"], 2, 4))
  assert.deepEqual(second, { blocked: 3, skipped: [{ domain: "d.example", reason: "Already blocked" }], linksDeactivated: 7, heldLinksConverted: 7 })
  assert.deepEqual(NO_BULK_BLOCKS, { blocked: 0, skipped: [], linksDeactivated: 0, heldLinksConverted: 0 })
})

check("blockSummaryText adds held links only when some were kept off", () => {
  const totals = (blocked, linksDeactivated, heldLinksConverted) => ({ blocked, skipped: [], linksDeactivated, heldLinksConverted })
  assert.equal(blockSummaryText(totals(2, 5, 0)), "Blocked 2 domains, 5 links turned off")
  assert.equal(blockSummaryText(totals(1, 1, 1)), "Blocked 1 domain, 1 link turned off, 1 held link kept off")
  assert.equal(blockSummaryText(totals(1200, 3400, 2500)), "Blocked 1,200 domains, 3,400 links turned off, 2,500 held links kept off")
})

check("a failed batch can be retried only for a 503 or a lost connection", () => {
  assert.deepEqual([...RETRYABLE_BLOCK_STATUSES], [0, 503])
})

check("campaignStatusLabel: a hold that has run out reads Hold ended", () => {
  assert.equal(campaignStatusLabel({ status: "HOLDING", holding: true }), "Holding")
  assert.equal(campaignStatusLabel({ status: "HOLDING", holding: false }), "Hold ended")
  assert.equal(campaignStatusLabel({ status: "ALERT_ONLY", holding: false }), "Alert only")
  assert.equal(campaignStatusLabel({ status: "ALLOWED", holding: false }), "Allowed")
})

check("campaignCountsText and campaignReportsText", () => {
  const campaign = { links: { total: 62, active: 0, held: 58, blocked: 4 }, domains: 39, clicks: 970, reports: { reported: 39, suspended: 12 } }
  assert.equal(campaignCountsText(campaign), "62 links (0 active, 58 held, 4 blocked), 39 domains, 970 clicks")
  assert.equal(campaignReportsText(campaign), "39 of 39 domains reported, 12 suspended")
  const small = { links: { total: 1, active: 1, held: 0, blocked: 0 }, domains: 1, clicks: 1, reports: { reported: 0, suspended: 0 } }
  assert.equal(campaignCountsText(small), "1 link (1 active, 0 held, 0 blocked), 1 domain, 1 click")
  assert.equal(campaignReportsText(small), "0 of 1 domain reported, 0 suspended")
  assert.equal(campaignCountsText({ ...campaign, links: { ...campaign.links, total: 1500 }, clicks: 12000 }), "1,500 links (0 active, 58 held, 4 blocked), 39 domains, 12,000 clicks")
})

check("mailtoHref: to, cc, subject and body, encoded", () => {
  const report = { to: "abuse@namesilo.com", cc: ["reportphishing@apwg.org", "a+b@example.com"], subject: "Phishing: 2 domains used in links to x.sbs", body: "Hello,\n\nI run hrva.cc & more: 50% (a/b)?" }
  assert.equal(
    mailtoHref(report),
    "mailto:abuse@namesilo.com?cc=reportphishing%40apwg.org,a%2Bb%40example.com&subject=Phishing%3A%202%20domains%20used%20in%20links%20to%20x.sbs&body=Hello%2C%0A%0AI%20run%20hrva.cc%20%26%20more%3A%2050%25%20(a%2Fb)%3F",
  )
  assert.equal(mailtoHref({ ...report, cc: [] }).includes("cc="), false)
  assert.equal(mailtoHref({ ...report, cc: [] }).startsWith("mailto:abuse@namesilo.com?subject="), true)
})

check("mailtoHref: null above MAILTO_MAX_LENGTH, the link itself at exactly that length", () => {
  assert.equal(MAILTO_MAX_LENGTH, 2000)
  const report = { to: "abuse@namesilo.com", cc: ["reportphishing@apwg.org"], subject: "Phishing", body: "" }
  const base = mailtoHref(report).length
  const at = (length) => mailtoHref({ ...report, body: "a".repeat(length - base) })
  assert.equal(at(1999).length, 1999)
  assert.equal(at(2000).length, 2000)
  assert.equal(at(2001), null)
  const lines = mailtoHref({ ...report, body: "line\n".repeat(300) })
  assert.equal(lines, null)
  assert.notEqual(mailtoHref({ ...report, body: "line\n".repeat(200) }), null)
})

check("markedText and markedStatus", () => {
  assert.equal(markedText(1), "Marked 1 domain as reported")
  assert.equal(markedText(39), "Marked 39 domains as reported")
  assert.equal(markedText(1200), "Marked 1,200 domains as reported")
  const now = new Date("2026-10-30T12:00:00Z")
  const fresh = markedStatus(null, "NameSilo, LLC", now)
  assert.deepEqual(fresh, { reportedAt: "2026-10-30T12:00:00.000Z", reportedBy: "", registrar: "NameSilo, LLC", suspendedAt: null })
  assert.equal(reportStatusText(fresh, now), "Reported today, not suspended yet")
  const suspended = { reportedAt: "2026-10-20T10:00:00", reportedBy: "karlo@hrva.cc", registrar: null, suspendedAt: "2026-10-25T09:00:00" }
  assert.equal(reportStatusText(markedStatus(suspended, "NameSilo, LLC", now), now), "Suspended on 25 Oct")
  assert.equal(LOOKUP_FAILED, "Lookup failed. Try again.")
})

check("strings are ASCII", () => {
  const source = readFileSync(new URL("../lib/moderation.ts", import.meta.url), "utf8")
  const sourceLine = source.split("\n").findIndex((line) => NOT_ASCII.test(line))
  assert.equal(sourceLine, -1, `lib/moderation.ts line ${sourceLine + 1} has a character above U+007F`)
  for (const value of stringsIn(Object.values(moderation))) assert.ok(!NOT_ASCII.test(value), `not ASCII: ${JSON.stringify(value)}`)
})

console.log("ok")
