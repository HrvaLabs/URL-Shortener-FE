import type { CloudflareTokenStatus, CustomDomain, CustomDomainStatus, DomainLinkMode, DomainRef, DomainSteps } from "./types"

export const HOSTNAME_PLACEHOLDER = "go.example.com"

export const REASON_MAX = 300

export const DOMAIN_STATUS_LABELS: Record<CustomDomainStatus, string> = {
  PENDING_REVIEW: "Waiting for review",
  APPROVED_PROVISIONING: "Approved, setting up",
  AWAITING_DNS: "Waiting for your DNS record",
  ACTIVE: "Active",
  REJECTED: "Not approved",
  DISABLED: "Turned off",
  ERROR: "Needs attention",
  DELETED: "Removed",
}

export const DOMAIN_STATUS_HINTS: Record<CustomDomainStatus, string> = {
  PENDING_REVIEW: "We'll email you when it's reviewed, usually within a day or two.",
  APPROVED_PROVISIONING: "Approved. We're getting your domain ready; this takes a minute.",
  AWAITING_DNS: "Add the CNAME record below. We check every minute and finish on our own.",
  ACTIVE: "Ready. Pick this domain when you shorten a link.",
  REJECTED: "This application wasn't approved.",
  DISABLED: "This domain is turned off. Its links don't open.",
  ERROR: "Something needs your attention. See below.",
  DELETED: "This domain was removed.",
}

export const DOMAIN_STEP_LABELS: Record<keyof DomainSteps, string> = {
  dnsFound: "DNS record found",
  certificateIssued: "Certificate issued",
}

export const LINK_MODE_LABELS: Record<DomainLinkMode, string> = {
  MOVE: "Move its links to hrva.cc",
  DEACTIVATE: "Turn its links off",
}

export const LINK_MODE_HINTS: Record<DomainLinkMode, string> = {
  MOVE: "Links keep their alias when it's free on hrva.cc and get a new one otherwise.",
  DEACTIVATE: "Links stay in your list, turned off.",
}

export const TOKEN_STATUS_LABELS: Record<CloudflareTokenStatus, string> = {
  OK: "OK",
  MISSING: "Missing",
  INVALID: "Invalid",
  NO_PERMISSION: "No permission",
  UNREACHABLE: "Unreachable",
}

export const shortHost = (domain: DomainRef | null | undefined, primaryHost: string): string => domain?.hostname || primaryHost

export const canPickDomain = (domains: CustomDomain[]): boolean => domains.some((domain) => domain.status === "ACTIVE")

const HOSTNAME_SHAPE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/

export const isHostnameShaped = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.length <= 253 && HOSTNAME_SHAPE.test(value.toLowerCase())
