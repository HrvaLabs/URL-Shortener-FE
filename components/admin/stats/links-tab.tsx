"use client"

import { LinkIdentityCells, LinkIdentityHeads } from "@/components/admin/stats/link-identity-cells"
import { RankedList } from "@/components/admin/stats/ranked-list"
import { StackedDailyChart, inFillOrder, type StackFill } from "@/components/admin/stats/stacked-daily-chart"
import { StatGrid } from "@/components/admin/stats/stat-grid"
import { StatsPanel } from "@/components/admin/stats/stats-panel"
import { StatusBadge } from "@/components/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createdViaLabels } from "@/lib/admin-stats"
import { parseServerDateTime } from "@/lib/analytics"
import { useLinksStats } from "@/lib/hooks/useSiteStats"
import { blockReasonLabels } from "@/lib/labels"
import type { AnalyticsRange, BlockReason, CreatedVia, LinksStats, NewestLink } from "@/lib/types"
import { cn, formatDate } from "@/lib/utils"

const channelFills: Record<CreatedVia, StackFill> = {
  WEB: { step: 100 },
  ANONYMOUS_WEB: { step: 100, hatch: true },
  MCP: { step: 55 },
  ANONYMOUS_MCP: { step: 55, hatch: true },
  API_KEY: { step: 25 },
  BULK: { step: 25, hatch: true },
}

interface LinksTabProps {
  days: AnalyticsRange
}

export function LinksTab({ days }: LinksTabProps) {
  const query = useLinksStats(days)
  return <StatsPanel query={query}>{(data) => <LinksBody data={data} days={days} />}</StatsPanel>
}

interface LinksBodyProps {
  data: LinksStats
  days: AnalyticsRange
}

function LinksBody({ data, days }: LinksBodyProps) {
  const { created, createdInRange, now, topTags, topDomains, newest } = data

  return (
    <>
      <StackedDailyChart
        title="Links created per day"
        hint="Links made before this was recorded show as Unknown."
        series={inFillOrder(created, channelFills)}
        labels={createdViaLabels}
        fills={channelFills}
        days={days}
      />
      <StatGrid
        title="Created in this range"
        items={[
          { label: "Total", value: createdInRange.total.toLocaleString() },
          { label: "With an account", value: createdInRange.account.toLocaleString() },
          { label: "Without an account", value: createdInRange.anonymous.toLocaleString() },
          { label: "Tagged ai", value: createdInRange.aiTagged.toLocaleString(), hint: "The AI connector always adds the ai tag." },
        ]}
      />
      <StatGrid
        title="Right now"
        items={[
          { label: "All links", value: now.total.toLocaleString() },
          { label: "Active", value: now.active.toLocaleString() },
          { label: "Inactive", value: now.inactive.toLocaleString(), hint: "Deactivated, expired, over their visit limit or blocked." },
          { label: "Past expiry date", value: now.expired.toLocaleString(), hint: "Past their expiry date, active or not." },
          { label: "Password-protected", value: now.passwordProtected.toLocaleString() },
          { label: "With a visit limit", value: now.withVisitLimit.toLocaleString() },
          { label: "With an expiry date", value: now.withExpiry.toLocaleString() },
        ]}
      />
      <div className="grid gap-4 @3xl:grid-cols-2">
        <RankedList
          title="Blocked links by reason"
          valueLabel="Links"
          entries={now.blockedByReason}
          label={(value) => blockReasonLabels[value as BlockReason] ?? value}
          emptyText="No blocked links."
        />
        <RankedList title="Top tags" valueLabel="Links" entries={topTags} emptyText="No tagged links." />
        <RankedList title="Top destinations" valueLabel="Active links" entries={topDomains} emptyText="No active links." />
      </div>
      <NewestLinks links={newest} days={days} />
    </>
  )
}

interface NewestLinksProps {
  links: NewestLink[]
  days: AnalyticsRange
}

function NewestLinks({ links, days }: NewestLinksProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <h2 className="border-b px-5 py-3.5 text-sm font-semibold">Newest links</h2>
      {links.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No links yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <LinkIdentityHeads />
              <TableHead className="whitespace-nowrap">Made via</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => (
              <TableRow key={link.id}>
                <LinkIdentityCells link={link} days={days} />
                <TableCell className={cn("whitespace-nowrap", link.createdVia === "unknown" && "text-muted-foreground")}>
                  {createdViaLabels[link.createdVia] ?? link.createdVia}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">{formatDate(parseServerDateTime(link.createDate))}</TableCell>
                <TableCell>
                  <StatusBadge status={link.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
