import type { DomainRuleType, SourceAction, SourceKind } from "@/lib/types"

export const kindLabels: Record<SourceKind, string> = {
  DOMAINS: "Domains",
  LINKS: "Links",
  TOP_SITES: "Top sites",
}

export const actionLabels: Record<SourceAction, string> = {
  BLOCK: "Block",
  FLAG: "Review",
  TRUST: "Real sign-in pages",
}

export const actionVariants: Record<SourceAction, "destructive" | "warning" | "secondary"> = {
  BLOCK: "destructive",
  FLAG: "warning",
  TRUST: "secondary",
}

export const ruleTypeLabels: Record<DomainRuleType, string> = {
  BLOCK: "Blocked domains",
  ALLOW: "Trusted domains",
}
