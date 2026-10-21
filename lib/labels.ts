import type { BlockReason, UrlCheckOutcome } from "@/lib/types"

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
