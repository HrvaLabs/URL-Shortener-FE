"use client"

import { useEffect, useId, useRef, useState } from "react"
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { adminApi, ApiError, campaignApi } from "@/lib/api-client"
import { addBulkBlock, blockSummaryText, blockTotalsText, BULK_BLOCK_BATCH, inBatches, NO_BULK_BLOCKS, RETRYABLE_BLOCK_STATUSES, type BulkBlockTotals } from "@/lib/moderation"
import { cn, plural } from "@/lib/utils"
import type { DomainBlockPreview } from "@/lib/types"

const DEFAULT_REASON = "Phishing"
const REASON_MAX_LENGTH = 255

export type BlockDomainsSource = { urlIds: number[] } | { campaignId: number }

interface BlockDomainsDialogProps {
  source: BlockDomainsSource
  open: boolean
  onOpenChange(open: boolean): void
  onBlocked(): void
  onCloseAutoFocus?(event: Event): void
}

export function BlockDomainsDialog({ source, open, onOpenChange, onBlocked, onCloseAutoFocus }: BlockDomainsDialogProps) {
  const [blocking, setBlocking] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!blocking) onOpenChange(next) }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl" onCloseAutoFocus={onCloseAutoFocus}>
        <BlockDomainsForm
          key={"urlIds" in source ? source.urlIds.join(",") : `campaign-${source.campaignId}`}
          source={source}
          blocking={blocking}
          setBlocking={setBlocking}
          onCancel={() => onOpenChange(false)}
          onBlocked={() => {
            onBlocked()
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

const reportResult = (totals: BulkBlockTotals) => {
  const { blocked, skipped } = totals
  const summary = blockSummaryText(totals)
  if (skipped.length === 0) {
    toast.success(summary)
    return
  }
  const description = (
    <ul className="space-y-0.5">
      {skipped.map((entry, index) => (
        <li key={`${index}-${entry.domain}`} className="[overflow-wrap:anywhere]">{entry.domain}: {entry.reason}</li>
      ))}
    </ul>
  )
  if (blocked === 0) toast.error(`No domains blocked, ${plural(skipped.length, "domain")} skipped`, { description })
  else toast.warning(`${summary}. ${plural(skipped.length, "domain")} skipped`, { description })
}

const refreshAfterBlock = (queryClient: QueryClient, refetchPreview: boolean) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ["urls"] }),
    queryClient.invalidateQueries({ queryKey: ["admin", "domain-rules"] }),
    queryClient.invalidateQueries({ queryKey: ["admin", "review"] }),
    queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] }),
    queryClient.invalidateQueries({ queryKey: ["admin", "domain-block-preview"], refetchType: refetchPreview ? "active" : "none" }),
  ])

interface StalledBlock {
  message: string
  remaining: string[][]
  totals: BulkBlockTotals
}

const isAllowed = (row: DomainBlockPreview) => row.rule === "ALLOW"

const isBlockable = (row: DomainBlockPreview, campaignMode: boolean) => !isAllowed(row) && !(campaignMode && row.rule === "BLOCK")

const showsHosts = (row: DomainBlockPreview) => row.hosts.length > 1 || row.hosts[0] !== row.domain

interface BlockDomainsFormProps {
  source: BlockDomainsSource
  blocking: boolean
  setBlocking(blocking: boolean): void
  onCancel(): void
  onBlocked(): void
}

function BlockDomainsForm({ source, blocking, setBlocking, onCancel, onBlocked }: BlockDomainsFormProps) {
  const id = useId()
  const queryClient = useQueryClient()
  const campaignId = "campaignId" in source ? source.campaignId : null
  const urlIds = "urlIds" in source ? source.urlIds : []
  const { data: rows, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: campaignId !== null ? ["admin", "domain-block-preview", "campaign", campaignId] : ["admin", "domain-block-preview", urlIds],
    queryFn: () => (campaignId !== null ? campaignApi.blockPreview(campaignId) : adminApi.previewBlockDomains(urlIds)),
    enabled: campaignId !== null || urlIds.length > 0,
  })
  const [unticked, setUnticked] = useState<Set<string>>(new Set())
  const [reason, setReason] = useState(DEFAULT_REASON)
  const [stalled, setStalled] = useState<StalledBlock | null>(null)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null)
  const unreported = useRef<BulkBlockTotals | null>(null)
  const trimmedReason = reason.trim()
  const ticked = (rows ?? []).filter((row) => isBlockable(row, campaignId !== null) && !unticked.has(row.domain))
  const leftOut = rows && campaignId === null ? urlIds.length - rows.reduce((sum, row) => sum + row.selectedLinks, 0) : 0
  const linkWord = campaignId !== null ? "campaign link" : "ticked link"
  const locked = blocking || stalled !== null

  useEffect(
    () => () => {
      const totals = unreported.current
      if (!totals) return
      unreported.current = null
      reportResult(totals)
      void refreshAfterBlock(queryClient, false)
    },
    [queryClient],
  )

  const toggle = (domain: string) =>
    setUnticked((prev) => {
      const next = new Set(prev)
      if (next.has(domain)) next.delete(domain)
      else next.add(domain)
      return next
    })

  const finish = async (totals: BulkBlockTotals) => {
    reportResult(totals)
    if (totals.blocked === 0) return
    await refreshAfterBlock(queryClient, false)
    onBlocked()
  }

  const blockInBatches = async (batches: string[][], from: BulkBlockTotals) => {
    setStalled(null)
    unreported.current = null
    let totals = from
    for (const [index, batch] of batches.entries()) {
      setBatchProgress(batches.length > 1 ? { current: index + 1, total: batches.length } : null)
      try {
        totals = addBulkBlock(totals, await adminApi.blockDomains(batch, trimmedReason))
      } catch (err) {
        const message = err instanceof ApiError && err.message ? err.message : "Failed to block the domains"
        if (err instanceof ApiError && RETRYABLE_BLOCK_STATUSES.includes(err.status)) {
          unreported.current = totals.blocked > 0 || totals.skipped.length > 0 ? totals : null
          setStalled({ message, remaining: batches.slice(index), totals })
          return
        }
        toast.error(message)
        if (totals.blocked > 0 || totals.skipped.length > 0) {
          reportResult(totals)
          await refreshAfterBlock(queryClient, true)
        }
        return
      }
    }
    await finish(totals)
  }

  const block = async () => {
    if (ticked.length === 0 || !trimmedReason) return
    setBlocking(true)
    try {
      const domains = ticked.map((row) => row.domain)
      if (campaignId !== null) {
        await blockInBatches(inBatches(domains), NO_BULK_BLOCKS)
        return
      }
      await finish(addBulkBlock(NO_BULK_BLOCKS, await adminApi.blockDomains(domains, trimmedReason)))
    } catch (err) {
      toast.error(err instanceof ApiError && err.message ? err.message : "Failed to block the domains")
    } finally {
      setBlocking(false)
      setBatchProgress(null)
    }
  }

  const retry = async () => {
    if (!stalled || !trimmedReason) return
    setBlocking(true)
    try {
      await blockInBatches(stalled.remaining, stalled.totals)
    } catch (err) {
      toast.error(err instanceof ApiError && err.message ? err.message : "Failed to block the domains")
    } finally {
      setBlocking(false)
      setBatchProgress(null)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Block domains</DialogTitle>
        <DialogDescription>
          {campaignId !== null
            ? `Blocks each ticked domain for the whole site. Held links of the campaign stay off as domain blocks. Active links on these domains, anyone's, are turned off and their owners emailed. Domains are blocked ${BULK_BLOCK_BATCH} at a time.`
            : "Every active link to a ticked domain is deactivated and its owner emailed, one email per owner. New links to these domains are refused."}
        </DialogDescription>
      </DialogHeader>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <div className="rounded-lg border px-4 py-3 text-sm">
          <p className="text-destructive [overflow-wrap:anywhere]">
            {error instanceof ApiError && error.message ? error.message : campaignId !== null ? "Couldn't look up the domains of the campaign's links." : "Couldn't look up the domains of the ticked links."}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()} disabled={isFetching}>Retry</Button>
        </div>
      ) : !rows || rows.length === 0 ? (
        <p className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
          {campaignId !== null ? "None of the campaign's links point to a domain that can be blocked." : "None of the ticked links point to a domain that can be blocked."}
        </p>
      ) : (
        <>
          {campaignId !== null && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm tabular-nums text-muted-foreground">{blockTotalsText(rows)}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setUnticked(new Set())} disabled={locked}>Tick all</Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUnticked(new Set(rows.map((row) => row.domain)))}
                  disabled={locked}
                >
                  Untick all
                </Button>
              </div>
            </div>
          )}
          <fieldset className="space-y-2">
            <legend className="sr-only">Domains to block</legend>
            {rows.map((row, index) => {
              const allowed = isAllowed(row)
              const blockable = isBlockable(row, campaignId !== null)
              const checked = blockable && !unticked.has(row.domain)
              const moreThanTicked = row.activeLinks > row.selectedLinks
              const domainId = `${id}-${index}-domain`
              const ruleId = `${id}-${index}-rule`
              const detailsId = `${id}-${index}-details`
              return (
                <label
                  key={row.domain}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                    !blockable ? "cursor-not-allowed bg-muted/40" : "cursor-pointer hover:bg-muted/40",
                    checked && "border-brand bg-brand-soft hover:bg-brand-soft",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(row.domain)}
                    disabled={!blockable || locked}
                    aria-labelledby={domainId}
                    aria-describedby={row.rule ? `${ruleId} ${detailsId}` : detailsId}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-brand"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span id={domainId} className="font-mono text-[13px] font-medium [overflow-wrap:anywhere]">{row.domain}</span>
                      {allowed && <Badge id={ruleId} variant="secondary">Allowed by a rule</Badge>}
                      {row.rule === "BLOCK" && <Badge id={ruleId} variant="destructive">Already blocked</Badge>}
                    </span>
                    <span id={detailsId} className="mt-1 block space-y-0.5 text-xs text-muted-foreground">
                      {showsHosts(row) && (
                        <span className="block font-mono [overflow-wrap:anywhere]">{row.hosts.join(", ")}</span>
                      )}
                      <span className="block tabular-nums">{plural(row.selectedLinks, linkWord)}</span>
                      {!allowed && (
                        <span className={cn("flex items-start gap-1 tabular-nums", moreThanTicked && "font-medium text-warning")}>
                          {moreThanTicked && <TriangleAlert aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />}
                          <span>
                            {row.activeLinks === 0
                              ? "No active links to turn off"
                              : `Turns off ${plural(row.activeLinks, "active link")} on the site${moreThanTicked ? `, more than the ${row.selectedLinks.toLocaleString()} ${campaignId !== null ? "in the campaign" : "ticked"}` : ""}`}
                          </span>
                        </span>
                      )}
                      {!allowed && row.heldLinks > 0 && (
                        <span className="block tabular-nums">Keeps {plural(row.heldLinks, "held link")} on the site off as a domain rule</span>
                      )}
                    </span>
                  </span>
                </label>
              )
            })}
          </fieldset>
          {leftOut > 0 && (
            <p className="text-sm text-muted-foreground">
              {plural(leftOut, "ticked link")} {leftOut === 1 ? "has" : "have"} no domain that can be blocked, such as an IP address, and {leftOut === 1 ? "is" : "are"} left out.
            </p>
          )}
          <div className="space-y-1.5">
            <label htmlFor={`${id}-reason`} className="text-sm font-medium">Reason</label>
            <Input
              id={`${id}-reason`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={REASON_MAX_LENGTH}
              aria-invalid={!trimmedReason}
              aria-describedby={`${id}-reason-hint`}
              disabled={locked}
              autoComplete="off"
              className="h-9"
            />
            <p id={`${id}-reason-hint`} className={cn("text-xs text-muted-foreground", !trimmedReason && "text-destructive")}>
              {trimmedReason ? "Saved on each rule and in the audit log." : "Enter a reason."}
            </p>
          </div>
        </>
      )}

      {batchProgress && (
        <p role="status" className="text-sm tabular-nums text-muted-foreground">
          Blocking batch {batchProgress.current.toLocaleString()} of {batchProgress.total.toLocaleString()}.
        </p>
      )}

      {stalled && (
        <div role="alert" className="rounded-lg border border-destructive/40 px-4 py-3 text-sm">
          <p className="text-destructive [overflow-wrap:anywhere]">{stalled.message}</p>
          <p className="mt-1 tabular-nums text-muted-foreground">
            {plural(stalled.totals.blocked, "domain")} blocked so far, {plural(stalled.remaining.flat().length, "domain")} left.
          </p>
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" className="mt-2 sm:mt-0" onClick={onCancel} disabled={blocking}>Cancel</Button>
        {stalled ? (
          <Button variant="destructive" onClick={retry} disabled={!trimmedReason || blocking}>
            {blocking ? "Blocking..." : "Block the remaining domains"}
          </Button>
        ) : (
          <Button variant="destructive" onClick={block} disabled={ticked.length === 0 || !trimmedReason || blocking}>
            {blocking ? "Blocking..." : ticked.length === 0 ? "Block domains" : `Block ${plural(ticked.length, "domain")}`}
          </Button>
        )}
      </DialogFooter>
    </>
  )
}
