"use client"

import { useEffect, useId, useMemo, useRef, useState, type RefObject } from "react"
import { toast } from "sonner"
import { ReviewDomainDialog, type ReviewMode } from "@/components/admin/domains/review-domain-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { parseServerDateTime } from "@/lib/analytics"
import { accountAgeLine } from "@/lib/domains"
import { useAdminDomains, useApproveDomain, useRejectDomain } from "@/lib/hooks/useDomains"
import { useFocusAfterRetry } from "@/lib/hooks/useFocusAfterRetry"
import { useClampedPage } from "@/lib/hooks/usePagination"
import type { AdminDomain, AdminDomainFilters, DomainOwnerSummary } from "@/lib/types"
import { cn, formatDateTime, plural } from "@/lib/utils"

const PAGE_SIZE = 20

export const applicationFilters = (page: number, size: number = PAGE_SIZE): AdminDomainFilters => ({ status: "PENDING_REVIEW", page, size })

const rowButton = "h-8 px-2.5 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"

interface ReviewTarget {
  mode: ReviewMode
  domain: AdminDomain
  trigger: HTMLElement | null
}

interface ApplicationsSectionProps {
  highlightId: number | null
  fallbackFocusRef: RefObject<HTMLElement | null>
}

export function ApplicationsSection({ highlightId, fallbackFocusRef }: ApplicationsSectionProps) {
  const headingId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(PAGE_SIZE)
  const { data, error, isFetching, refetch } = useAdminDomains(applicationFilters(page, size))
  useClampedPage(page, data?.totalPages, setPage)
  const entries = data?.content ?? []
  const approve = useApproveDomain()
  const reject = useRejectDomain()
  const [target, setTarget] = useState<ReviewTarget | null>(null)
  const [open, setOpen] = useState(false)
  const focusAfterClose = useRef<HTMLElement | null>(null)
  const scrolledTo = useRef<number | null>(null)
  const highlightedRef = useRef<HTMLLIElement>(null)
  const highlightShown = highlightId !== null && entries.some((entry) => entry.id === highlightId)
  const retryFocusTarget = useMemo<RefObject<HTMLElement | null>>(
    () => ({ get current() { return headingRef.current ?? fallbackFocusRef.current } }),
    [fallbackFocusRef],
  )
  const retry = useFocusAfterRetry(retryFocusTarget, !!data && !error)

  useEffect(() => {
    if (!highlightShown || scrolledTo.current === highlightId) return
    scrolledTo.current = highlightId
    highlightedRef.current?.scrollIntoView({ block: "center" })
  }, [highlightShown, highlightId])

  const neighbourOf = (trigger: HTMLElement | null): HTMLElement | null => {
    const row = trigger?.closest<HTMLElement>("[data-domain-row]")
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-remove-row]") ?? [])
    const own = row?.querySelector<HTMLElement>("[data-remove-row]") ?? null
    const index = own ? buttons.indexOf(own) : -1
    return index === -1 ? null : (buttons[index + 1] ?? buttons[index - 1] ?? null)
  }

  const openReview = (mode: ReviewMode, domain: AdminDomain, trigger: HTMLElement) => {
    focusAfterClose.current = null
    setTarget({ mode, domain, trigger })
    setOpen(true)
  }

  const confirm = async (note: string | null) => {
    if (!target) return
    const { mode, domain, trigger } = target
    const neighbour = neighbourOf(trigger)
    if (mode === "approve") {
      await approve.mutateAsync({ id: domain.id, note })
      toast.success(`Approved ${domain.hostname}`)
    } else {
      await reject.mutateAsync({ id: domain.id, note })
      toast.success(`Rejected ${domain.hostname}`)
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
      listRef.current?.querySelector<HTMLElement>("[data-remove-row]") ??
      fallbackFocusRef.current
    next?.focus()
  }

  return (
    <>
      {(error || entries.length > 0) && (
        <section aria-labelledby={headingId} className="min-w-0 overflow-hidden rounded-xl border bg-card">
          <h2 ref={headingRef} id={headingId} tabIndex={-1} className="border-b px-5 py-3.5 text-sm font-semibold focus-visible:ring-0 focus-visible:ring-offset-0">
            Applications
            {data && data.totalElements > 0 && <span className="ml-1.5 font-normal text-muted-foreground tabular-nums">({data.totalElements})</span>}
          </h2>
          {error && entries.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p role="alert" className="text-sm font-medium text-destructive">Failed to load the applications</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 aria-disabled:opacity-50"
                onClick={() => { if (!isFetching) retry(refetch) }}
                aria-disabled={isFetching}
              >
                Retry
              </Button>
            </div>
          ) : (
            <>
              <ul ref={listRef} className="divide-y">
                {entries.map((entry) => {
                  const highlighted = entry.id === highlightId
                  return (
                    <li
                      key={entry.id}
                      ref={highlighted ? highlightedRef : undefined}
                      id={`domain-application-${entry.id}`}
                      data-domain-row={entry.id}
                      aria-current={highlighted ? "true" : undefined}
                      className={cn("scroll-mt-24 px-5 py-4", highlighted && "shadow-[inset_3px_0_0_hsl(var(--brand))]")}
                    >
                      <ApplicationRow entry={entry} onReview={openReview} />
                    </li>
                  )
                })}
              </ul>
              {data && data.totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={data.totalPages}
                  totalElements={data.totalElements}
                  size={size}
                  onPageChange={setPage}
                  onSizeChange={(next) => {
                    setSize(next)
                    setPage(0)
                  }}
                />
              )}
            </>
          )}
        </section>
      )}

      <ReviewDomainDialog
        mode={target?.mode ?? "approve"}
        hostname={target?.domain.hostname ?? null}
        open={open}
        onOpenChange={(next) => { if (!next) setOpen(false) }}
        onConfirm={confirm}
        onCloseAutoFocus={closeAutoFocus}
      />
    </>
  )
}

function ApplicationRow({ entry, onReview }: { entry: AdminDomain; onReview(mode: ReviewMode, domain: AdminDomain, trigger: HTMLElement): void }) {
  return (
    <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-start @3xl:justify-between">
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <h3 className="font-mono text-[13px] font-medium [overflow-wrap:anywhere]">{entry.hostname}</h3>
          <p className="text-xs tabular-nums text-muted-foreground">Applied {formatDateTime(parseServerDateTime(entry.createdAt))}</p>
        </div>
        <p dir="auto" className="text-sm [overflow-wrap:anywhere]">{entry.reason}</p>
        <OwnerQuickView owner={entry.owner} />
        {entry.applyFlags.length > 0 && (
          <div className="text-xs">
            <p className="font-medium text-warning">Flags</p>
            <ul className="mt-0.5 list-disc space-y-0.5 pl-4">
              {entry.applyFlags.map((flag, index) => (
                <li key={`${index}-${flag}`} dir="auto" className="[overflow-wrap:anywhere]">{flag}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          data-remove-row
          onClick={(event) => onReview("approve", entry, event.currentTarget)}
          className={rowButton}
        >
          Approve
          <span className="sr-only"> {entry.hostname}</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={(event) => onReview("reject", entry, event.currentTarget)}
          className={cn(rowButton, "text-destructive hover:text-destructive")}
        >
          Reject
          <span className="sr-only"> {entry.hostname}</span>
        </Button>
      </div>
    </div>
  )
}

export function OwnerQuickView({ owner }: { owner: DomainOwnerSummary | null }) {
  if (!owner) return <p className="text-xs text-muted-foreground">Account deleted</p>
  const facts = [
    accountAgeLine(parseServerDateTime(owner.createdAt), new Date()),
    plural(owner.links, "link"),
    `${owner.blockedLinks.toLocaleString()} blocked`,
    `${owner.openReviews.toLocaleString()} in review`,
  ]
  return (
    <div className="space-y-1 text-xs">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="min-w-0 font-medium [overflow-wrap:anywhere]">{owner.email}</span>
        {owner.possibleScammer && <Badge variant="warning" className="whitespace-nowrap">Possible scammer</Badge>}
        {!owner.active && <Badge variant="destructive" className="whitespace-nowrap dark:bg-destructive/5">Deactivated</Badge>}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums text-muted-foreground">
        {facts.map((fact) => (
          <li key={fact} className={cn(fact.endsWith("blocked") && owner.blockedLinks > 0 && "text-destructive", fact.endsWith("in review") && owner.openReviews > 0 && "text-warning")}>
            {fact}
          </li>
        ))}
      </ul>
    </div>
  )
}
