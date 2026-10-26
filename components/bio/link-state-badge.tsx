import { Badge, type BadgeProps } from "@/components/ui/badge"
import { linkStateLabel } from "@/lib/bio"
import type { BioLinkState } from "@/lib/types"
import { cn } from "@/lib/utils"

const LINK_STATE_VARIANTS: Record<Exclude<BioLinkState, "LIVE">, BadgeProps["variant"]> = {
  IN_REVIEW: "warning",
  DEACTIVATED: "secondary",
  EXPIRED: "secondary",
  LIMIT_REACHED: "warning",
  BLOCKED: "destructive",
}

export function LinkStateBadge({ state }: { state: BioLinkState }) {
  const label = linkStateLabel(state)
  if (!label) return null
  return <Badge variant={LINK_STATE_VARIANTS[state as Exclude<BioLinkState, "LIVE">]}>{label.badge}</Badge>
}

export function LinkStateHint({ state, id, className }: { state: BioLinkState; id?: string; className?: string }) {
  const label = linkStateLabel(state)
  if (!label) return null
  return <p id={id} className={cn("text-xs text-muted-foreground", className)}>{label.hint}</p>
}
