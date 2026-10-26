import Link from "next/link"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { URLS_PAGE, linkStateHint, linkStateLabel } from "@/lib/bio"
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

export function UrlsPageText({ text }: { text: string }) {
  const at = text.indexOf(URLS_PAGE)
  if (at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <Link href="/dashboard" className="text-brand-link">{URLS_PAGE}</Link>
      {text.slice(at + URLS_PAGE.length)}
    </>
  )
}

export function LinkStateHint({ state, shortUrl, id, className }: { state: BioLinkState; shortUrl: string; id?: string; className?: string }) {
  const hint = linkStateHint(state, shortUrl)
  if (!hint) return null
  return (
    <p id={id} className={cn("text-xs text-muted-foreground [overflow-wrap:anywhere]", className)}>
      <UrlsPageText text={hint} />
    </p>
  )
}
