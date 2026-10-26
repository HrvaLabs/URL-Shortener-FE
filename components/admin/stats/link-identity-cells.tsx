import Link from "next/link"
import { TableCell, TableHead } from "@/components/ui/table"
import { analyticsHref } from "@/lib/analytics"
import type { AnalyticsRange, NewestLink, TrafficTopLink } from "@/lib/types"
import { cn } from "@/lib/utils"

export type LinkIdentity = Pick<TrafficTopLink | NewestLink, "id" | "shortUrl" | "destinationHost" | "ownerEmail">

export function LinkIdentityHeads() {
  return (
    <>
      <TableHead>Link</TableHead>
      <TableHead>Destination</TableHead>
      <TableHead>Owner</TableHead>
    </>
  )
}

interface LinkIdentityCellsProps {
  link: LinkIdentity
  days: AnalyticsRange
}

export function LinkIdentityCells({ link, days }: LinkIdentityCellsProps) {
  return (
    <>
      <TableCell>
        <Link
          href={analyticsHref({ link: link.id, days })}
          className="whitespace-nowrap font-mono text-[13px] font-medium text-brand hover:underline"
        >
          /{link.shortUrl}
        </Link>
      </TableCell>
      <TableCell className="max-w-[240px] text-muted-foreground">
        <span className="block truncate" title={link.destinationHost || undefined}>
          {link.destinationHost || "—"}
        </span>
      </TableCell>
      <TableCell className="max-w-[220px]">
        <span className={cn("block truncate", link.ownerEmail == null && "text-muted-foreground")} title={link.ownerEmail ?? undefined}>
          {link.ownerEmail ?? "Anonymous"}
        </span>
      </TableCell>
    </>
  )
}
