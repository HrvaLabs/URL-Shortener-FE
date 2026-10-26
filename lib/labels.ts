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
  SAFE_BROWSING: "Google Safe Browsing",
  BLOCKLIST: "On a blocklist",
  DOMAIN_RULE: "Blocked domain",
  ADMIN: "Blocked by an admin",
  USER_BLOCKED: "Owner's account blocked",
  SCAM_SIGNALS: "Scam signals",
}
