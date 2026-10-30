"use client"

import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react"
import { useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { applicationFilters } from "@/components/admin/domains/applications-section"
import { DisableDomainDialog } from "@/components/admin/domains/disable-domain-dialog"
import { AdminRemoveDomainDialog } from "@/components/admin/domains/remove-domain-dialog"
import { errorText } from "@/components/admin/domains/review-domain-dialog"
import { DateTimeLines } from "@/components/admin/date-time-lines"
import { adminSelectClass } from "@/components/admin/sort-controls"
import { DomainStatusBadge } from "@/components/domains/domain-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { parseServerDateTime } from "@/lib/analytics"
import {
  DOMAIN_STATUSES,
  DOMAIN_STATUS_LABELS,
  adminRecheckHint,
  canAdminRetry,
  canRemoveDomain,
  canTurnOff,
  domainRemovalSummary,
  isDomainStatus,
} from "@/lib/domains"
import { useAdminDomains, useAdminRemoveDomain, useDisableDomain, useEnableDomain, useRetryDomain } from "@/lib/hooks/useDomains"
import { useFocusAfterRetry } from "@/lib/hooks/useFocusAfterRetry"
import { useClampedPage, usePagination } from "@/lib/hooks/usePagination"
import type { AdminDomain, AdminDomainFilters, CustomDomainStatus, DomainLinkMode } from "@/lib/types"
import { cn, formatDateTime, plural } from "@/lib/utils"

const SEARCH_PARAM = "search"

const STATUS_PARAM = "status"

const SEARCH_DELAY_MS = 300

const NOT_ON_PAGE = "This domain isn't on this page. Search for its name to find it."

const DASH = String.fromCodePoint(0x2014)

const rowButton = "h-8 px-2.5 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"

const writeParam = (name: string, value: string | null) => {
  const params = new URLSearchParams(window.location.search)
  if (value) params.set(name, value)
  else params.delete(name)
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}${window.location.hash}`)
}

const serverDateTime = (value: string) => formatDateTime(parseServerDateTime(value))

const approvedAt = (domain: AdminDomain) => (domain.status === "REJECTED" ? null : domain.reviewedAt)

const focusIsLost = () => {
  const active = document.activeElement
  return !active || active === document.body || !active.isConnected
}

type DialogKind = "disable" | "remove"

interface OpenDialog {
  kind: DialogKind
  domain: AdminDomain
  trigger: HTMLElement | null
  neighbour: HTMLElement | null
}

interface DomainsTableProps {
  highlightId: number | null
  headingRef: RefObject<HTMLElement | null>
}

export function DomainsTable({ highlightId, headingRef }: DomainsTableProps) {
  const searchParams = useSearchParams()
  const { page, size, setPage, setSize } = usePagination()
  const [searchInput, setSearchInput] = useState(() => searchParams.get(SEARCH_PARAM) ?? "")
  const [search, setSearch] = useState(() => (searchParams.get(SEARCH_PARAM) ?? "").trim())
  const [status, setStatus] = useState<CustomDomainStatus | "">(() => {
    const value = searchParams.get(STATUS_PARAM)
    return isDomainStatus(value) ? value : ""
  })
  const [linkedWithSearch] = useState(() => (searchParams.has(SEARCH_PARAM) ? highlightId : null))
  const [lookedUpId, setLookedUpId] = useState<number | null>(null)
  const filters: AdminDomainFilters = { status: status || undefined, search: search || undefined, page, size }
  const { data, isLoading, error, refetch, isFetching } = useAdminDomains(filters)
  const applications = useAdminDomains(applicationFilters(0))
  useClampedPage(page, data?.totalPages, setPage)
  const domains = data?.content ?? []
  const filtered = !!search || !!status
  const disable = useDisableDomain()
  const enable = useEnableDomain()
  const retryDomain = useRetryDomain()
  const remove = useAdminRemoveDomain()
  const [busyIds, setBusyIds] = useState<ReadonlySet<number>>(() => new Set())
  const busyRef = useRef<Set<number>>(new Set())
  const [dialog, setDialog] = useState<OpenDialog | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [removeBusy, setRemoveBusy] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const highlightedRef = useRef<HTMLTableRowElement>(null)
  const scrolledTo = useRef<number | null>(null)
  const retryLoad = useFocusAfterRetry(headingRef, !!data && !error)
  const inTable = highlightId !== null && domains.some((domain) => domain.id === highlightId)
  const inApplications = highlightId !== null && (applications.data?.content ?? []).some((domain) => domain.id === highlightId)
  const lookupReady = highlightId !== null && !!data && !error && !isFetching && !applications.isPending
  if (lookupReady && lookedUpId !== highlightId) {
    setLookedUpId(highlightId)
    if (!inTable && !inApplications && filtered && linkedWithSearch !== highlightId) {
      setStatus("")
      setSearch("")
      setSearchInput("")
      setPage(0)
    }
  }
  const notOnPage = lookupReady && lookedUpId === highlightId && !inTable && !inApplications

  useEffect(() => {
    writeParam(STATUS_PARAM, status || null)
    writeParam(SEARCH_PARAM, search || null)
  }, [status, search])

  useEffect(() => {
    const next = searchInput.trim()
    if (next === search) return
    const timer = window.setTimeout(() => {
      setSearch(next)
      setPage(0)
    }, SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput, search, setPage])

  useEffect(() => {
    if (!inTable || inApplications || applications.isPending || scrolledTo.current === highlightId) return
    scrolledTo.current = highlightId
    highlightedRef.current?.scrollIntoView({ block: "center" })
  }, [inTable, inApplications, applications.isPending, highlightId])

  const applySearch = (value: string) => {
    const next = value.trim()
    if (next === search) return
    setSearch(next)
    setPage(0)
  }

  const changeStatus = (value: string) => {
    const next = isDomainStatus(value) ? value : ""
    setStatus(next)
    setPage(0)
  }

  const rowOf = (domainId: number) => tableRef.current?.querySelector<HTMLElement>(`[data-domain-row="${domainId}"]`) ?? null

  const neighbourOf = (trigger: HTMLElement | null): HTMLElement | null => {
    const row = trigger?.closest("tr")
    if (!row) return null
    const rows = Array.from(tableRef.current?.querySelectorAll<HTMLElement>("tbody tr") ?? [])
    const index = rows.indexOf(row)
    for (const candidate of [rows[index + 1], rows[index - 1]]) {
      const action = candidate?.querySelector<HTMLElement>("[data-row-action]")
      if (action) return action
    }
    return null
  }

  const focusTarget = (domainId: number, preferred: HTMLElement | null, neighbour: HTMLElement | null): HTMLElement | null =>
    (preferred?.isConnected ? preferred : null) ??
    rowOf(domainId)?.querySelector<HTMLElement>("[data-row-action]") ??
    (neighbour?.isConnected ? neighbour : null) ??
    tableRef.current?.querySelector<HTMLElement>("[data-row-action]") ??
    searchRef.current

  const setBusy = (domainId: number, busy: boolean) => {
    if (busy) busyRef.current.add(domainId)
    else busyRef.current.delete(domainId)
    setBusyIds(new Set(busyRef.current))
  }

  const runDirect = async (domain: AdminDomain, trigger: HTMLElement, action: () => Promise<unknown>, success: string) => {
    if (busyRef.current.has(domain.id)) return
    const neighbour = neighbourOf(trigger)
    setBusy(domain.id, true)
    try {
      await action()
      toast.success(success)
    } catch (actionError) {
      toast.error(errorText(actionError))
    } finally {
      setBusy(domain.id, false)
    }
    window.requestAnimationFrame(() => {
      if (document.activeElement?.closest("[role=dialog], [role=alertdialog]")) return
      if (focusIsLost()) focusTarget(domain.id, trigger, neighbour)?.focus()
    })
  }

  const openDialog = (kind: DialogKind, domain: AdminDomain, trigger: HTMLElement) => {
    if (busyRef.current.has(domain.id)) return
    setDialog({ kind, domain, trigger, neighbour: neighbourOf(trigger) })
    setDialogOpen(true)
  }

  const closeAutoFocus = (event: Event) => {
    event.preventDefault()
    if (!dialog) return
    focusTarget(dialog.domain.id, dialog.trigger, dialog.neighbour)?.focus()
  }

  const confirmDisable = async (note: string) => {
    if (!dialog) return
    const { domain } = dialog
    await disable.mutateAsync({ id: domain.id, note })
    toast.success(`Turned ${domain.hostname} off`)
    setDialogOpen(false)
  }

  const confirmRemove = async (links: DomainLinkMode) => {
    if (!dialog || removeBusy) return
    const { domain } = dialog
    setRemoveBusy(true)
    try {
      const result = await remove.mutateAsync({ id: domain.id, links })
      const summary = domainRemovalSummary(result)
      toast.success(`Removed ${domain.hostname}`, summary ? { description: summary } : undefined)
      setDialogOpen(false)
    } catch (removeError) {
      toast.error(errorText(removeError))
    } finally {
      setRemoveBusy(false)
    }
  }

  return (
    <div className="space-y-4">
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
            ref={searchRef}
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by domain or owner email"
            aria-label="Search by domain or owner email"
            className="h-9 pl-9"
          />
        </form>
        <select value={status} onChange={(event) => changeStatus(event.target.value)} aria-label="Filter by status" className={adminSelectClass}>
          <option value="">All</option>
          {DOMAIN_STATUSES.map((value) => (
            <option key={value} value={value}>
              {DOMAIN_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      {notOnPage && (
        <p role="status" className="text-sm text-muted-foreground">
          {NOT_ON_PAGE}
        </p>
      )}

      {isLoading ? (
        <DomainsLoading />
      ) : error && !data ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p role="alert" className="text-sm font-medium text-destructive">Failed to load domains</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 aria-disabled:opacity-50"
            onClick={() => { if (!isFetching) retryLoad(refetch) }}
            aria-disabled={isFetching}
          >
            Retry
          </Button>
        </div>
      ) : domains.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="font-semibold">{filtered ? "No domains match." : "No custom domains yet."}</p>
          {!filtered && <p className="mt-1 text-sm text-muted-foreground">Applications show up here once someone applies in Settings.</p>}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table ref={tableRef}>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead className="hidden @min-[50rem]:table-cell">Owner</TableHead>
                <TableHead className="hidden @min-[60rem]:table-cell">Created</TableHead>
                <TableHead className="hidden @min-[60rem]:table-cell">Approved</TableHead>
                <TableHead className="hidden text-right @min-[40rem]:table-cell">Links</TableHead>
                <TableHead className="hidden text-right @min-[40rem]:table-cell">Clicks</TableHead>
                <TableHead className="sticky right-0 bg-card bg-[linear-gradient(hsl(var(--muted)/0.5),hsl(var(--muted)/0.5))] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.map((domain) => {
                const highlighted = domain.id === highlightId
                const busy = busyIds.has(domain.id)
                const approved = approvedAt(domain)
                return (
                  <TableRow
                    key={domain.id}
                    ref={highlighted ? highlightedRef : undefined}
                    data-domain-row={domain.id}
                    aria-current={highlighted ? "true" : undefined}
                    className="group"
                  >
                    <TableCell className={cn("align-top", highlighted && "shadow-[inset_3px_0_0_hsl(var(--brand))]")}>
                      <div className="min-w-40 space-y-1.5 @lg:min-w-56">
                        <p className="font-mono text-[13px] font-medium [overflow-wrap:anywhere]">{domain.hostname}</p>
                        <DomainStatusBadge status={domain.status} />
                        <DomainNotes domain={domain} />
                        <div className="space-y-0.5 text-xs text-muted-foreground @min-[60rem]:hidden">
                          <div className="@min-[50rem]:hidden">
                            <OwnerCell domain={domain} />
                          </div>
                          <p className="tabular-nums">Created {serverDateTime(domain.createdAt)}</p>
                          {approved && <p className="tabular-nums">Approved {serverDateTime(approved)}</p>}
                          <p className="tabular-nums @min-[40rem]:hidden">
                            {plural(domain.links, "link")}, {plural(domain.clicks, "click")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden align-top @min-[50rem]:table-cell">
                      <div className="min-w-40 max-w-64">
                        <OwnerCell domain={domain} />
                      </div>
                    </TableCell>
                    <TableCell className="hidden align-top tabular-nums text-muted-foreground @min-[60rem]:table-cell">
                      <DateTimeLines value={domain.createdAt} />
                    </TableCell>
                    <TableCell className="hidden align-top tabular-nums text-muted-foreground @min-[60rem]:table-cell">
                      {approved ? <DateTimeLines value={approved} /> : DASH}
                    </TableCell>
                    <TableCell className="hidden text-right align-top tabular-nums @min-[40rem]:table-cell">{domain.links.toLocaleString()}</TableCell>
                    <TableCell className="hidden text-right align-top tabular-nums @min-[40rem]:table-cell">{domain.clicks.toLocaleString()}</TableCell>
                    <TableCell
                      className={cn(
                        "sticky right-0 bg-card text-right align-top transition-colors",
                        "group-hover:bg-[linear-gradient(hsl(var(--muted)/0.4),hsl(var(--muted)/0.4))]",
                      )}
                    >
                      <RowActions
                        domain={domain}
                        busy={busy}
                        onDisable={(trigger) => openDialog("disable", domain, trigger)}
                        onEnable={(trigger) => runDirect(domain, trigger, () => enable.mutateAsync(domain.id), `Turned ${domain.hostname} on`)}
                        onRetry={(trigger) => runDirect(domain, trigger, () => retryDomain.mutateAsync(domain.id), `Retrying ${domain.hostname}`)}
                        onRemove={(trigger) => openDialog("remove", domain, trigger)}
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

      <DisableDomainDialog
        hostname={dialog?.kind === "disable" ? dialog.domain.hostname : null}
        open={dialogOpen && dialog?.kind === "disable"}
        onOpenChange={(open) => { if (!open) setDialogOpen(false) }}
        onConfirm={confirmDisable}
        onCloseAutoFocus={closeAutoFocus}
      />
      <AdminRemoveDomainDialog
        domain={dialogOpen && dialog?.kind === "remove" ? dialog.domain : null}
        busy={removeBusy}
        onOpenChange={(open) => { if (!open) setDialogOpen(false) }}
        onConfirm={confirmRemove}
        onCloseAutoFocus={closeAutoFocus}
      />
    </div>
  )
}

export function DomainsLoading() {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-5">
      {[...Array(5)].map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  )
}

function OwnerCell({ domain }: { domain: AdminDomain }) {
  if (!domain.owner) return <p className="text-muted-foreground">Account deleted</p>
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="min-w-0 [overflow-wrap:anywhere]">{domain.owner.email}</span>
      {!domain.owner.active && <Badge variant="destructive" className="whitespace-nowrap dark:bg-destructive/5">Deactivated</Badge>}
    </div>
  )
}

function DomainNotes({ domain }: { domain: AdminDomain }) {
  const problemText = domain.problem ? domain.problemText : null
  const recheck = adminRecheckHint(domain)
  const disabledNote = domain.status === "DISABLED" ? domain.disabledNote : null
  const notePrefix = domain.disabledReason === "ADMIN" ? "Turned off: " : ""
  if (!problemText && !domain.lastError && !recheck && !disabledNote) return null
  return (
    <div className="max-w-md space-y-0.5 text-xs">
      {disabledNote && <p className="[overflow-wrap:anywhere]">{notePrefix}{disabledNote}</p>}
      {problemText && <p className="text-destructive [overflow-wrap:anywhere]">{problemText}</p>}
      {domain.lastError && <p className="text-muted-foreground [overflow-wrap:anywhere]">Cloudflare said: {domain.lastError}</p>}
      {recheck && <p className="text-muted-foreground">{recheck}</p>}
    </div>
  )
}

interface RowActionsProps {
  domain: AdminDomain
  busy: boolean
  onDisable(trigger: HTMLElement): void
  onEnable(trigger: HTMLElement): void
  onRetry(trigger: HTMLElement): void
  onRemove(trigger: HTMLElement): void
}

function RowActions({ domain, busy, onDisable, onEnable, onRetry, onRemove }: RowActionsProps) {
  const { status, hostname } = domain
  const toggle = canTurnOff(status) || status === "DISABLED"
  if (status === "PENDING_REVIEW") {
    return (
      <a href={`#domain-application-${domain.id}`} data-row-action="review" className="text-sm whitespace-nowrap text-brand-link">
        Review
        <span className="sr-only"> {hostname}</span>
      </a>
    )
  }
  if (!toggle && !canAdminRetry(domain) && !canRemoveDomain(status)) return <span className="text-muted-foreground">{DASH}</span>
  return (
    <div className="ml-auto flex w-max flex-col items-stretch gap-1">
      {toggle && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-row-action="toggle"
          aria-disabled={busy}
          aria-busy={busy}
          onClick={(event) => {
            if (busy) return
            if (status === "DISABLED") onEnable(event.currentTarget)
            else onDisable(event.currentTarget)
          }}
          className={cn(rowButton, status !== "DISABLED" && "text-destructive hover:text-destructive")}
        >
          {status === "DISABLED" ? "Turn on" : "Turn off"}
          <span className="sr-only"> {hostname}</span>
        </Button>
      )}
      {canAdminRetry(domain) && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-row-action="retry"
          aria-disabled={busy}
          aria-busy={busy}
          onClick={(event) => { if (!busy) onRetry(event.currentTarget) }}
          className={rowButton}
        >
          Retry
          <span className="sr-only"> {hostname}</span>
        </Button>
      )}
      {canRemoveDomain(status) && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-row-action="remove"
          aria-disabled={busy}
          onClick={(event) => { if (!busy) onRemove(event.currentTarget) }}
          className={cn(rowButton, "text-destructive hover:text-destructive")}
        >
          Remove
          <span className="sr-only"> {hostname}</span>
        </Button>
      )}
    </div>
  )
}
