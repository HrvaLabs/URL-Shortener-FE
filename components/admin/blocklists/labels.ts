import type { DomainRuleType, SourceAction, SourceKind } from "@/lib/types"

export const kindLabels: Record<SourceKind, string> = {
  DOMAINS: "Domains",
  LINKS: "Links",
  TOP_SITES: "Top sites",
  SHORTENERS: "Shorteners",
  ENDINGS: "Domain endings",
  BRAND_SITES: "Brand sites",
}

export const actionLabels: Record<SourceAction, string> = {
  BLOCK: "Block",
  FLAG: "Review",
  TRUST: "Real sign-in pages",
  NOTE: "Adds a reason",
}

export const actionVariants: Record<SourceAction, "destructive" | "warning" | "secondary"> = {
  BLOCK: "destructive",
  FLAG: "warning",
  TRUST: "secondary",
  NOTE: "secondary",
}

export const allowedActions: Record<SourceKind, SourceAction[]> = {
  DOMAINS: ["BLOCK", "FLAG"],
  LINKS: ["BLOCK", "FLAG"],
  TOP_SITES: ["TRUST"],
  BRAND_SITES: ["TRUST"],
  SHORTENERS: ["NOTE"],
  ENDINGS: ["NOTE"],
}

export const sourceActionLabel = (kind: SourceKind, action: SourceAction) =>
  kind === "BRAND_SITES" && action === "TRUST" ? "Brands' own sites" : actionLabels[action]

export const ruleTypeLabels: Record<DomainRuleType, string> = {
  BLOCK: "Blocked domains",
  ALLOW: "Trusted domains",
}
