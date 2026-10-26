"use client"

import { useCallback, useEffect, useId, useRef, useState, type RefObject } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { BioPageReasonDialog, errorText } from "@/components/admin/bio-pages/bio-page-reason-dialog"
import { BioPageLink } from "@/components/admin/bio-pages/bio-pages-table"
import { DateTimeLines } from "@/components/admin/date-time-lines"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { parseServerDateTime } from "@/lib/analytics"
import { useBioPageReviews, useResolveBioPageReview } from "@/lib/hooks/useAdminBioPages"
import { useClampedPage } from "@/lib/hooks/usePagination"
import { useRowRemovalFocus } from "@/lib/hooks/useRowRemovalFocus"
import type { BioPageReviewEntry } from "@/lib/types"
import { cn, formatDateTime } from "@/lib/utils"

const SECTION_ID = "bio-pages"

const DEFAULT_SIZE = 20

const NOT_IN_QUEUE = "This bio page is no longer in the review queue."

const NOTHING_WAITING = "No bio pages are waiting."

const rowButton = "h-8 px-2.5 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"

const entryName = (entry: Pick<BioPageReviewEntry, "pageId" | "handle" | "displayName">) =>
  entry.handle ? `@${entry.handle}` : entry.displayName || `bio page ${entry.pageId}`

const openedAtSection = () => typeof window !== "undefined" && window.location.hash === `#${SECTION_ID}`

interface HideTarget {
  entry: BioPageReviewEntry
  trigger: HTMLElement | null
}

export function BioPageReviewSection({ fallbackFocusRef }: { fallbackFocusRef: RefObject<HTMLElement | null> }) {
  const headingId = useId()
  const searchParams = useSearchParams()
  const bioParam = searchParams.get("bio")
  const bioId = bioParam && /^\d+$/.test(bioParam) ? Number(bioParam) : null
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(DEFAULT_SIZE)
  const { data, error, refetch, isFetching, dataUpdatedAt, errorUpdatedAt } = useBioPageReviews(page, size)
  useClampedPage(page, data?.totalPages, setPage)
  const entries = data?.content ?? []
  const resolve = useResolveBioPageReview()
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set())
  const pendingIds = useRef<Set<number>>(new Set())
  const [hideTarget, setHideTarget] = useState<HideTarget | null>(null)
  const [hideOpen, setHideOpen] = useState(false)
  const entryShown = bioId != null && entries.some((entry) => entry.pageId === bioId)
  const entryRowRef = useRef<HTMLTableRowElement>(null)
  const scrolledEntry = useRef<number | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const firstRemaining = useCallback(
    () => document.querySelector<HTMLElement>("[data-bio-review-table] tbody [data-remove-row]") ?? fallbackFocusRef.current,
    [fallbackFocusRef],
  )
  const removalFocus = useRowRemovalFocus(firstRemaining)
  const restoreFocus = removalFocus.restore
  const restoreAfterRefetch = useRef(false)
  const settled = !isFetching && !(data && data.totalPages > 0 && page >= data.totalPages)
  const loadFailed = !!error
  const showTable = entries.length > 0 || loadFailed
  const notInQueue = bioId != null && !!data && !error && !entryShown
  const [linkedHere] = useState(openedAtSection)
  const scrollToSection = useRef(linkedHere)
  const nothingWaiting = linkedHere && bioId == null && !!data && !error && entries.length === 0

  useEffect(() => {
    if (!restoreAfterRefetch.current || !settled) return
    restoreAfterRefetch.current = false
    restoreFocus()
  }, [settled, dataUpdatedAt, errorUpdatedAt, restoreFocus])

  useEffect(() => {
    if (!entryShown || scrolledEntry.current === bioId) return
    entryRowRef.current?.scrollIntoView({ block: "center" })
    scrolledEntry.current = bioId
  }, [entryShown, bioId])

  useEffect(() => {
    if (!scrollToSection.current || bioId != null || (entries.length === 0 && !nothingWaiting)) return
    scrollToSection.current = false
    sectionRef.current?.scrollIntoView({ block: "start" })
  }, [bioId, entries.length, nothingWaiting])

  const setBusy = (pageId: number, busy: boolean) => {
    if (busy) pendingIds.current.add(pageId)
    else pendingIds.current.delete(pageId)
    setBusyIds((previous) => {
      const next = new Set(previous)
      if (busy) next.add(pageId)
      else next.delete(pageId)
      return next
    })
  }

  const looksFine = async (entry: BioPageReviewEntry, anchor: HTMLElement | null) => {
    if (pendingIds.current.has(entry.pageId)) return
    removalFocus.capture(anchor)
    setBusy(entry.pageId, true)
    restoreAfterRefetch.current = true
    try {
      await resolve.mutateAsync({ pageId: entry.pageId, action: "OK" })
      toast.success(`Marked ${entryName(entry)} as fine`)
    } catch (resolveError) {
      toast.error(errorText(resolveError))
    } finally {
      setBusy(entry.pageId, false)
    }
  }

  const openHide = (entry: BioPageReviewEntry, trigger: HTMLElement | null) => {
    if (pendingIds.current.has(entry.pageId)) return
    setHideTarget({ entry, trigger })
    setHideOpen(true)
  }

  const confirmHide = async (reason: string) => {
    if (!hideTarget) return
    const { entry, trigger } = hideTarget
    const anchor = document.querySelector<HTMLElement>(`[data-bio-review-entry="${entry.pageId}"] [data-remove-row]`)
    removalFocus.capture(anchor)
    setBusy(entry.pageId, true)
    try {
      await resolve.mutateAsync({ pageId: entry.pageId, action: "HIDE", reason })
    } catch (resolveError) {
      removalFocus.setTarget(trigger)
      throw resolveError
    } finally {
      setBusy(entry.pageId, false)
    }
    toast.success(`Hid ${entryName(entry)}`)
    setHideOpen(false)
  }

  return (
    <div id={SECTION_ID} ref={sectionRef} className={cn("scroll-mt-20 space-y-3", !showTable && !notInQueue && !nothingWaiting && "hidden")}>
      {nothingWaiting && <p className="text-sm text-muted-foreground">{NOTHING_WAITING}</p>}

      {notInQueue && (
        <p className="text-sm text-muted-foreground">
          {data && data.totalPages > 1 ? "This bio page is no longer in the review queue or is on another page." : NOT_IN_QUEUE}
        </p>
      )}

      {showTable && (
        <section aria-labelledby={headingId} className="min-w-0 overflow-hidden rounded-xl border bg-card">
          <h2 id={headingId} className="border-b px-5 py-3.5 text-sm font-semibold">Bio pages</h2>
          {loadFailed ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-destructive">Failed to load the bio page reviews</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()} disabled={isFetching}>Retry</Button>
            </div>
          ) : (
            <>
              <Table data-bio-review-table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="hidden @min-[57rem]:table-cell">Owner</TableHead>
                    <TableHead className="hidden @2xl:table-cell">Reasons</TableHead>
                    <TableHead className="hidden @min-[57rem]:table-cell">Flagged</TableHead>
                    <TableHead className="sticky right-0 bg-card bg-[linear-gradient(hsl(var(--muted)/0.5),hsl(var(--muted)/0.5))] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const highlighted = entry.pageId === bioId
                    const busy = busyIds.has(entry.pageId)
                    return (
                      <TableRow
                        key={entry.reviewId}
                        ref={highlighted ? entryRowRef : undefined}
                        data-bio-review-entry={entry.pageId}
                        aria-current={highlighted ? "true" : undefined}
                        className={cn("group", highlighted && "bg-brand-soft hover:bg-brand-soft")}
                      >
                        <TableCell>
                          <div className="min-w-36 @lg:min-w-56">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <BioPageLink handle={entry.handle} />
                              {entry.hidden && <Badge variant="destructive">Hidden</Badge>}
                            </div>
                            {entry.displayName && <p className="mt-0.5 [overflow-wrap:anywhere]">{entry.displayName}</p>}
                          </div>
                          <div className="mt-1 min-w-36 space-y-1 text-xs text-muted-foreground @lg:min-w-56 @min-[57rem]:hidden">
                            <p className="[overflow-wrap:anywhere]">{entry.ownerEmail}</p>
                            <p className="tabular-nums">Flagged {formatDateTime(parseServerDateTime(entry.flaggedAt))}</p>
                          </div>
                          <ReasonList reasons={entry.reasons} className="mt-1.5 min-w-36 @lg:min-w-56 @2xl:hidden" />
                        </TableCell>
                        <TableCell className="hidden @min-[57rem]:table-cell">
                          <span className="block min-w-48 [overflow-wrap:anywhere]">{entry.ownerEmail}</span>
                        </TableCell>
                        <TableCell className="hidden @2xl:table-cell">
                          {entry.reasons.length > 0 ? (
                            <ReasonList reasons={entry.reasons} className="min-w-40 max-w-72" />
                          ) : (
                            <span className="text-muted-foreground">{"—"}</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden tabular-nums text-muted-foreground @min-[57rem]:table-cell">
                          <DateTimeLines value={entry.flaggedAt} />
                        </TableCell>
                        <TableCell
                          className={cn(
                            "sticky right-0 bg-card text-right transition-colors",
                            highlighted ? "bg-brand-soft" : "group-hover:bg-[linear-gradient(hsl(var(--muted)/0.4),hsl(var(--muted)/0.4))]",
                          )}
                        >
                          <div className="ml-auto flex w-max flex-col items-stretch gap-1 @min-[77rem]:flex-row @min-[77rem]:items-center">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              data-remove-row
                              aria-disabled={busy}
                              onClick={(event) => { if (!busy) void looksFine(entry, event.currentTarget) }}
                              className={rowButton}
                            >
                              Looks fine
                              <span className="sr-only"> {entryName(entry)}</span>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              aria-disabled={busy}
                              onClick={(event) => openHide(entry, event.currentTarget)}
                              className={cn(rowButton, "text-destructive hover:text-destructive")}
                            >
                              Hide page
                              <span className="sr-only"> {entryName(entry)}</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
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

      <BioPageReasonDialog
        mode="hide"
        page={hideTarget?.entry ?? null}
        open={hideOpen}
        onOpenChange={(open) => { if (!open) setHideOpen(false) }}
        onConfirm={confirmHide}
        onCloseAutoFocus={(event) =>
          removalFocus.onCloseAutoFocus(event, hideTarget?.trigger?.isConnected ? hideTarget.trigger : firstRemaining())
        }
      />
    </div>
  )
}

function ReasonList({ reasons, className }: { reasons: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-0.5 text-xs", className)}>
      {reasons.map((reason, index) => (
        <li key={`${index}-${reason}`} className="[overflow-wrap:anywhere]">{reason}</li>
      ))}
    </ul>
  )
}
