"use client"

import { Suspense, useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAllUrls, useDeactivateUrl, useActivateUrl, useDeleteUrl, useUpdateUrl } from "@/lib/hooks/useUrls"
import { useClampedPage, usePagination } from "@/lib/hooks/usePagination"
import { SEARCH_DELAY_MS } from "@/lib/hooks/useListSearch"
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue"
import { Pagination } from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { BlockDomainDialog } from "@/components/admin/block-domain-dialog"
import { BlockDomainsDialog } from "@/components/admin/block-domains-dialog"
import { UtmFields } from "@/components/utm-fields"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, Trash2, ToggleRight, ToggleLeft, Edit, TriangleAlert, GlobeLock, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import { cn, destinationLengthError, formatDateTime, plural, shortHostOf } from "@/lib/utils"
import { adminApi } from "@/lib/api-client"
import { analyticsHref, parseServerDateTime } from "@/lib/analytics"
import { blockReasonLabels } from "@/lib/labels"
import { CANT_TAKE_UTM, destinationToSend, hasUtm, readUtm, rememberUtm, tooLongMessage, tooLongWithUtm, withScheme, type UtmValues } from "@/lib/utm"
import { PageMeta } from "@/components/page-meta"
import { DestinationHealthBadge } from "@/components/notifications/destination-health-badge"
import { DateTimeLines } from "@/components/admin/date-time-lines"
import { SortHead, SortSelect, adminSelectClass, type SortOption } from "@/components/admin/sort-controls"
import { useRowRemovalFocus } from "@/lib/hooks/useRowRemovalFocus"
import type { UrlResponse, UrlFilters } from "@/lib/types"
import { shortHost } from "@/lib/domains"

const primaryHost = shortHostOf()
const emDash = String.fromCodePoint(0x2014)
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const shortLinkPrefix = new RegExp(`^(https?://)?(www\\.)?${escapeRegExp(primaryHost)}/`, "i")

const searchTerm = (input: string) => input.trim().replace(shortLinkPrefix, "")

const sortFields = ["createDate", "visits", "owner.email"]

const sortOptions: SortOption[] = [
  { field: "createDate", direction: "desc", label: "Newest first" },
  { field: "createDate", direction: "asc", label: "Oldest first" },
  { field: "visits", direction: "desc", label: "Most unique visitors" },
  { field: "visits", direction: "asc", label: "Fewest unique visitors" },
  { field: "owner.email", direction: "asc", label: "Owner, A to Z" },
  { field: "owner.email", direction: "desc", label: "Owner, Z to A" },
]

const endUrl = ({ longUrl, finalUrl }: UrlResponse) => {
  if (!finalUrl) return null
  try {
    return new URL(finalUrl).href === new URL(longUrl).href ? null : finalUrl
  } catch {
    return finalUrl === longUrl ? null : finalUrl
  }
}

const SEARCH_PARAM = "search"

function useAddressSearch() {
  const address = useSearchParams().get(SEARCH_PARAM) ?? ""
  const [search, setSearch] = useState(address)
  const [written, setWritten] = useState(address)
  const [seen, setSeen] = useState(address)

  if (address !== seen) {
    setSeen(address)
    if (address !== written) {
      setWritten(address)
      setSearch(address)
    }
  }

  const update = (next: string) => {
    setSearch(next)
    setWritten(next.trim() ? next : "")
    const params = new URLSearchParams(window.location.search)
    if (next.trim()) params.set(SEARCH_PARAM, next)
    else params.delete(SEARCH_PARAM)
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`)
  }

  return [search, update] as const
}

const DEAD_DESTINATION_PARAM = "deadDestination"

function useAddressDeadDestination() {
  const address = useSearchParams().get(DEAD_DESTINATION_PARAM) === "true"
  const [deadOnly, setDeadOnly] = useState(address)
  const [seen, setSeen] = useState(address)

  if (address !== seen) {
    setSeen(address)
    setDeadOnly(address)
  }

  const update = (next: boolean) => {
    setDeadOnly(next)
    const params = new URLSearchParams(window.location.search)
    if (next) params.set(DEAD_DESTINATION_PARAM, "true")
    else params.delete(DEAD_DESTINATION_PARAM)
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`)
  }

  return [deadOnly, update] as const
}

function AdminUrlsLoading() {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-5">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

export default function AdminUrlsPage() {
  return (
    <Suspense fallback={<AdminUrlsLoading />}>
      <AdminUrls />
    </Suspense>
  )
}

function AdminUrls() {
  const { page, size, sort, order, setPage, setSize, toggleSort, setSortOrder, sortDir } = usePagination("createDate", "desc", sortFields)
  const [searchInput, setSearch] = useAddressSearch()
  const search = useDebouncedValue(searchInput, SEARCH_DELAY_MS)
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [expiredFilter, setExpiredFilter] = useState(false)
  const [anonymousFilter, setAnonymousFilter] = useState(false)
  const [deadFilter, setDeadFilter] = useAddressDeadDestination()
  useEffect(() => { setPage(0) }, [search, activeFilter, expiredFilter, anonymousFilter, deadFilter, setPage])
  const filterKey = `${search}-${activeFilter}-${expiredFilter}-${anonymousFilter}-${deadFilter}`
  const filters: UrlFilters = {
    search: searchTerm(search) || undefined,
    active: activeFilter === "all" ? undefined : activeFilter === "active",
    expired: expiredFilter || undefined,
    anonymous: anonymousFilter || undefined,
    deadDestination: deadFilter || undefined,
  }
  const { data: urls, isLoading, error } = useAllUrls(filters, page, size, sort, order)
  const { data: deadCount } = useAllUrls({ deadDestination: true }, 0, 1)
  useClampedPage(page, urls?.totalPages, setPage)
  const deactivateUrl = useDeactivateUrl()
  const activateUrl = useActivateUrl()
  const deleteUrl = useDeleteUrl()
  const updateUrl = useUpdateUrl()
  const [editUrl, setEditUrl] = useState<UrlResponse | null>(null)
  const [editLongUrl, setEditLongUrl] = useState("")
  const [editVisitLimit, setEditVisitLimit] = useState("")
  const [editExpiration, setEditExpiration] = useState("")
  const [editTags, setEditTags] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [removePassword, setRemovePassword] = useState(false)
  const [editUtm, setEditUtm] = useState<UtmValues>({})
  const [editUtmOpen, setEditUtmOpen] = useState(false)
  const editLongUrlError = destinationLengthError(editLongUrl.trim())
  const editId = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const removeTriggerRef = useRef<HTMLElement | null>(null)
  const removalFocus = useRowRemovalFocus(searchRef)
  const filtered = !!search.trim() || activeFilter !== "all" || expiredFilter || anonymousFilter || deadFilter
  const [blockTarget, setBlockTarget] = useState<UrlResponse | null>(null)
  const [blockOpen, setBlockOpen] = useState(false)
  const [blockDomainsIds, setBlockDomainsIds] = useState<number[]>([])
  const [blockDomainsOpen, setBlockDomainsOpen] = useState(false)
  const selectionKey = `${page}-${size}-${sort}-${order}-${filterKey}`
  const [selection, setSelection] = useState<{ key: string; ids: Set<number> }>({ key: selectionKey, ids: new Set() })
  const selectedIds = selection.key === selectionKey ? selection.ids : new Set<number>()
  const setSelectedIds = (update: Set<number> | ((prev: Set<number>) => Set<number>)) =>
    setSelection((prev) => {
      const current = prev.key === selectionKey ? prev.ids : new Set<number>()
      return { key: selectionKey, ids: typeof update === "function" ? update(current) : update }
    })

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (urls?.content?.length && urls.content.every((u) => selectedIds.has(u.id))) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(urls?.content?.map((u) => u.id) ?? []))
    }
  }

  const batchAction = async (action: "activate" | "deactivate" | "delete") => {
    const fn = action === "activate" ? activateUrl.mutateAsync : action === "deactivate" ? deactivateUrl.mutateAsync : deleteUrl.mutateAsync
    const label = action === "activate" ? "Activated" : action === "deactivate" ? "Deactivated" : "Deleted"
    const results = await Promise.allSettled([...selectedIds].map((id) => fn(id)))
    const succeeded = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length
    if (succeeded > 0) toast.success(`${label} ${succeeded} URL${succeeded > 1 ? "s" : ""}`)
    if (failed > 0) toast.error(`Failed to ${action} ${failed} URL${failed > 1 ? "s" : ""}`)
    setSelectedIds(new Set())
    if (action === "delete") removalFocus.restore()
  }

  const allSelected = !!urls?.content?.length && urls.content.every((u) => selectedIds.has(u.id))

  const handleDeactivate = async (id: number) => {
    try {
      await deactivateUrl.mutateAsync(id)
      toast.success("URL deactivated")
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to deactivate")
    }
  }

  const handleActivate = async (id: number) => {
    try {
      await activateUrl.mutateAsync(id)
      toast.success("URL activated")
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to activate")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteUrl.mutateAsync(id)
      toast.success("URL deleted permanently")
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to delete")
    }
  }

  const openBlockDomain = (url: UrlResponse) => {
    setBlockTarget(url)
    setBlockOpen(true)
  }

  const openBlockDomains = () => {
    setBlockDomainsIds([...selectedIds])
    setBlockDomainsOpen(true)
  }

  const handleEditOpen = (url: UrlResponse) => {
    setEditUrl(url)
    setEditLongUrl(url.longUrl)
    setEditVisitLimit(url.visitLimit?.toString() || "")
    setEditExpiration(url.expirationDate ? url.expirationDate.slice(0, 16) : "")
    setEditTags(url.tags?.join(", ") || "")
    setEditPassword("")
    setRemovePassword(false)
    setEditUtm(readUtm(withScheme(url.longUrl)))
    setEditUtmOpen(hasUtm(withScheme(url.longUrl)))
  }

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUrl) return
    const typed = editLongUrl.trim()
    if (!typed) {
      toast.error("Destination URL is required")
      return
    }
    if (editLongUrlError) return
    const longUrl = destinationToSend(typed, editUtmOpen, editUtm)
    if (longUrl === null) {
      toast.error(`${CANT_TAKE_UTM} Collapse Campaign tracking (UTM) to save it as typed.`)
      return
    }
    if (tooLongWithUtm(typed, longUrl)) {
      toast.error(tooLongMessage("destination"))
      return
    }
    const destinationChanged = longUrl !== editUrl.longUrl
    try {
      await updateUrl.mutateAsync({
        id: editUrl.id,
        data: {
          id: editUrl.id,
          longUrl: destinationChanged ? longUrl : undefined,
          visitLimit: editVisitLimit ? parseInt(editVisitLimit) : 0,
          expirationDate: editExpiration ? new Date(editExpiration).toISOString() : undefined,
          tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
          password: removePassword ? "" : (editPassword || undefined),
        },
      })
      if (editUtmOpen && destinationChanged) rememberUtm(editUtm)
      toast.success("URL updated")
      setEditUrl(null)
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to update URL")
    }
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Admin — All URLs" description="View all shortened URLs in the hrva.cc system." />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">All URLs</h1>
          <p className="mt-1 text-sm text-muted-foreground">View all shortened URLs in the system. Unique visitors are counted per link per day and added up.</p>
        </div>
        <Button
          onClick={() => adminApi.exportUrlsCsv()}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search link, destination or owner..."
            aria-label="Search by short link, destination or owner email"
            value={searchInput}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          aria-label="Filter by status"
          className={adminSelectClass}
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
        </select>
        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={expiredFilter}
            onChange={(e) => setExpiredFilter(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-brand"
          />
          Expired only
        </label>
        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={anonymousFilter}
            onChange={(e) => setAnonymousFilter(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-brand"
          />
          Anonymous only
        </label>
        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={deadFilter}
            onChange={(e) => setDeadFilter(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-brand"
          />
          {deadCount?.totalElements != null ? `Dead destinations only (${deadCount.totalElements.toLocaleString()})` : "Dead destinations only"}
        </label>
        <SortSelect options={sortOptions} sort={sort} order={order} onChange={setSortOrder} className="@min-[57rem]:hidden" />
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 px-4 py-2.5">
          <span className="mr-1 text-sm font-medium tabular-nums">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" className="h-8" onClick={() => batchAction("activate")}>
            Activate
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => batchAction("deactivate")}>
            Deactivate
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={openBlockDomains}>
            <GlobeLock aria-hidden="true" className="h-3.5 w-3.5" />
            Block domains
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" className="h-8">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent onCloseAutoFocus={removalFocus.onCloseAutoFocus}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selectedIds.size} URL{selectedIds.size > 1 ? "s" : ""}?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the selected URLs.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { removalFocus.capture(null); batchAction("delete") }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {isLoading ? (
        <AdminUrlsLoading />
      ) : error ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load URLs</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : !urls || !urls.content || urls.content.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          {filtered ? (
            <>
              <p className="font-semibold">No URLs found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a different search or filter.</p>
            </>
          ) : (
            <p className="font-semibold">No links yet.</p>
          )}
        </div>
      ) : (
        <div key={filterKey} className="overflow-hidden rounded-xl border bg-card">
          <Table className="[&_td]:px-3 [&_th]:px-3">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={selectAll}
                    aria-label="Select all URLs on this page"
                    className="h-4 w-4 rounded border-input accent-brand"
                  />
                </TableHead>
                <TableHead>Short URL</TableHead>
                <TableHead className="hidden @min-[78.25rem]:table-cell">Long URL</TableHead>
                <SortHead field="owner.email" label="Owner" sortDir={sortDir} toggleSort={toggleSort} className="hidden @min-[57rem]:table-cell" />
                <SortHead field="visits" label="Unique visitors" sortDir={sortDir} toggleSort={toggleSort} className="hidden @2xl:table-cell" />
                <SortHead field="createDate" label="Created" sortDir={sortDir} toggleSort={toggleSort} className="hidden @min-[57rem]:table-cell" />
                <TableHead className="hidden @2xl:table-cell">Status</TableHead>
                <TableHead className="sticky right-0 bg-card bg-[linear-gradient(hsl(var(--muted)/0.5),hsl(var(--muted)/0.5))] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {urls.content.map((url: UrlResponse) => (
                <TableRow key={url.id} className="group" data-state={selectedIds.has(url.id) ? "selected" : undefined}>
                  <TableCell className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(url.id)}
                      onChange={() => toggleSelect(url.id)}
                      aria-label={`Select ${shortHost(url.domain, primaryHost)}/${url.shortUrl}`}
                      className="h-4 w-4 rounded border-input accent-brand"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="block min-w-28 font-mono text-[13px] font-medium text-brand [overflow-wrap:anywhere]">
                      <span className="font-normal text-muted-foreground">{shortHost(url.domain, primaryHost)}/</span>{url.shortUrl}
                    </span>
                    <div className="mt-1 min-w-40 space-y-0.5 text-xs text-muted-foreground @lg:min-w-56 @min-[78.25rem]:hidden">
                      <Destination url={url} />
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 @min-[57rem]:hidden">
                        <span className="[overflow-wrap:anywhere]">{url.ownerEmail ?? "Anonymous"}</span>
                        {url.ownerPossibleScammer && <Badge variant="warning">Possible scammer</Badge>}
                      </div>
                      <p className="tabular-nums @min-[57rem]:hidden">Created {url.createDate ? formatDateTime(parseServerDateTime(url.createDate)) : "—"}</p>
                      <p className="tabular-nums @2xl:hidden">{visitorsText(url)}</p>
                      <div className="pt-0.5 @2xl:hidden">
                        <UrlStatus url={url} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground @min-[78.25rem]:table-cell">
                    <Destination url={url} className="min-w-[27rem]" />
                  </TableCell>
                  <TableCell className="hidden @min-[57rem]:table-cell">
                    <span className={cn("block min-w-28 [overflow-wrap:anywhere]", !url.ownerEmail && "text-muted-foreground")}>{url.ownerEmail ?? "Anonymous"}</span>
                    {url.ownerPossibleScammer && <Badge variant="warning" className="mt-1 whitespace-nowrap">Possible scammer</Badge>}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap tabular-nums @2xl:table-cell">{url.visits.toLocaleString()}{url.visitLimit > 0 ? ` / ${url.visitLimit.toLocaleString()}` : ""}</TableCell>
                  <TableCell className="hidden tabular-nums text-muted-foreground @min-[57rem]:table-cell">
                    {url.createDate ? <DateTimeLines value={url.createDate} /> : "—"}
                  </TableCell>
                  <TableCell className="hidden @2xl:table-cell">
                    <UrlStatus url={url} />
                  </TableCell>
                  <TableCell className="sticky right-0 bg-card text-right transition-colors group-hover:bg-[linear-gradient(hsl(var(--muted)/0.4),hsl(var(--muted)/0.4))] group-data-[state=selected]:bg-brand-soft">
                    <div className="ml-auto flex w-21 flex-wrap items-center justify-end gap-0.5 @lg:w-max @lg:flex-nowrap">
                      {url.active ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleDeactivate(url.id)}
                              disabled={deactivateUrl.isPending}
                              aria-label="Deactivate"
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            >
                              <ToggleRight className="h-3.5 w-3.5 text-success" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Deactivate</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleActivate(url.id)}
                              disabled={activateUrl.isPending}
                              aria-label="Activate"
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            >
                              <ToggleLeft className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Activate</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={analyticsHref({ link: url.id })}
                            aria-label="View stats"
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="top">View stats</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleEditOpen(url)}
                            aria-label="Edit URL"
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Edit URL</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => openBlockDomain(url)}
                            aria-label="Block domain"
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                          >
                            <GlobeLock className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Block domain</TooltipContent>
                      </Tooltip>
                      <AlertDialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <button
                                data-remove-row
                                aria-label="Delete"
                                onClick={(event) => { removeTriggerRef.current = event.currentTarget }}
                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="top">Delete</TooltipContent>
                        </Tooltip>
                        <AlertDialogContent onCloseAutoFocus={removalFocus.onCloseAutoFocus}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete URL?</AlertDialogTitle>
                            <AlertDialogDescription className="[overflow-wrap:anywhere]">This will permanently delete {shortHost(url.domain, primaryHost)}/{url.shortUrl}.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => { removalFocus.capture(removeTriggerRef.current); handleDelete(url.id) }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            totalPages={urls?.totalPages ?? 0}
            totalElements={urls?.totalElements}
            size={size}
            onPageChange={setPage}
            onSizeChange={setSize}
          />
        </div>
      )}

      <BlockDomainDialog
        longUrl={blockTarget?.longUrl ?? ""}
        open={blockOpen}
        onOpenChange={setBlockOpen}
        onBlocked={() => undefined}
      />

      <BlockDomainsDialog
        urlIds={blockDomainsIds}
        open={blockDomainsOpen}
        onOpenChange={setBlockDomainsOpen}
        onBlocked={() => {
          removalFocus.setTarget(null)
          setSelectedIds(new Set())
        }}
        onCloseAutoFocus={removalFocus.onCloseAutoFocus}
      />

      <Dialog open={!!editUrl} onOpenChange={(open) => { if (!open) setEditUrl(null) }}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="[overflow-wrap:anywhere]">Edit URL {emDash} {shortHost(editUrl?.domain, primaryHost)}/{editUrl?.shortUrl}</DialogTitle>
          </DialogHeader>
          {editUrl && (
            <form onSubmit={handleEditSave} noValidate className="space-y-4">
              <div>
                <label htmlFor={`${editId}-long-url`} className="text-sm font-medium">Destination URL</label>
                <Input
                  id={`${editId}-long-url`}
                  type="url"
                  inputMode="url"
                  spellCheck={false}
                  placeholder="https://example.com/page"
                  value={editLongUrl}
                  onChange={(e) => setEditLongUrl(e.target.value)}
                  aria-invalid={!!editLongUrlError}
                  aria-describedby={editLongUrlError ? `${editId}-long-url-error` : undefined}
                  className="mt-2"
                />
                {editLongUrlError && <p id={`${editId}-long-url-error`} className="mt-2 text-sm text-destructive">{editLongUrlError}</p>}
              </div>
              <UtmFields destination={editLongUrl} value={editUtm} onChange={setEditUtm} open={editUtmOpen} onOpenChange={setEditUtmOpen} variant="admin" />
              <div>
                <label htmlFor={`${editId}-visit-limit`} className="text-sm font-medium">Visit limit</label>
                <Input
                  id={`${editId}-visit-limit`}
                  type="number"
                  placeholder="e.g. 100 (0 = unlimited)"
                  value={editVisitLimit}
                  onChange={(e) => setEditVisitLimit(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <label htmlFor={`${editId}-expiration`} className="text-sm font-medium">Expiry date</label>
                <Input
                  id={`${editId}-expiration`}
                  type="datetime-local"
                  value={editExpiration}
                  onChange={(e) => setEditExpiration(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <label htmlFor={`${editId}-tags`} className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  id={`${editId}-tags`}
                  placeholder="work, personal"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <label htmlFor={`${editId}-password`} className="text-sm font-medium">
                  Password {editUrl?.passwordProtected && <span className="font-normal text-muted-foreground">(currently set)</span>}
                </label>
                <Input
                  id={`${editId}-password`}
                  type="password"
                  placeholder={editUrl?.passwordProtected ? "Enter new password to replace" : "Set a password"}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  disabled={removePassword}
                  autoComplete="new-password"
                  className="mt-2"
                />
                {editUrl?.passwordProtected && (
                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" checked={removePassword} onChange={(e) => setRemovePassword(e.target.checked)} className="h-4 w-4 accent-brand" />
                    Remove password protection
                  </label>
                )}
              </div>
              <Button type="submit" disabled={updateUrl.isPending} className="w-full">
                {updateUrl.isPending ? "Saving..." : "Save changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Destination({ url, className }: { url: UrlResponse; className?: string }) {
  const endsAt = endUrl(url)
  return (
    <div className={cn("[overflow-wrap:anywhere]", className)}>
      <span className="block">{url.longUrl}</span>
      {endsAt && <span className="mt-1 block text-xs">Ends at {endsAt}</span>}
      <DestinationHealthBadge health={url.destinationHealth} active={url.status ? url.status === "ACTIVE" : url.active} />
    </div>
  )
}

const visitorsText = (url: UrlResponse) =>
  `${plural(url.visits, "unique visitor")}${url.visitLimit > 0 ? ` of a ${url.visitLimit.toLocaleString()} limit` : ""}`

function UrlStatus({ url }: { url: UrlResponse }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge status={url.status} active={url.active} />
        {url.reviewOpen && (
          <Link
            href={`/admin/review?entry=${url.id}`}
            className={cn(badgeVariants({ variant: "warning" }), "whitespace-nowrap underline-offset-2 hover:underline")}
          >
            In review
          </Link>
        )}
      </div>
      {url.status === "BLOCKED" && url.blockReason && (
        <p className="mt-1 min-w-24 text-xs text-muted-foreground">{blockReasonLabels[url.blockReason] ?? url.blockReason}</p>
      )}
      {url.suspiciousReasons && url.suspiciousReasons.length > 0 && (
        <p className="mt-1 flex min-w-24 items-start gap-1 text-xs text-warning">
          <TriangleAlert aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
          <span className="[overflow-wrap:anywhere]">Suspicious: {url.suspiciousReasons.join(" · ")}</span>
        </p>
      )}
    </>
  )
}
