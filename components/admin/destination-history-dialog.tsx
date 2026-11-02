"use client"

import { useId, useState } from "react"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { adminSelectClass } from "@/components/admin/sort-controls"
import { SEARCH_DELAY_MS } from "@/lib/hooks/useListSearch"
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue"
import { useDestinationHistory } from "@/lib/hooks/useUrls"
import { HISTORY_SORTS, VIA_LABELS } from "@/lib/link-edit"
import { shortHost } from "@/lib/domains"
import { cn, formatDateTime, shortHostOf } from "@/lib/utils"
import type { UrlResponse } from "@/lib/types"

const emDash = String.fromCodePoint(0x2014)

interface DestinationHistoryDialogProps {
  link: UrlResponse | null
  onOpenChange(open: boolean): void
  onCloseAutoFocus?(event: Event): void
}

/** A link's destination history for admins: who changed it, when, how, and from what to what. Paged, sorted and searched on the server. */
export function DestinationHistoryDialog({ link, onOpenChange, onCloseAutoFocus }: DestinationHistoryDialogProps) {
  const [shown, setShown] = useState<UrlResponse | null>(link)
  if (link !== null && link !== shown) setShown(link)

  return (
    <Dialog open={link !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl" onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle className="leading-snug [overflow-wrap:anywhere]">
            Destination history {emDash} {shortHost(shown?.domain, shortHostOf())}/{shown?.shortUrl}
          </DialogTitle>
          <DialogDescription>Every change of where this link points, kept while the link exists.</DialogDescription>
        </DialogHeader>
        {shown && <HistoryList key={shown.id} linkId={shown.id} />}
      </DialogContent>
    </Dialog>
  )
}

function HistoryList({ linkId }: { linkId: number }) {
  const id = useId()
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DELAY_MS)
  const [sortValue, setSortValue] = useState<string>(HISTORY_SORTS[0].value)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [sort, order] = sortValue.split(",")
  const [seenSearch, setSeenSearch] = useState(search)
  if (search !== seenSearch) {
    setSeenSearch(search)
    setPage(0)
  }
  const { data, error, isPending, isFetching, refetch } = useDestinationHistory(linkId, page, size, sort, order, search)
  const rows = data?.content ?? []

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search destinations or emails..."
            aria-label="Search the history by destination or email"
            className="h-9 pl-9"
          />
        </div>
        <label htmlFor={`${id}-sort`} className="sr-only">Sort by</label>
        <select
          id={`${id}-sort`}
          value={sortValue}
          onChange={(event) => {
            setSortValue(event.target.value)
            setPage(0)
          }}
          className={adminSelectClass}
        >
          {HISTORY_SORTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>

      {isPending ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error && !data ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <p role="alert" className="text-destructive [overflow-wrap:anywhere]">{error instanceof Error && error.message ? error.message : "Couldn't load the history."}</p>
          <Button type="button" variant="outline" size="sm" aria-disabled={isFetching} onClick={() => { if (!isFetching) void refetch() }} className="aria-disabled:opacity-50">Retry</Button>
        </div>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{search ? "No changes match." : "The destination hasn't changed since the link was made."}</p>
      ) : (
        <div className={cn("overflow-hidden rounded-lg border", isFetching && "opacity-70")}>
          <ol className="divide-y">
            {rows.map((change) => (
              <li key={change.id} className="space-y-1.5 p-3 text-sm">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span className="tabular-nums">{formatDateTime(change.changedAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-foreground [overflow-wrap:anywhere]">{change.changedBy}</span>
                  <span aria-hidden="true">·</span>
                  <span>{VIA_LABELS[change.via] ?? change.via}</span>
                  {change.forced && <Badge variant="warning" className="whitespace-nowrap">Saved anyway</Badge>}
                </p>
                <p className="[overflow-wrap:anywhere]"><span className="text-muted-foreground">From </span>{change.oldLongUrl}</p>
                <p className="[overflow-wrap:anywhere]"><span className="text-muted-foreground">To </span>{change.newLongUrl}</p>
              </li>
            ))}
          </ol>
          <Pagination
            page={page}
            totalPages={data?.totalPages ?? 0}
            totalElements={data?.totalElements}
            size={size}
            onPageChange={setPage}
            onSizeChange={(next) => {
              setSize(next)
              setPage(0)
            }}
            label="the destination history"
          />
        </div>
      )}
    </div>
  )
}
