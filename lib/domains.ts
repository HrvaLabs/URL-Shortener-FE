import type { CloudflareTokenStatus, CustomDomain, CustomDomainStatus, DomainLinkMode, DomainProblem, DomainRef, DomainRemoval, DomainSteps, MyDomains } from "./types"

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

export const isHostnameShaped = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.length <= 253 && HOSTNAME_SHAPE.test(value.toLowerCase())

export const PROVISIONING_FAILED_TEXT = "Setting up your domain hit a problem. We'll keep trying, or try again now."

export const PROVISIONING_GAVE_UP_TEXT = "Setting up your domain failed. Try again now, or remove it."

export const DOMAIN_PROBLEM_FOLLOW_UPS: Record<Exclude<DomainProblem, "PROVISIONING_FAILED">, string> = {
  DNS_NOT_FOUND: "We keep checking on our own, or use Check now.",
  CAA_BLOCKED: "We check again on our own, or use Check now once it's fixed.",
  CERTIFICATE_TIMED_OUT: "We check again on our own, or use Check now once it's fixed.",
  CNAME_REMOVED: "We check again on our own, or use Check now once it's fixed.",
  CLOUDFLARE_BLOCKED: "We check again on our own. You don't need to do anything.",
  DNS_TIMED_OUT: "We don't check on our own any more. Use Check now to look again.",
}

export interface DomainProblemLines {
  text: string | null
  followUp: string | null
  retry: boolean
}

export const domainProblemLines = (domain: CustomDomain): DomainProblemLines | null => {
  if (!domain.problem) return null
  if (domain.problem === "PROVISIONING_FAILED") {
    return { text: domain.status === "ERROR" ? PROVISIONING_GAVE_UP_TEXT : PROVISIONING_FAILED_TEXT, followUp: null, retry: true }
  }
  return { text: domain.problemText, followUp: DOMAIN_PROBLEM_FOLLOW_UPS[domain.problem], retry: false }
}

const WAITING_FOR_SETUP: ReadonlySet<CustomDomainStatus> = new Set(["APPROVED_PROVISIONING", "AWAITING_DNS", "ERROR"])

export const isWaitingForSetup = (status: CustomDomainStatus): boolean => WAITING_FOR_SETUP.has(status)

export type DomainApplyState = "form" | "limit" | "off"

export const domainApplyState = ({ canApply, used, limit }: MyDomains): DomainApplyState =>
  canApply ? "form" : used >= limit ? "limit" : "off"

const countOf = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`

export const domainLimitLine = (limit: number): string =>
  `You can have ${countOf(limit, "custom domain")}. Remove one to apply for another.`

export const domainRemovalSummary = ({ moved, renamed, deactivated }: DomainRemoval): string | null => {
  if (moved > 0) return `${countOf(moved, "link")} moved, ${renamed.length} with a new alias.`
  if (deactivated > 0) return `${countOf(deactivated, "link")} turned off.`
  return null
}
