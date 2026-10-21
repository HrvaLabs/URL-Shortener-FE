"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, CircleCheck, Copy, GlobeLock, Link2Off, ShieldCheck, UserX } from "lucide-react"
import { toast } from "sonner"
import { useClampedPage, usePagination } from "@/lib/hooks/usePagination"
import { Pagination } from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BlockDomainDialog } from "@/components/admin/block-domain-dialog"
import { PageMeta } from "@/components/page-meta"
import { cn, formatDate, formatDateTime, formatShortUrl, getShortBaseUrl } from "@/lib/utils"
import { adminApi, ApiError } from "@/lib/api-client"
import type { ReviewAction, ReviewEntry, ReviewQueueFilters } from "@/lib/types"

type RowAction = Exclude<ReviewAction, "BLOCK_DOMAIN">

const shortHost = getShortBaseUrl().replace(/^https?:\/\//, "")

const DAY_MS = 24 * 60 * 60 * 1000

const reasonOptions = [
  { value: "young", label: "Young domain" },
  { value: "imitates", label: "Lookalike" },
  { value: "lure", label: "Lure" },
  { value: "on list", label: "On a list" },
  { value: "redirects to", label: "Redirects elsewhere" },
  { value: "reported by a visitor", label: "Reported by a visitor" },
  { value: "Spamhaus", label: "Spamhaus" },
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

const selectClass = "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0"

const iconButton = "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-transparent aria-disabled:hover:text-muted-foreground"

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"}`

const accountAge = (createdAt: string | null, now: number) => {
  if (!createdAt) return "—"
  const days = Math.floor((now - new Date(createdAt).getTime()) / DAY_MS)
  if (days < 1) return "today"
  if (days < 60) return `${plural(days, "day")} old`
  const months = Math.floor(days / 30)
  if (months < 24) return `${plural(months, "month")} old`
  return `${plural(Math.floor(days / 365), "year")} old`
}

const timeAgo = (date: string, now: number) => {
  const minutes = Math.floor((now - new Date(date).getTime()) / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${plural(minutes, "minute")} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${plural(hours, "hour")} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${plural(days, "day")} ago`
  return formatDate(date)
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

function ReviewQueue() {
  const searchParams = useSearchParams()
  const entryParam = searchParams.get("entry")
  const entryId = entryParam && /^\d+$/.test(entryParam) ? Number(entryParam) : null
  const { page, size, setPage, setSize } = usePagination()
  const [reason, setReason] = useState("")
  const [olderThanDays, setOlderThanDays] = useState("")
  const filters: ReviewQueueFilters = {
    page,
    size,
    reason: reason || undefined,
    olderThanDays: olderThanDays ? Number(olderThanDays) : undefined,
  }
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["admin", "review", "queue", filters],
    queryFn: () => adminApi.getReviewQueue(filters),
  })
  useClampedPage(page, data?.totalPages, setPage)
  const resolveReview = useMutation({
    mutationFn: ({ urlId, action, longUrl }: { urlId: number; action: RowAction; longUrl: string }) =>
      adminApi.resolveReview(urlId, action, action === "TRUST_DOMAIN" ? hostOf(longUrl) ?? undefined : undefined),
  })
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set())
  const [blockTarget, setBlockTarget] = useState<ReviewEntry | null>(null)
  const [blockOpen, setBlockOpen] = useState(false)
  const entries = data?.content ?? []
  const entryShown = entryId != null && entries.some((entry) => entry.urlId === entryId)
  const entryRowRef = useRef<HTMLTableRowElement>(null)
  const scrolledEntry = useRef<number | null>(null)

  useEffect(() => {
    if (!entryShown || scrolledEntry.current === entryId) return
    entryRowRef.current?.scrollIntoView({ block: "center" })
    scrolledEntry.current = entryId
  }, [entryShown, entryId])

  const setBusy = (id: number, busy: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev)
      if (busy) next.add(id)
      else next.delete(id)
      return next
    })

  const resolve = async (entry: ReviewEntry, action: RowAction) => {
    if (busyIds.has(entry.urlId)) return
    setBusy(entry.urlId, true)
    try {
      await resolveReview.mutateAsync({ urlId: entry.urlId, action, longUrl: entry.longUrl })
      const host = hostOf(entry.longUrl)
      toast.success(action === "TRUST_DOMAIN" && host ? `Trusted ${host}` : resolveMessages[action].success)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "review"] }),
        queryClient.invalidateQueries({ queryKey: ["urls"] }),
        action === "TRUST_DOMAIN" && queryClient.invalidateQueries({ queryKey: ["admin", "domain-rules"] }),
        action === "BLOCK_USER" && queryClient.invalidateQueries({ queryKey: ["users"] }),
      ])
    } catch (err) {
      toast.error(err instanceof ApiError && err.message ? err.message : resolveMessages[action].failure)
    } finally {
      setBusy(entry.urlId, false)
    }
  }

  const openBlockDomain = (entry: ReviewEntry) => {
    setBlockTarget(entry)
    setBlockOpen(true)
  }

  const filtered = !!reason || !!olderThanDays

  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Review queue" description="Flagged links waiting for a decision on hrva.cc." />
      <div>
        <h1 className="font-display text-2xl">Review queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">Flagged links waiting for your decision</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Reason
          <select
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setPage(0)
            }}
            className={selectClass}
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
            className={selectClass}
          >
            <option value="">Any</option>
            {ageOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

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
          <p className="font-semibold">Nothing waiting for a decision.</p>
          {filtered && <p className="mt-1 text-sm text-muted-foreground">Try a different filter.</p>}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Short link</TableHead>
                <TableHead className="hidden lg:table-cell">Destination</TableHead>
                <TableHead className="hidden xl:table-cell">Owner</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="hidden md:table-cell">Reasons</TableHead>
                <TableHead className="sticky right-0 bg-card bg-[linear-gradient(hsl(var(--muted)/0.5),hsl(var(--muted)/0.5))] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const highlighted = entry.urlId === entryId
                const anonymous = entry.ownerId == null
                const age = accountAge(entry.ownerCreatedAt, dataUpdatedAt)
                return (
                  <TableRow
                    key={entry.urlId}
                    ref={highlighted ? entryRowRef : undefined}
                    aria-current={highlighted ? "true" : undefined}
                    className={cn("group", highlighted && "bg-brand-soft hover:bg-brand-soft")}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="block max-w-28 truncate font-mono text-[13px] font-medium text-brand sm:max-w-52" title={`${shortHost}/${entry.shortUrl}`}>
                          <span className="text-brand/60">{shortHost}/</span>{entry.shortUrl}
                        </span>
                        <CopyShortLinkButton shortUrl={entry.shortUrl} />
                      </div>
                      <p className="mt-1 max-w-36 truncate text-xs text-muted-foreground sm:max-w-56 lg:hidden" title={entry.longUrl}>{entry.longUrl}</p>
                      <div className="mt-1 flex max-w-36 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground sm:max-w-48 xl:hidden">
                        <span className="max-w-full truncate" title={entry.ownerEmail ?? undefined}>{ownerLabel(entry)}</span>
                        {!anonymous && <span className="tabular-nums" title="Account age">{age}</span>}
                        {entry.possibleScammer && <Badge variant="warning">Possible scammer</Badge>}
                      </div>
                      <ReasonList reasons={entry.reasons} className="mt-1.5 max-w-36 sm:max-w-56 md:hidden" />
                    </TableCell>
                    <TableCell className="hidden max-w-[200px] lg:table-cell">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0} className="block truncate text-muted-foreground">{entry.longUrl}</span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm break-all">{entry.longUrl}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <span className={cn("block max-w-48 truncate", anonymous && "text-muted-foreground")} title={entry.ownerEmail ?? undefined}>
                        {ownerLabel(entry)}
                      </span>
                      {!anonymous && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground" title="Account age">{age}</span>
                          {entry.possibleScammer && <Badge variant="warning" className="whitespace-nowrap">Possible scammer</Badge>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell
                      className="hidden whitespace-nowrap tabular-nums text-muted-foreground lg:table-cell"
                      title={`Created ${formatDateTime(entry.createDate)}, flagged ${formatDateTime(entry.flaggedAt)}`}
                    >
                      {timeAgo(entry.createDate, dataUpdatedAt)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {entry.reasons.length > 0 ? (
                        <ReasonList reasons={entry.reasons} className="min-w-40 max-w-64" />
                      ) : (
                        <span className="text-muted-foreground">{"—"}</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "sticky right-0 bg-card text-right transition-colors",
                        highlighted ? "bg-brand-soft" : "group-hover:bg-[linear-gradient(hsl(var(--muted)/0.4),hsl(var(--muted)/0.4))]",
                      )}
                    >
                      <ReviewActions
                        entry={entry}
                        busy={busyIds.has(entry.urlId)}
                        onResolve={resolve}
                        onBlockDomain={openBlockDomain}
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
        onBlocked={() => undefined}
      />
    </div>
  )
}

function ReasonList({ reasons, className }: { reasons: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-0.5 text-xs", className)}>
      {reasons.map((item, index) => (
        <li key={`${index}-${item}`} className="line-clamp-2 wrap-anywhere" title={item}>{item}</li>
      ))}
    </ul>
  )
}

function CopyShortLinkButton({ shortUrl }: { shortUrl: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatShortUrl(shortUrl))
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
  onResolve(entry: ReviewEntry, action: RowAction): void
  onBlockDomain(entry: ReviewEntry): void
}

function ReviewActions({ entry, busy, onResolve, onBlockDomain }: ReviewActionsProps) {
  const host = hostOf(entry.longUrl)
  const owner = ownerLabel(entry)
  const preventWhileBusy = (event: React.MouseEvent) => {
    if (busy) event.preventDefault()
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={() => onResolve(entry, "OK")} aria-disabled={busy} aria-label="Looks fine" className={cn(iconButton, "hover:text-success")}>
            <CircleCheck className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Looks fine</TooltipContent>
      </Tooltip>
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <button type="button" onClick={preventWhileBusy} aria-disabled={busy} aria-label="Trust domain" className={cn(iconButton, "hover:text-success")}>
                <ShieldCheck className="h-3.5 w-3.5" />
              </button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">Trust domain</TooltipContent>
        </Tooltip>
        <AlertDialogContent>
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
            <AlertDialogAction onClick={() => onResolve(entry, "TRUST_DOMAIN")}>Trust domain</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <button type="button" onClick={preventWhileBusy} aria-disabled={busy} aria-label="Block link" className={cn(iconButton, "hover:text-destructive")}>
                <Link2Off className="h-3.5 w-3.5" />
              </button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">Block link</TooltipContent>
        </Tooltip>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block this link?</AlertDialogTitle>
            <AlertDialogDescription>Its owner is emailed and the link stops working.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onResolve(entry, "BLOCK_LINK")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Block link</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={() => { if (!busy) onBlockDomain(entry) }} aria-disabled={busy} aria-label="Block domain" className={cn(iconButton, "hover:text-destructive")}>
            <GlobeLock className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Block domain</TooltipContent>
      </Tooltip>
      {entry.ownerId == null ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-disabled="true" aria-label="Block user" className={iconButton}>
              <UserX className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Anonymous link, no user to block</TooltipContent>
        </Tooltip>
      ) : (
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <button type="button" onClick={preventWhileBusy} aria-disabled={busy} aria-label="Block user" className={cn(iconButton, "hover:text-destructive")}>
                  <UserX className="h-3.5 w-3.5" />
                </button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">Block user</TooltipContent>
          </Tooltip>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Block <span className="break-all">{owner}</span>?</AlertDialogTitle>
              <AlertDialogDescription>This deactivates the account and blocks all of its links.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onResolve(entry, "BLOCK_USER")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Block user</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
