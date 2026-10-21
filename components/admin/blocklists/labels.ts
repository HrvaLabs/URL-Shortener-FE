import type { BlockReason, DomainRuleType, SourceAction, SourceKind, UrlCheckOutcome } from "@/lib/types"

export const kindLabels: Record<SourceKind, string> = {
  DOMAINS: "Domains",
  LINKS: "Links",
}

export const actionLabels: Record<SourceAction, string> = {
  BLOCK: "Block",
  FLAG: "Review",
}

export const actionVariants: Record<SourceAction, "destructive" | "warning"> = {
  BLOCK: "destructive",
  FLAG: "warning",
}

export const ruleTypeLabels: Record<DomainRuleType, string> = {
  BLOCK: "Blocked domains",
  ALLOW: "Trusted domains",
}

export const outcomeLabels: Record<UrlCheckOutcome, string> = {
  ALLOWED: "Allowed",
  BLOCK: "Blocked",
  FLAG: "Review",
  CLEAN: "Clean",
}

export const outcomeVariants: Record<UrlCheckOutcome, "success" | "destructive" | "warning" | "secondary"> = {
  ALLOWED: "success",
  BLOCK: "destructive",
  FLAG: "warning",
  CLEAN: "secondary",
}

export const blockReasonLabels: Record<BlockReason, string> = {
  SAFE_BROWSING: "Safe Browsing",
  BLOCKLIST: "Blocklist",
  DOMAIN_RULE: "Domain rule",
  ADMIN: "Admin",
  USER_BLOCKED: "Blocked user",
  SCAM_SIGNALS: "Scam signals",
}
