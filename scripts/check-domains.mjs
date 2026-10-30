import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import "./resolve-ts-imports.mjs"

const domains = await import("../lib/domains.ts")

const {
  DOMAIN_STATUS_HINTS,
  DOMAIN_STATUS_LABELS,
  DOMAIN_STEP_LABELS,
  HOSTNAME_PLACEHOLDER,
  LINK_MODE_HINTS,
  LINK_MODE_LABELS,
  REASON_MAX,
  TOKEN_STATUS_LABELS,
  canPickDomain,
  shortHost,
} = domains

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

const STATUSES = ["PENDING_REVIEW", "APPROVED_PROVISIONING", "AWAITING_DNS", "ACTIVE", "REJECTED", "DISABLED", "ERROR", "DELETED"]

const domain = (overrides = {}) => ({
  id: 7,
  hostname: "go.example.com",
  status: "ACTIVE",
  reason: "Menu links for my cafe",
  reviewNote: null,
  createdAt: "2026-10-29T08:00:00",
  reviewedAt: "2026-10-29T09:00:00",
  activatedAt: "2026-10-29T09:05:00",
  lastCheckedAt: "2026-10-29T09:05:00",
  dnsRecord: { type: "CNAME", name: "go.example.com", target: "domains.hrva.cc" },
  steps: { dnsFound: true, certificateIssued: true },
  problem: null,
  problemText: null,
  disabledNote: null,
  links: 0,
  ...overrides,
})

check("limits", () => {
  assert.equal(HOSTNAME_PLACEHOLDER, "go.example.com")
  assert.equal(REASON_MAX, 300)
})

check("status labels, every status once", () => {
  assert.deepEqual(Object.keys(DOMAIN_STATUS_LABELS), STATUSES)
  assert.deepEqual(DOMAIN_STATUS_LABELS, {
    PENDING_REVIEW: "Waiting for review",
    APPROVED_PROVISIONING: "Approved, setting up",
    AWAITING_DNS: "Waiting for your DNS record",
    ACTIVE: "Active",
    REJECTED: "Not approved",
    DISABLED: "Turned off",
    ERROR: "Needs attention",
    DELETED: "Removed",
  })
})

check("status hints, every status once", () => {
  assert.deepEqual(Object.keys(DOMAIN_STATUS_HINTS), STATUSES)
  assert.deepEqual(DOMAIN_STATUS_HINTS, {
    PENDING_REVIEW: "We'll email you when it's reviewed, usually within a day or two.",
    APPROVED_PROVISIONING: "Approved. We're getting your domain ready; this takes a minute.",
    AWAITING_DNS: "Add the CNAME record below. We check every minute and finish on our own.",
    ACTIVE: "Ready. Pick this domain when you shorten a link.",
    REJECTED: "This application wasn't approved.",
    DISABLED: "This domain is turned off. Its links don't open.",
    ERROR: "Something needs your attention. See below.",
    DELETED: "This domain was removed.",
  })
})

check("step labels", () => {
  assert.deepEqual(DOMAIN_STEP_LABELS, { dnsFound: "DNS record found", certificateIssued: "Certificate issued" })
})

check("link mode labels and hints", () => {
  assert.deepEqual(LINK_MODE_LABELS, { MOVE: "Move its links to hrva.cc", DEACTIVATE: "Turn its links off" })
  assert.deepEqual(LINK_MODE_HINTS, {
    MOVE: "Links keep their alias when it's free on hrva.cc and get a new one otherwise.",
    DEACTIVATE: "Links stay in your list, turned off.",
  })
})

check("token status labels", () => {
  assert.deepEqual(TOKEN_STATUS_LABELS, {
    OK: "OK",
    MISSING: "Missing",
    INVALID: "Invalid",
    NO_PERMISSION: "No permission",
    UNREACHABLE: "Unreachable",
  })
})

check("shortHost", () => {
  assert.equal(shortHost(null, "hrva.cc"), "hrva.cc")
  assert.equal(shortHost(undefined, "hrva.cc"), "hrva.cc")
  assert.equal(shortHost({ id: 7, hostname: "go.example.com" }, "hrva.cc"), "go.example.com")
})

check("canPickDomain needs an active domain", () => {
  assert.equal(canPickDomain([]), false)
  assert.equal(canPickDomain([domain({ status: "AWAITING_DNS" })]), false)
  assert.equal(canPickDomain([domain()]), true)
  assert.equal(canPickDomain([domain({ status: "DISABLED" }), domain({ id: 8, hostname: "links.example.org" })]), true)
})

check("strings are ASCII", () => {
  const source = readFileSync(new URL("../lib/domains.ts", import.meta.url), "utf8")
  const sourceLine = source.split("\n").findIndex((line) => NOT_ASCII.test(line))
  assert.equal(sourceLine, -1, `lib/domains.ts line ${sourceLine + 1} has a character above U+007F`)
  for (const value of stringsIn(Object.values(domains))) assert.ok(!NOT_ASCII.test(value), `not ASCII: ${JSON.stringify(value)}`)
})

console.log("ok")
