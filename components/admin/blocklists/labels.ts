import type { DomainRuleType, SourceAction, SourceKind } from "@/lib/types"

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
