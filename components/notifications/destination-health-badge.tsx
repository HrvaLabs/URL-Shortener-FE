import Link from "next/link"
import { TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { parseServerDateTime } from "@/lib/analytics"
import { DESTINATION_STATUS_LABELS } from "@/lib/notifications"
import type { DestinationHealth } from "@/lib/types"
import { cn, formatDate } from "@/lib/utils"

const UNKNOWN_STATUS = "The destination stopped working."

interface DestinationHealthBadgeProps {
  health?: DestinationHealth | null
  active: boolean
  className?: string
}

export function DestinationHealthBadge({ health, active, className }: DestinationHealthBadgeProps) {
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
    </div>
  )
}
