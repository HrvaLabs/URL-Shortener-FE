"use client"

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { useSearchParams } from "next/navigation"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, ChevronDown, Copy, Search } from "lucide-react"
import { toast } from "sonner"
import { useClampedPage, usePagination } from "@/lib/hooks/usePagination"
import { useListSearch } from "@/lib/hooks/useListSearch"
import { Pagination } from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BlockDomainDialog } from "@/components/admin/block-domain-dialog"
import { BioPageReviewSection } from "@/components/admin/bio-page-review-section"
import { PageMeta } from "@/components/page-meta"
import { SortSelect, adminSelectClass, type SortOption } from "@/components/admin/sort-controls"
import { useRowRemovalFocus } from "@/lib/hooks/useRowRemovalFocus"
import { parseServerDateTime } from "@/lib/analytics"
import { cn, formatDateTime, formatShortUrl, plural, shortHostOf } from "@/lib/utils"
import { adminApi, ApiError } from "@/lib/api-client"
import type { ReviewAction, ReviewBulkResolveResult, ReviewEntry, ReviewQueueFilters } from "@/lib/types"

type RowAction = Exclude<ReviewAction, "BLOCK_DOMAIN">


const DAY_MS = 24 * 60 * 60 * 1000

const reasonOptions = [
  { value: "young", label: "Young domain" },
  { value: "imitates", label: "Lookalike" },
  { value: "lure", label: "Lure" },
  { value: "on list", label: "On a list" },
  { value: "redirects to", label: "Redirects elsewhere" },
  { value: "reported by a visitor", label: "Reported by a visitor" },
  { value: "Spamhaus", label: "Spamhaus" },
  { value: "Random-looking", label: "Random-looking domain" },
]

const ageOptions = [
  { value: "1", label: "Older than 1 day" },
  { value: "7", label: "Older than 7 days" },
  { value: "30", label: "Older than 30 days" },
]

const resolveMessages: Record<RowAction, { success: string; failure: string }> = {
  OK: { success: "Marked as fine", failure: "Failed to mark as fine" },
  TRUST_DOMAIN: { success: "Domain trusted", failure: "Failed to trust the domain" },
  BLOCK_LINK: { success: "Link blocked", failure: "Failed to block the link" },
  BLOCK_USER: { success: "User blocked", failure: "Failed to block the user" },
}

const bulkMessages: Record<ReviewAction, { success: (links: string) => string; failure: string }> = {
  OK: { success: (links) => `Marked ${links} as fine`, failure: "Failed to mark the selected links as fine" },
  TRUST_DOMAIN: { success: (links) => `Trusted the domains of ${links}`, failure: "Failed to trust the selected domains" },
  BLOCK_LINK: { success: (links) => `Blocked ${links}`, failure: "Failed to block the selected links" },
  BLOCK_DOMAIN: { success: (links) => `Blocked the domains of ${links}`, failure: "Failed to block the selected domains" },
  BLOCK_USER: { success: (links) => `Blocked the owners of ${links}`, failure: "Failed to block the selected users" },
}

const rowButton = "h-8 px-2.5 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"

const accountAge = (createdAt: string | null, now: number) => {
  if (!createdAt) return null
  const days = Math.floor((now - parseServerDateTime(createdAt).getTime()) / DAY_MS)
  if (days < 1) return "made today"
  if (days < 60) return `${plural(days, "day")} old`
  const months = Math.floor(days / 30)
  if (months < 24) return `${plural(months, "month")} old`
  return `${plural(Math.floor(days / 365), "year")} old`
}

const timeAgo = (value: string, now: number) => {
  const date = parseServerDateTime(value)
  const minutes = Math.floor((now - date.getTime()) / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${plural(minutes, "minute")} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${plural(hours, "hour")} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${plural(days, "day")} ago`
  if (days < 365) return `${plural(Math.floor(days / 30), "month")} ago`
  return `${plural(Math.floor(days / 365), "year")} ago`
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname || null
  } catch {
    return null
  }
}

const ownerLabel = (entry: ReviewEntry) =>
  entry.ownerId == null ? "Anonymous" : entry.ownerEmail ?? `User ${entry.ownerId}`

const isIpAddress = (host: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")

const distinct = <T,>(values: (T | null)[]) => [...new Set(values.filter((value): value is T => value != null))]

const reportBulkResult = (action: ReviewAction, { resolved, failed }: ReviewBulkResolveResult) => {
  if (failed.length === 0) {
    toast.success(bulkMessages[action].success(plural(resolved.length, "link")))
    return
  }
  const summary = `${resolved.length} resolved, ${failed.length} failed`
  const description = distinct(failed.map((failure) => failure.error)).slice(0, 3).join(" ")
  if (resolved.length === 0) toast.error(summary, { description })
  else toast.warning(summary, { description })
}

export default function AdminReviewPage() {
  return (
    <Suspense fallback={<ReviewQueueLoading />}>
      <ReviewQueue />
    </Suspense>
  )
}

function ReviewQueueLoading() {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-5">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

const queueSortFields = ["flaggedAt"]

const queueSortOptions: SortOption[] = [
  { field: "flaggedAt", direction: "desc", label: "Newest flagged first" },
  { field: "flaggedAt", direction: "asc", label: "Oldest flagged first" },
]

function ReviewQueue() {
  const searchParams = useSearchParams()
  const entryParam = searchParams.get("entry")
  const entryId = entryParam && /^\d+$/.test(entryParam) ? Number(entryParam) : null
  const { page, size, sort, order, setPage, setSize, setSortOrder } = usePagination("flaggedAt", "desc", queueSortFields)
  const { search, searchInput, setSearchInput, applySearch } = useListSearch(() => setPage(0))
  const [reason, setReason] = useState("")
  const [olderThanDays, setOlderThanDays] = useState("")
  const filters: ReviewQueueFilters = {
    page,
    size,
    reason: reason || undefined,
    olderThanDays: olderThanDays ? Number(olderThanDays) : undefined,
    search: search || undefined,
    sort,
    order,
  }
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt, errorUpdatedAt } = useQuery({
    queryKey: ["admin", "review", "queue", filters],
    queryFn: () => adminApi.getReviewQueue(filters),
    placeholderData: keepPreviousData,
  })
  useClampedPage(page, data?.totalPages, setPage)
  const resolveReview = useMutation({
    mutationFn: ({ urlId, action, longUrl }: { urlId: number; action: RowAction; longUrl: string }) =>
      adminApi.resolveReview(urlId, action, action === "TRUST_DOMAIN" ? hostOf(longUrl) ?? undefined : undefined),
  })
  const resolveReviews = useMutation({
    mutationFn: ({ urlIds, action }: { urlIds: number[]; action: ReviewAction }) => adminApi.resolveReviews(urlIds, action),
  })
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set())
  const [blockTarget, setBlockTarget] = useState<ReviewEntry | null>(null)
  const [blockOpen, setBlockOpen] = useState(false)
  const entries = data?.content ?? []
  const selectionKey = `${page}-${size}-${reason}-${olderThanDays}-${search}-${sort}-${order}`
  const [selection, setSelection] = useState<{ key: string; ids: Set<number> }>({ key: selectionKey, ids: new Set() })
  const selectedIds = selection.key === selectionKey ? selection.ids : new Set<number>()
  const setSelectedIds = (update: Set<number> | ((prev: Set<number>) => Set<number>)) =>
    setSelection((prev) => {
      const current = prev.key === selectionKey ? prev.ids : new Set<number>()
      return { key: selectionKey, ids: typeof update === "function" ? update(current) : update }
    })
  const selectedEntries = entries.filter((entry) => selectedIds.has(entry.urlId))
  const allSelected = entries.length > 0 && entries.every((entry) => selectedIds.has(entry.urlId))
  const entryShown = entryId != null && entries.some((entry) => entry.urlId === entryId)
  const entryRowRef = useRef<HTMLTableRowElement>(null)
  const scrolledEntry = useRef<number | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstRemainingRow = useCallback(
    () => document.querySelector<HTMLElement>("[data-review-table] tbody [data-remove-row]") ?? headingRef.current,
    [],
  )
  const removalFocus = useRowRemovalFocus(firstRemainingRow)
  const restoreFocus = removalFocus.restore
  const restoreAfterRefetch = useRef(false)
  const queueSettled = !isFetching && !(data && data.totalPages > 0 && page >= data.totalPages)
  const blockReturnRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!restoreAfterRefetch.current || !queueSettled) return
    restoreAfterRefetch.current = false
    restoreFocus()
  }, [queueSettled, dataUpdatedAt, errorUpdatedAt, restoreFocus])

  useEffect(() => {
    if (!entryShown || scrolledEntry.current === entryId) return
    entryRowRef.current?.scrollIntoView({ block: "center" })
    scrolledEntry.current = entryId
  }, [entryShown, entryId])

  const setBusy = (ids: number[], busy: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (busy) next.add(id)
        else next.delete(id)
      }
      return next
    })

  const refreshAfter = (action: ReviewAction) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "review"] }),
      queryClient.invalidateQueries({ queryKey: ["urls"] }),
      (action === "TRUST_DOMAIN" || action === "BLOCK_DOMAIN") && queryClient.invalidateQueries({ queryKey: ["admin", "domain-rules"] }),
      action === "BLOCK_USER" && queryClient.invalidateQueries({ queryKey: ["users"] }),
    ])

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const selectAll = () => setSelectedIds(allSelected ? new Set() : new Set(entries.map((entry) => entry.urlId)))

  const resolve = async (entry: ReviewEntry, action: RowAction, anchor: HTMLElement | null) => {
    if (busyIds.has(entry.urlId)) return
    removalFocus.capture(anchor)
    setBusy([entry.urlId], true)
    try {
      await resolveReview.mutateAsync({ urlId: entry.urlId, action, longUrl: entry.longUrl })
      restoreAfterRefetch.current = true
      const host = hostOf(entry.longUrl)
      toast.success(action === "TRUST_DOMAIN" && host ? `Trusted ${host}` : resolveMessages[action].success)
      await refreshAfter(action)
    } catch (err) {
      toast.error(err instanceof ApiError && err.message ? err.message : resolveMessages[action].failure)
      removalFocus.restore()
    } finally {
      setBusy([entry.urlId], false)
    }
  }

  const firstUnselectedAnchor = () =>
    document.querySelector<HTMLElement>("[data-review-table] tbody tr:not([data-state=selected]) [data-remove-row]")

  const resolveSelected = async (action: ReviewAction) => {
    const urlIds = selectedEntries.map((entry) => entry.urlId)
    if (resolveReviews.isPending || urlIds.length === 0) return
    removalFocus.setTarget(firstUnselectedAnchor())
    setBusy(urlIds, true)
    try {
      const result = await resolveReviews.mutateAsync({ urlIds, action })
      restoreAfterRefetch.current = true
      reportBulkResult(action, result)
      setSelectedIds(new Set())
      await refreshAfter(action)
    } catch (err) {
      toast.error(err instanceof ApiError && err.message ? err.message : bulkMessages[action].failure)
      removalFocus.restore()
    } finally {
      setBusy(urlIds, false)
    }
  }

  const openBlockDomain = (entry: ReviewEntry, returnTo: HTMLElement | null) => {
    blockReturnRef.current = returnTo
    setBlockTarget(entry)
    setBlockOpen(true)
  }

  const filtered = !!reason || !!olderThanDays || !!search

  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Review queue" description="Flagged links and bio pages waiting for a decision on hrva.cc." />
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="rounded-sm font-display text-2xl">Review queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">Flagged links and bio pages waiting for your decision</p>
      </div>

      <BioPageReviewSection fallbackFocusRef={headingRef} />

      <h2 className="text-sm font-semibold">Links</h2>
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
            placeholder="Search domain, owner or short link"
            aria-label="Search flagged links by domain, owner email or short link"
            spellCheck={false}
            autoCapitalize="none"
            className="h-9 pl-9"
          />
        </form>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Reason
          <select
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setPage(0)
            }}
            className={adminSelectClass}
          >
            <option value="">Any</option>
            {reasonOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Link age
          <select
            value={olderThanDays}
            onChange={(e) => {
              setOlderThanDays(e.target.value)
              setPage(0)
            }}
            className={adminSelectClass}
          >
            <option value="">Any</option>
            {ageOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <SortSelect options={queueSortOptions} sort={sort} order={order} onChange={setSortOrder} />
      </div>

      {selectedEntries.length > 0 && (
        <BulkActions
          entries={selectedEntries}
          busy={resolveReviews.isPending}
          onResolve={resolveSelected}
          onClear={() => setSelectedIds(new Set())}
          onConfirmClose={removalFocus.onCloseAutoFocus}
        />
      )}

      {entryId != null && data && !error && !entryShown && (
        <p className="text-sm text-muted-foreground">This entry is no longer open or is on another page.</p>
      )}

      {isLoading ? (
        <ReviewQueueLoading />
      ) : error ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load the review queue</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()} disabled={isFetching}>Retry</Button>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="font-semibold">{search ? "No flagged links match" : "Nothing waiting for a decision."}</p>
          {filtered && <p className="mt-1 text-sm text-muted-foreground">Try a different search or filter.</p>}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table data-review-table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={selectAll}
                    aria-label="Select all entries on this page"
                    className="h-4 w-4 rounded border-input accent-brand"
                  />
                </TableHead>
                <TableHead>Short link</TableHead>
                <TableHead className="hidden @4xl:table-cell">Destination</TableHead>
                <TableHead className="hidden @min-[67rem]:table-cell">Owner</TableHead>
                <TableHead className="hidden @min-[67rem]:table-cell">Created</TableHead>
                <TableHead className="hidden @2xl:table-cell">Reasons</TableHead>
                <TableHead className="sticky right-0 bg-card bg-[linear-gradient(hsl(var(--muted)/0.5),hsl(var(--muted)/0.5))] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const highlighted = entry.urlId === entryId
                const selected = selectedIds.has(entry.urlId)
                const anonymous = entry.ownerId == null
                const age = accountAge(entry.ownerCreatedAt, dataUpdatedAt)
                return (
                  <TableRow
                    key={entry.urlId}
                    ref={highlighted ? entryRowRef : undefined}
                    aria-current={highlighted ? "true" : undefined}
                    data-state={selected ? "selected" : undefined}
                    className={cn("group", highlighted && "bg-brand-soft hover:bg-brand-soft")}
                  >
                    <TableCell className="w-10">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelect(entry.urlId)}
                        aria-label={`Select ${shortHostOf(entry.domain)}/${entry.shortUrl}`}
                        className="h-4 w-4 rounded border-input accent-brand"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="block min-w-24 font-mono text-[13px] font-medium text-brand [overflow-wrap:anywhere]">
                          <span className="font-normal text-muted-foreground">{shortHostOf(entry.domain)}/</span>{entry.shortUrl}
                        </span>
                        <CopyShortLinkButton shortUrl={entry.shortUrl} hostname={entry.domain} />
                      </div>
                      <p className="mt-1 min-w-32 text-xs text-muted-foreground [overflow-wrap:anywhere] @lg:min-w-56 @4xl:hidden">{entry.longUrl}</p>
                      <div className="mt-1 flex min-w-32 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground @lg:min-w-56 @min-[67rem]:hidden">
                        <span className="min-w-0 [overflow-wrap:anywhere]">{ownerLabel(entry)}</span>
                        {!anonymous && age && <span className="tabular-nums">Account {age}</span>}
                        {entry.possibleScammer && <Badge variant="warning">Possible scammer</Badge>}
                      </div>
                      <p className="mt-1 min-w-32 text-xs tabular-nums text-muted-foreground @lg:min-w-56 @min-[67rem]:hidden">
                        Created {timeAgo(entry.createDate, dataUpdatedAt)} ({formatDateTime(parseServerDateTime(entry.createDate))}) · Flagged {formatDateTime(parseServerDateTime(entry.flaggedAt))}
                      </p>
                      <ReasonList reasons={entry.reasons} className="mt-1.5 min-w-32 @lg:min-w-56 @2xl:hidden" />
                    </TableCell>
                    <TableCell className="hidden @4xl:table-cell">
                      <span className="block min-w-48 text-muted-foreground [overflow-wrap:anywhere]">{entry.longUrl}</span>
                    </TableCell>
                    <TableCell className="hidden @min-[67rem]:table-cell">
                      <span className={cn("block min-w-36 [overflow-wrap:anywhere]", anonymous && "text-muted-foreground")}>
                        {ownerLabel(entry)}
                      </span>
                      {!anonymous && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {age && <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">Account {age}</span>}
                          {entry.possibleScammer && <Badge variant="warning" className="whitespace-nowrap">Possible scammer</Badge>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden tabular-nums text-muted-foreground @min-[67rem]:table-cell">
                      <span className="block whitespace-nowrap">{timeAgo(entry.createDate, dataUpdatedAt)}</span>
                      <span className="block whitespace-nowrap text-xs">{formatDateTime(parseServerDateTime(entry.createDate))}</span>
                      <span className="block text-xs">Flagged {formatDateTime(parseServerDateTime(entry.flaggedAt))}</span>
                    </TableCell>
                    <TableCell className="hidden @2xl:table-cell">
                      {entry.reasons.length > 0 ? (
                        <ReasonList reasons={entry.reasons} className="min-w-40 max-w-64" />
                      ) : (
                        <span className="text-muted-foreground">{"—"}</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "sticky right-0 bg-card text-right transition-colors",
                        highlighted || selected ? "bg-brand-soft" : "group-hover:bg-[linear-gradient(hsl(var(--muted)/0.4),hsl(var(--muted)/0.4))]",
                      )}
                    >
                      <ReviewActions
                        entry={entry}
                        busy={busyIds.has(entry.urlId)}
                        onResolve={resolve}
                        onBlockDomain={openBlockDomain}
                        onConfirmClose={removalFocus.onCloseAutoFocus}
                      />
                    </TableCell>
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

      <BlockDomainDialog
        longUrl={blockTarget?.longUrl ?? ""}
        urlId={blockTarget?.urlId}
        open={blockOpen}
        onOpenChange={setBlockOpen}
        onBlocked={() => removalFocus.setTarget(null)}
        onCloseAutoFocus={(event) => removalFocus.onCloseAutoFocus(event, blockReturnRef.current)}
      />
    </div>
  )
}

interface BulkActionsProps {
  entries: ReviewEntry[]
  busy: boolean
  onResolve(action: ReviewAction): void
  onClear(): void
  onConfirmClose(event: Event): void
}

function BulkActions({ entries, busy, onResolve, onClear, onConfirmClose }: BulkActionsProps) {
  const links = plural(entries.length, "link")
  const withDomain = entries.filter((entry) => entry.host != null && !isIpAddress(entry.host))
  const hosts = distinct(withDomain.map((entry) => entry.host))
  const registrableDomains = distinct(withDomain.map((entry) => entry.registrableDomain))
  const withoutDomain = entries.length - withDomain.length
  const owners = distinct(entries.map((entry) => entry.ownerId)).length
  const anonymous = entries.some((entry) => entry.ownerId == null)
  const owned = entries.filter((entry) => entry.ownerId != null).length
  const blockedLinksEmail =
    owned === 0
      ? "Nobody is emailed: none of them has an owner."
      : owned === 1
        ? "The owner of 1 link is emailed."
        : `The owners of ${plural(owned, "link")} are emailed.`

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 px-4 py-2.5">
      <span className="mr-1 text-sm font-medium tabular-nums">{entries.length} selected</span>
      <Button size="sm" variant="outline" className="h-8" onClick={() => onResolve("OK")} disabled={busy}>
        Looks fine
      </Button>
      <BulkConfirm
        label={`Block ${links}`}
        title={`Block ${links}?`}
        description={`The links stop working. ${blockedLinksEmail}`}
        destructive
        busy={busy}
        onConfirm={() => onResolve("BLOCK_LINK")}
        onConfirmClose={onConfirmClose}
      />
      <BulkConfirm
        label="Trust domain"
        title={`Trust the domains of ${links}?`}
        description="This adds an allow rule for each domain below and its subdomains, marks every open entry for them as fine, and restores their links that a blocklist or the checks blocked."
        domains={hosts}
        withoutDomain={withoutDomain}
        busy={busy}
        onConfirm={() => onResolve("TRUST_DOMAIN")}
        onConfirmClose={onConfirmClose}
      />
      <BulkConfirm
        label="Block domain"
        title={`Block the domains of ${links}?`}
        description="Every active link to each domain below is deactivated and its owner emailed, and new links to them are refused."
        domains={registrableDomains}
        withoutDomain={withoutDomain}
        destructive
        busy={busy}
        onConfirm={() => onResolve("BLOCK_DOMAIN")}
        onConfirmClose={onConfirmClose}
      />
      {anonymous ? (
        <span className="flex items-center gap-2">
          <Button size="sm" variant="destructive" className="h-8 cursor-not-allowed opacity-50 hover:bg-destructive" aria-disabled="true" aria-describedby="bulk-block-user-note">
            Block user
          </Button>
          <span id="bulk-block-user-note" className="text-xs text-muted-foreground">Some selected links have no owner.</span>
        </span>
      ) : (
        <BulkConfirm
          label="Block user"
          title={`Block the owners of ${links}?`}
          description={`This deactivates ${owners === 1 ? "1 account" : `${owners} accounts`} and blocks all of ${owners === 1 ? "its" : "their"} links.`}
          destructive
          busy={busy}
          onConfirm={() => onResolve("BLOCK_USER")}
          onConfirmClose={onConfirmClose}
        />
      )}
      <Button size="sm" variant="ghost" className="h-8" onClick={onClear} disabled={busy}>
        Clear
      </Button>
    </div>
  )
}

interface BulkConfirmProps {
  label: string
  title: string
  description: string
  domains?: string[]
  withoutDomain?: number
  destructive?: boolean
  busy: boolean
  onConfirm(): void
  onConfirmClose(event: Event): void
}

function BulkConfirm({ label, title, description, domains, withoutDomain = 0, destructive = false, busy, onConfirm, onConfirmClose }: BulkConfirmProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant={destructive ? "destructive" : "outline"} className="h-8" disabled={busy}>
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onCloseAutoFocus={onConfirmClose}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {domains && domains.length > 0 && (
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border px-3 py-2 font-mono text-[13px]">
            {domains.map((domain) => (
              <li key={domain} className="break-all">{domain}</li>
            ))}
          </ul>
        )}
        {domains && withoutDomain > 0 && (
          <p className="text-sm text-muted-foreground">
            {plural(withoutDomain, "selected link")} {withoutDomain === 1 ? "has" : "have"} no domain to act on and will stay open.
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
          >
            {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ReasonList({ reasons, className }: { reasons: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-0.5 text-xs", className)}>
      {reasons.map((item, index) => (
        <li key={`${index}-${item}`} className="wrap-anywhere">{item}</li>
      ))}
    </ul>
  )
}

function CopyShortLinkButton({ shortUrl, hostname }: { shortUrl: string; hostname?: string | null }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatShortUrl(shortUrl, hostname))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Copy failed. Select the text and copy it manually.")
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" onClick={copy} aria-label="Copy short link" className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{copied ? "Copied" : "Copy short link"}</TooltipContent>
    </Tooltip>
  )
}

interface ReviewActionsProps {
  entry: ReviewEntry
  busy: boolean
  onResolve(entry: ReviewEntry, action: RowAction, anchor: HTMLElement | null): void
  onBlockDomain(entry: ReviewEntry, returnTo: HTMLElement | null): void
  onConfirmClose(event: Event, returnTo?: HTMLElement | null): void
}

type MenuDialog = "TRUST_DOMAIN" | "BLOCK_USER"

const menuOpenKeys = new Set(["Enter", " ", "ArrowDown"])

function ReviewActions({ entry, busy, onResolve, onBlockDomain, onConfirmClose }: ReviewActionsProps) {
  const host = hostOf(entry.longUrl)
  const owner = ownerLabel(entry)
  const anonymous = entry.ownerId == null
  const anchorRef = useRef<HTMLButtonElement>(null)
  const blockLinkRef = useRef<HTMLButtonElement>(null)
  const moreRef = useRef<HTMLButtonElement>(null)
  const [menuDialog, setMenuDialog] = useState<MenuDialog | null>(null)
  const preventWhileBusy = (event: React.SyntheticEvent) => {
    if (busy) event.preventDefault()
  }
  const preventMenuKeysWhileBusy = (event: React.KeyboardEvent) => {
    if (menuOpenKeys.has(event.key)) preventWhileBusy(event)
  }
  const confirm = (action: RowAction) => onResolve(entry, action, anchorRef.current)

  return (
    <div className="ml-auto flex w-max flex-col items-stretch gap-1 @min-[77rem]:flex-row @min-[77rem]:items-center">
      <Button
        ref={anchorRef}
        type="button"
        size="sm"
        variant="outline"
        data-remove-row
        onClick={() => { if (!busy) confirm("OK") }}
        aria-disabled={busy}
        className={rowButton}
      >
        Looks fine
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            ref={blockLinkRef}
            type="button"
            size="sm"
            variant="outline"
            onClick={preventWhileBusy}
            aria-disabled={busy}
            className={cn(rowButton, "text-destructive hover:text-destructive")}
          >
            Block link
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent onCloseAutoFocus={(event) => onConfirmClose(event, blockLinkRef.current)}>
          <AlertDialogHeader>
            <AlertDialogTitle>Block this link?</AlertDialogTitle>
            <AlertDialogDescription>
              {anonymous ? "The link stops working. It has no owner to email." : "Its owner is emailed and the link stops working."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm("BLOCK_LINK")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Block link</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={moreRef}
            type="button"
            size="sm"
            variant="outline"
            aria-disabled={busy}
            onPointerDown={preventWhileBusy}
            onKeyDown={preventMenuKeysWhileBusy}
            className={cn(rowButton, "gap-1")}
          >
            More
            <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem disabled={busy} onSelect={() => setMenuDialog("TRUST_DOMAIN")}>Trust domain</DropdownMenuItem>
          <DropdownMenuItem disabled={busy} onSelect={() => onBlockDomain(entry, moreRef.current)} className="text-destructive focus:text-destructive">
            Block domain
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={busy || anonymous}
            onSelect={() => setMenuDialog("BLOCK_USER")}
            className="flex-col items-start text-destructive focus:text-destructive"
          >
            Block user
            {anonymous && <span className="text-xs text-muted-foreground">No owner to block</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={menuDialog === "TRUST_DOMAIN"} onOpenChange={(open) => { if (!open) setMenuDialog(null) }}>
        <AlertDialogContent onCloseAutoFocus={(event) => onConfirmClose(event, moreRef.current)}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Trust {host ? <span className="break-all font-mono">{host}</span> : "this link's host"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This adds an allow rule for {host ? <span className="break-all font-mono">{host}</span> : "the host"} and its subdomains, marks every open entry for it as fine, and restores its links that a blocklist or the checks blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm("TRUST_DOMAIN")}>Trust domain</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={menuDialog === "BLOCK_USER"} onOpenChange={(open) => { if (!open) setMenuDialog(null) }}>
        <AlertDialogContent onCloseAutoFocus={(event) => onConfirmClose(event, moreRef.current)}>
          <AlertDialogHeader>
            <AlertDialogTitle>Block <span className="break-all">{owner}</span>?</AlertDialogTitle>
            <AlertDialogDescription>This deactivates the account and blocks all of its links.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm("BLOCK_USER")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Block user</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
