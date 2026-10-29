"use client"

import { useId, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { adminApi, ApiError } from "@/lib/api-client"
import { cn, plural } from "@/lib/utils"
import type { DomainBlockPreview, DomainBulkBlockResult } from "@/lib/types"

const DEFAULT_REASON = "Phishing"
const REASON_MAX_LENGTH = 255

interface BlockDomainsDialogProps {
  urlIds: number[]
  open: boolean
  onOpenChange(open: boolean): void
  onBlocked(): void
  onCloseAutoFocus?(event: Event): void
}

export function BlockDomainsDialog({ urlIds, open, onOpenChange, onBlocked, onCloseAutoFocus }: BlockDomainsDialogProps) {
  const [blocking, setBlocking] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!blocking) onOpenChange(next) }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl" onCloseAutoFocus={onCloseAutoFocus}>
        <BlockDomainsForm
          key={urlIds.join(",")}
          urlIds={urlIds}
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

const reportResult = ({ blocked, skipped, linksDeactivated }: DomainBulkBlockResult) => {
  const summary = `Blocked ${plural(blocked.length, "domain")}, ${plural(linksDeactivated, "link")} turned off`
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
  if (blocked.length === 0) toast.error(`No domains blocked, ${plural(skipped.length, "domain")} skipped`, { description })
  else toast.warning(`${summary}. ${plural(skipped.length, "domain")} skipped`, { description })
}

const isAllowed = (row: DomainBlockPreview) => row.rule === "ALLOW"

const showsHosts = (row: DomainBlockPreview) => row.hosts.length > 1 || row.hosts[0] !== row.domain

interface BlockDomainsFormProps {
  urlIds: number[]
  blocking: boolean
  setBlocking(blocking: boolean): void
  onCancel(): void
  onBlocked(): void
}

function BlockDomainsForm({ urlIds, blocking, setBlocking, onCancel, onBlocked }: BlockDomainsFormProps) {
  const id = useId()
  const queryClient = useQueryClient()
  const { data: rows, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "domain-block-preview", urlIds],
    queryFn: () => adminApi.previewBlockDomains(urlIds),
    enabled: urlIds.length > 0,
  })
  const [unticked, setUnticked] = useState<Set<string>>(new Set())
  const [reason, setReason] = useState(DEFAULT_REASON)
  const trimmedReason = reason.trim()
  const ticked = (rows ?? []).filter((row) => !isAllowed(row) && !unticked.has(row.domain))
  const leftOut = rows ? urlIds.length - rows.reduce((sum, row) => sum + row.selectedLinks, 0) : 0

  const toggle = (domain: string) =>
    setUnticked((prev) => {
      const next = new Set(prev)
      if (next.has(domain)) next.delete(domain)
      else next.add(domain)
      return next
    })

  const block = async () => {
    if (ticked.length === 0 || !trimmedReason) return
    setBlocking(true)
    try {
      const result = await adminApi.blockDomains(ticked.map((row) => row.domain), trimmedReason)
      reportResult(result)
      if (result.blocked.length === 0) return
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["urls"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "domain-rules"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "review"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "domain-block-preview"], refetchType: "none" }),
      ])
      onBlocked()
    } catch (err) {
      toast.error(err instanceof ApiError && err.message ? err.message : "Failed to block the domains")
    } finally {
      setBlocking(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Block domains</DialogTitle>
        <DialogDescription>
          Every active link to a ticked domain is deactivated and its owner emailed, one email per owner. New links to these domains are refused.
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
            {error instanceof ApiError && error.message ? error.message : "Couldn't look up the domains of the ticked links."}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()} disabled={isFetching}>Retry</Button>
        </div>
      ) : !rows || rows.length === 0 ? (
        <p className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">None of the ticked links point to a domain that can be blocked.</p>
      ) : (
        <>
          <fieldset className="space-y-2">
            <legend className="sr-only">Domains to block</legend>
            {rows.map((row, index) => {
              const allowed = isAllowed(row)
              const checked = !allowed && !unticked.has(row.domain)
              const moreThanTicked = row.activeLinks > row.selectedLinks
              const domainId = `${id}-${index}-domain`
              const ruleId = `${id}-${index}-rule`
              const detailsId = `${id}-${index}-details`
              return (
                <label
                  key={row.domain}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                    allowed ? "cursor-not-allowed bg-muted/40" : "cursor-pointer hover:bg-muted/40",
                    checked && "border-brand bg-brand-soft hover:bg-brand-soft",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(row.domain)}
                    disabled={allowed || blocking}
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
                      <span className="block tabular-nums">{plural(row.selectedLinks, "ticked link")}</span>
                      {!allowed && (
                        <span className={cn("flex items-start gap-1 tabular-nums", moreThanTicked && "font-medium text-warning")}>
                          {moreThanTicked && <TriangleAlert aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />}
                          <span>
                            {row.activeLinks === 0
                              ? "No active links to turn off"
                              : `Turns off ${plural(row.activeLinks, "active link")} on the site${moreThanTicked ? `, more than the ${row.selectedLinks.toLocaleString()} ticked` : ""}`}
                          </span>
                        </span>
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
              disabled={blocking}
              autoComplete="off"
              className="h-9"
            />
            <p id={`${id}-reason-hint`} className={cn("text-xs text-muted-foreground", !trimmedReason && "text-destructive")}>
              {trimmedReason ? "Saved on each rule and in the audit log." : "Enter a reason."}
            </p>
          </div>
        </>
      )}

      <DialogFooter>
        <Button variant="outline" className="mt-2 sm:mt-0" onClick={onCancel} disabled={blocking}>Cancel</Button>
        <Button variant="destructive" onClick={block} disabled={ticked.length === 0 || !trimmedReason || blocking}>
          {blocking ? "Blocking..." : ticked.length === 0 ? "Block domains" : `Block ${plural(ticked.length, "domain")}`}
        </Button>
      </DialogFooter>
    </>
  )
}
