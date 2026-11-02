"use client"

import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react"
import { useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { OwnerQuickView } from "@/components/admin/domains/applications-section"
import { NoteReviewDialog, type ReviewText } from "@/components/admin/domains/review-domain-dialog"
import { SortSelect, adminSelectClass, type SortOption } from "@/components/admin/sort-controls"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { parseServerDateTime } from "@/lib/analytics"
import { DOMAIN_REQUEST_STATUSES, DOMAIN_REQUEST_STATUS_LABELS, adminRequestLimitLine, isDomainRequestStatus } from "@/lib/domains"
import { useAdminDomainRequests, useApproveDomainRequest, useDeclineDomainRequest } from "@/lib/hooks/useDomains"
import { useFocusAfterRetry } from "@/lib/hooks/useFocusAfterRetry"
import { useClampedPage, usePagination } from "@/lib/hooks/usePagination"
import type { AdminDomainRequest, AdminDomainRequestFilters, DomainRequestStatus } from "@/lib/types"
import { cn, formatDateTime, formatTimeAgo, plural } from "@/lib/utils"

const SEARCH_PARAM = "search"

const STATUS_PARAM = "status"

const ALL_STATUSES = "ALL"

const SEARCH_DELAY_MS = 300

const sortFields = ["createdAt", "requestedTotal"]

const sortOptions: SortOption[] = [
  { field: "createdAt", direction: "desc", label: "Newest first" },
  { field: "createdAt", direction: "asc", label: "Oldest first" },
  { field: "requestedTotal", direction: "desc", label: "Most domains first" },
  { field: "requestedTotal", direction: "asc", label: "Fewest domains first" },
]

const STATUS_BADGES: Record<DomainRequestStatus, "secondary" | "success" | "destructive"> = {
  WAITING: "secondary",
  APPROVED: "success",
  DECLINED: "destructive",
}

const NOT_ON_PAGE = "This request isn't on this page. Search for the account's email to find it."

const rowButton = "h-8 px-2.5 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"

type ReviewMode = "approve" | "decline"

const reviewText = (mode: ReviewMode, request: AdminDomainRequest): ReviewText => {
  const account = request.owner?.email ?? "this account"
  return mode === "approve"
    ? {
        title: `Approve ${plural(request.requestedTotal, "custom domain")} for ${account}?`,
        description: `The account's limit becomes ${request.requestedTotal}, with its reason. The account gets an email, with your note if you add one.`,
        submit: "Approve",
        busy: "Approving...",
        destructive: false,
      }
    : {
        title: `Decline the request from ${account}?`,
        description: `The limit stays at ${request.currentLimit}. The account gets an email, with your note if you add one, and can ask again.`,
        submit: "Decline",
        busy: "Declining...",
        destructive: true,
      }
}

const writeParam = (name: string, value: string | null) => {
  const params = new URLSearchParams(window.location.search)
  if (value) params.set(name, value)
  else params.delete(name)
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}${window.location.hash}`)
}

const statusFromAddress = (value: string | null): DomainRequestStatus | typeof ALL_STATUSES =>
  value === ALL_STATUSES ? ALL_STATUSES : isDomainRequestStatus(value) ? value : "WAITING"

interface ReviewTarget {
  mode: ReviewMode
  request: AdminDomainRequest
  trigger: HTMLElement | null
}

interface DomainRequestsListProps {
  highlightId: number | null
  headingRef: RefObject<HTMLElement | null>
}

export function DomainRequestsList({ highlightId, headingRef }: DomainRequestsListProps) {
  const searchParams = useSearchParams()
  const { page, size, sort, order, setPage, setSize, setSortOrder } = usePagination("createdAt", "desc", sortFields)
  const [searchInput, setSearchInput] = useState(() => searchParams.get(SEARCH_PARAM) ?? "")
  const [search, setSearch] = useState(() => (searchParams.get(SEARCH_PARAM) ?? "").trim())
  const [status, setStatus] = useState(() => statusFromAddress(searchParams.get(STATUS_PARAM)))
  const filters: AdminDomainRequestFilters = {
    status: status === ALL_STATUSES ? undefined : status,
    search: search || undefined,
    page,
    size,
    sort,
    order,
  }
  const { data, isLoading, error, refetch, isFetching, isPlaceholderData } = useAdminDomainRequests(filters)
  useClampedPage(page, data?.totalPages, setPage)
  const requests = data?.content ?? []
  const approve = useApproveDomainRequest()
  const decline = useDeclineDomainRequest()
  const [target, setTarget] = useState<ReviewTarget | null>(null)
  const [open, setOpen] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const highlightedRef = useRef<HTMLLIElement>(null)
  const scrolledTo = useRef<number | null>(null)
  const focusAfterClose = useRef<HTMLElement | null>(null)
  const retryLoad = useFocusAfterRetry(headingRef, !!data && !error)
  const highlightShown = highlightId !== null && requests.some((request) => request.id === highlightId)
  const notOnPage = highlightId !== null && !!data && !error && !isFetching && !isPlaceholderData && !highlightShown

  useEffect(() => {
    writeParam(STATUS_PARAM, status === "WAITING" ? null : status)
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
    if (!highlightShown || scrolledTo.current === highlightId) return
    scrolledTo.current = highlightId
    highlightedRef.current?.scrollIntoView({ block: "center" })
  }, [highlightShown, highlightId])

  const applySearch = (value: string) => {
    const next = value.trim()
    if (next === search) return
    setSearch(next)
    setPage(0)
  }

  const changeStatus = (value: string) => {
    setStatus(statusFromAddress(value))
    setPage(0)
  }

  const neighbourOf = (trigger: HTMLElement | null): HTMLElement | null => {
    const row = trigger?.closest<HTMLElement>("[data-request-row]")
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-row-action]") ?? [])
    const own = row?.querySelector<HTMLElement>("[data-row-action]") ?? null
    const index = own ? buttons.indexOf(own) : -1
    return index === -1 ? null : (buttons[index + 1] ?? buttons[index - 1] ?? null)
  }

  const openReview = (mode: ReviewMode, request: AdminDomainRequest, trigger: HTMLElement) => {
    focusAfterClose.current = null
    setTarget({ mode, request, trigger })
    setOpen(true)
  }

  const confirm = async (note: string | null) => {
    if (!target) return
    const { mode, request, trigger } = target
    const neighbour = neighbourOf(trigger)
    const account = request.owner?.email ?? "the account"
    if (mode === "approve") {
      await approve.mutateAsync({ id: request.id, note })
      toast.success(`Approved ${plural(request.requestedTotal, "custom domain")} for ${account}`)
    } else {
      await decline.mutateAsync({ id: request.id, note })
      toast.success(`Declined the request from ${account}`)
    }
    focusAfterClose.current = neighbour
    setOpen(false)
  }

  const closeAutoFocus = (event: Event) => {
    event.preventDefault()
    const wanted = focusAfterClose.current
    focusAfterClose.current = null
    const trigger = target?.trigger
    const next =
      (wanted?.isConnected ? wanted : null) ??
      (trigger?.isConnected ? trigger : null) ??
      listRef.current?.querySelector<HTMLElement>("[data-row-action]") ??
      searchRef.current
    next?.focus()
  }

  const filtered = !!search || status !== "WAITING"

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
            placeholder="Search by email or reason"
            aria-label="Search by email or reason"
            className="h-9 pl-9"
          />
        </form>
        <select value={status} onChange={(event) => changeStatus(event.target.value)} aria-label="Filter by status" className={adminSelectClass}>
          {DOMAIN_REQUEST_STATUSES.map((value) => (
            <option key={value} value={value}>
              {DOMAIN_REQUEST_STATUS_LABELS[value]}
            </option>
          ))}
          <option value={ALL_STATUSES}>All</option>
        </select>
        <SortSelect options={sortOptions} sort={sort} order={order} onChange={setSortOrder} />
      </div>

      {notOnPage && (
        <p role="status" className="text-sm text-muted-foreground">
          {NOT_ON_PAGE}
        </p>
      )}

      {isLoading ? (
        <DomainRequestsLoading />
      ) : error && !data ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p role="alert" className="text-sm font-medium text-destructive">Failed to load the requests</p>
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
      ) : requests.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="font-semibold">{filtered ? "No requests match." : "No requests waiting."}</p>
          {!filtered && <p className="mt-1 text-sm text-muted-foreground">Requests show up here when an account at its limit asks for more in Settings.</p>}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <ul ref={listRef} className="divide-y">
            {requests.map((request) => {
              const highlighted = request.id === highlightId
              return (
                <li
                  key={request.id}
                  ref={highlighted ? highlightedRef : undefined}
                  data-request-row={request.id}
                  aria-current={highlighted ? "true" : undefined}
                  className={cn("scroll-mt-24 px-5 py-4", highlighted && "shadow-[inset_3px_0_0_hsl(var(--brand))]")}
                >
                  <RequestRow request={request} onReview={openReview} />
                </li>
              )
            })}
          </ul>
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

      <NoteReviewDialog
        formKey={target ? `${target.mode}-${target.request.id}` : "none"}
        text={target ? reviewText(target.mode, target.request) : null}
        open={open}
        onOpenChange={(next) => { if (!next) setOpen(false) }}
        onConfirm={confirm}
        onCloseAutoFocus={closeAutoFocus}
      />
    </div>
  )
}

function RequestRow({ request, onReview }: { request: AdminDomainRequest; onReview(mode: ReviewMode, request: AdminDomainRequest, trigger: HTMLElement): void }) {
  const createdAt = parseServerDateTime(request.createdAt)
  const reviewed = request.reviewedAt ? formatDateTime(parseServerDateTime(request.reviewedAt)) : null
  return (
    <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-start @3xl:justify-between">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-sm font-semibold">Asks for {plural(request.requestedTotal, "custom domain")} in total</h3>
          <Badge variant={STATUS_BADGES[request.status]} className="whitespace-nowrap">
            {DOMAIN_REQUEST_STATUS_LABELS[request.status]}
          </Badge>
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">
          {adminRequestLimitLine(request)}. Asked {formatDateTime(createdAt)} ({formatTimeAgo(createdAt)})
        </p>
        <p dir="auto" className="text-sm [overflow-wrap:anywhere]">{request.reason}</p>
        <OwnerQuickView owner={request.owner} />
        {reviewed && (
          <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
            {request.status === "APPROVED" ? "Approved" : "Declined"} {request.reviewedBy ? `by ${request.reviewedBy} ` : ""}on {reviewed}
          </p>
        )}
        {request.adminNote && <p className="text-sm [overflow-wrap:anywhere]">Note to the account: {request.adminNote}</p>}
      </div>
      {request.status === "WAITING" && (
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            data-row-action
            onClick={(event) => onReview("approve", request, event.currentTarget)}
            className={rowButton}
          >
            Approve
            <span className="sr-only"> the request from {request.owner?.email}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(event) => onReview("decline", request, event.currentTarget)}
            className={cn(rowButton, "text-destructive hover:text-destructive")}
          >
            Decline
            <span className="sr-only"> the request from {request.owner?.email}</span>
          </Button>
        </div>
      )}
    </div>
  )
}

export function DomainRequestsLoading() {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-5">
      {[...Array(4)].map((_, index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
    </div>
  )
}
