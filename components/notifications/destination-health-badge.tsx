"use client"

import Link from "next/link"
import { TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { parseServerDateTime } from "@/lib/analytics"
import { useNotificationConsents } from "@/lib/hooks/useNotifications"
import { DEAD_LINK_EMAIL_PROMPT, DEAD_LINK_EMAIL_SETTINGS_HREF, DESTINATION_STATUS_LABELS, isConsentedTo } from "@/lib/notifications"
import type { DestinationHealth } from "@/lib/types"
import { cn, formatDate } from "@/lib/utils"

const UNKNOWN_STATUS = "The destination stopped working."

interface DestinationHealthBadgeProps {
  health?: DestinationHealth | null
  active: boolean
  emailPrompt?: boolean
  className?: string
}

function DeadLinkEmailPrompt() {
  const { data, isPending, isError } = useNotificationConsents()
  if (isPending) return null
  if (!isError && isConsentedTo(data, "DEAD_LINK_EMAIL")) return null
  return (
    <p className="text-xs">
      <Link href={DEAD_LINK_EMAIL_SETTINGS_HREF} className="text-brand-link">{DEAD_LINK_EMAIL_PROMPT}</Link>
    </p>
  )
}

export function DestinationHealthBadge({ health, active, emailPrompt = false, className }: DestinationHealthBadgeProps) {
  if (!health || !active) return null
  const reason = DESTINATION_STATUS_LABELS[health.lastStatus] ?? UNKNOWN_STATUS
  return (
    <div className={cn("mt-1.5 space-y-1", className)}>
      <Badge variant="warning">
        <TriangleAlert className="h-3 w-3" aria-hidden="true" />
        Destination looks dead
      </Badge>
      <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
        Since {formatDate(parseServerDateTime(health.deadSince))}. {reason}{" "}
        <Link href="/help/notifications#dead-links" className="text-brand-link">What this means</Link>
      </p>
      {emailPrompt && <DeadLinkEmailPrompt />}
    </div>
  )
}
