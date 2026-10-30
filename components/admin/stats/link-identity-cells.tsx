import Link from "next/link"
import { TableCell, TableHead } from "@/components/ui/table"
import { analyticsHref } from "@/lib/analytics"
import type { AnalyticsRange, NewestLink, TrafficTopLink } from "@/lib/types"
import { cn, shortHostOf } from "@/lib/utils"

export type LinkIdentity = Pick<TrafficTopLink | NewestLink, "id" | "shortUrl" | "domain" | "destinationHost" | "ownerEmail">

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
          className="block min-w-24 font-mono text-[13px] font-medium text-brand [overflow-wrap:anywhere] hover:underline"
        >
          <span className="font-normal text-muted-foreground">{shortHostOf(link.domain)}/</span>{link.shortUrl}
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground">
        <span className="block min-w-32 [overflow-wrap:anywhere]">{link.destinationHost || "—"}</span>
      </TableCell>
      <TableCell>
        <span className={cn("block min-w-36 [overflow-wrap:anywhere]", link.ownerEmail == null && "text-muted-foreground")}>
          {link.ownerEmail ?? "Anonymous"}
        </span>
      </TableCell>
    </>
  )
}
