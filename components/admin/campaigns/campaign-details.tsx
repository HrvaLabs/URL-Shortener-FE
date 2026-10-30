"use client"

import type { FormEvent } from "react"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SortSelect, type SortOption } from "@/components/admin/sort-controls"
import { useCampaignDetail, useCampaignLinks } from "@/lib/hooks/useCampaigns"
import { useListSearch } from "@/lib/hooks/useListSearch"
import { prefixedParam, useClampedPage, usePagination } from "@/lib/hooks/usePagination"
import { blockReasonLabels } from "@/lib/labels"
import { reportStatusText } from "@/lib/moderation"
import { shortHostOf } from "@/lib/utils"
import type { Campaign, CampaignLink } from "@/lib/types"

const LINKS_PREFIX = "links"

const LINKS_SEARCH_PARAM = prefixedParam(LINKS_PREFIX, "search")

export const campaignLinkParams = ["page", "size", "sort", "order", "search"].map((name) => prefixedParam(LINKS_PREFIX, name))

const DEFAULT_SORT = "createDate"

const sortFields = ["createDate", "id"]

const sortOptions: SortOption[] = [
  { field: "createDate", direction: "desc", label: "Newest first" },
  { field: "createDate", direction: "asc", label: "Oldest first" },
]

const linkState = (link: CampaignLink) => {
  if (link.blockReason === "CAMPAIGN") return { label: "Held", variant: "warning" as const }
  if (link.blockReason) return { label: blockReasonLabels[link.blockReason], variant: "destructive" as const }
  return link.active ? { label: "Active", variant: "success" as const } : { label: "Off", variant: "secondary" as const }
}

export function CampaignDetails({ campaign, panelId }: { campaign: Campaign; panelId: string }) {
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useCampaignDetail(campaign.id, true)

  return (
    <div id={panelId} className="mt-4 space-y-6 border-t pt-4">
      <section aria-label="Domains" className="space-y-2">
        <h3 className="text-sm font-semibold">Domains</h3>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : error || !data ? (
          <div className="rounded-lg border px-4 py-6 text-center">
            <p className="text-sm font-medium text-destructive">Failed to load the domains</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()} disabled={isFetching}>Retry</Button>
          </div>
        ) : data.domains.length === 0 ? (
          <p className="text-sm text-muted-foreground">No domains.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead className="text-right">Links</TableHead>
                  <TableHead>Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.domains.map((entry) => (
                  <TableRow key={entry.domain}>
                    <TableCell>
                      <span className="block min-w-32 font-mono text-[13px] [overflow-wrap:anywhere]">{entry.domain}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{entry.links.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="block min-w-32 [overflow-wrap:anywhere]">{reportStatusText(entry.report, new Date(dataUpdatedAt))}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <CampaignLinks campaign={campaign} />
    </div>
  )
}

function CampaignLinks({ campaign }: { campaign: Campaign }) {
  const { page, size, sort, order, setPage, setSize, setSortOrder } = usePagination(DEFAULT_SORT, "desc", sortFields, LINKS_PREFIX)
  const { search, searchInput, setSearchInput, applySearch } = useListSearch(() => setPage(0), LINKS_SEARCH_PARAM)
  const { data, isLoading, error, refetch, isFetching } = useCampaignLinks(campaign.id, page, size, sort, order, search)
  useClampedPage(page, data?.totalPages, setPage)
  const links = data?.content ?? []

  return (
    <section aria-label="Links" className="space-y-3">
      <h3 className="text-sm font-semibold">Links</h3>
      <div className="flex flex-wrap items-center gap-3">
        <form
          role="search"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            applySearch(searchInput)
          }}
          className="relative w-full sm:max-w-sm"
        >
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search short link or destination"
            aria-label={`Search the links of ${campaign.shape} by short link or destination`}
            spellCheck={false}
            autoCapitalize="none"
            className="h-9 pl-9"
          />
        </form>
        <SortSelect options={sortOptions} sort={sort} order={order} onChange={setSortOrder} />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border px-4 py-8 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load the links</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()} disabled={isFetching}>Retry</Button>
        </div>
      ) : links.length === 0 ? (
        <p className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">{search ? "No links match." : "No links."}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Short link</TableHead>
                <TableHead className="hidden @2xl:table-cell">Destination</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => {
                const state = linkState(link)
                return (
                  <TableRow key={link.id}>
                    <TableCell>
                      <span className="block min-w-24 font-mono text-[13px] font-medium [overflow-wrap:anywhere]">
                        <span className="font-normal text-muted-foreground">{shortHostOf(null)}/</span>{link.shortUrl}
                      </span>
                      <span className="mt-1 block min-w-32 text-xs text-muted-foreground [overflow-wrap:anywhere] @2xl:hidden">{link.longUrl}</span>
                    </TableCell>
                    <TableCell className="hidden @2xl:table-cell">
                      <span className="block min-w-48 text-muted-foreground [overflow-wrap:anywhere]">{link.longUrl}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={state.variant}>{state.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{link.clicks.toLocaleString()}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            totalPages={data?.totalPages ?? 0}
            totalElements={data?.totalElements}
            size={size}
            onPageChange={setPage}
            onSizeChange={setSize}
          />
        </div>
      )}
    </section>
  )
}
