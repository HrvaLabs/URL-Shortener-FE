"use client"

import type { ReactNode, RefObject } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { errorText } from "@/components/admin/domains/review-domain-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { parseServerDateTime } from "@/lib/analytics"
import { TOKEN_STATUS_LABELS } from "@/lib/domains"
import { useCheckCloudflare, useDomainSummary, useReconcileDomains } from "@/lib/hooks/useDomains"
import { useFocusAfterRetry } from "@/lib/hooks/useFocusAfterRetry"
import type { CloudflareTokenStatus, DomainReconcile, DomainSummary } from "@/lib/types"
import { cn, formatTimeAgo } from "@/lib/utils"

const busyButton = "h-8 px-2.5 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"

const TOKEN_VARIANTS: Record<CloudflareTokenStatus, "success" | "destructive" | "warning"> = {
  OK: "success",
  MISSING: "destructive",
  INVALID: "destructive",
  NO_PERMISSION: "destructive",
  UNREACHABLE: "warning",
}

const checkedAgo = (value: string) => `Checked ${formatTimeAgo(parseServerDateTime(value))}`

export function DomainSummaryBar({ headingRef }: { headingRef: RefObject<HTMLElement | null> }) {
  const { data, error, isFetching, refetch } = useDomainSummary()
  const retry = useFocusAfterRetry(headingRef, !!data && !error)

  if (!data && error) {
    return (
      <div className="rounded-xl border bg-card px-6 py-8 text-center">
        <p role="alert" className="text-sm font-medium text-destructive">Failed to load the domain summary</p>
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
    )
  }

  if (!data) {
    return (
      <div className="grid gap-3 rounded-xl border bg-card p-5 @2xl:grid-cols-2 @min-[72rem]:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  return (
    <section aria-label="Domain summary" className="grid gap-px overflow-hidden rounded-xl border bg-border @2xl:grid-cols-2 @min-[72rem]:grid-cols-4">
      <SlotsTile summary={data} />
      <CloudflareTile summary={data} />
      <TokenTile summary={data} />
      <ReconcileTile reconcile={data.reconcile} />
    </section>
  )
}

function Tile({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 bg-card p-4">
      <h2 className="text-xs font-medium text-muted-foreground">{title}</h2>
      <div className="min-w-0 flex-1 space-y-1 text-sm">{children}</div>
      {action && <div>{action}</div>}
    </div>
  )
}

function SlotsTile({ summary }: { summary: DomainSummary }) {
  const full = summary.slotsInUse >= summary.maxActive
  return (
    <Tile title="Cap">
      <p className="font-medium tabular-nums">
        {summary.slotsInUse.toLocaleString()} of {summary.maxActive.toLocaleString()} domains in use
      </p>
      {full && <Badge variant="warning">Cap reached</Badge>}
      <p className="text-xs text-muted-foreground tabular-nums">
        {summary.pending.toLocaleString()} waiting for review, {summary.active.toLocaleString()} active
      </p>
    </Tile>
  )
}

function CloudflareTile({ summary }: { summary: DomainSummary }) {
  const total = summary.cloudflareTotal
  const atAllowance = total !== null && total >= summary.freeAllowance
  return (
    <Tile title="Cloudflare">
      {total === null ? (
        <p className="font-medium">Cloudflare total not read yet</p>
      ) : (
        <p className={cn("font-medium tabular-nums", atAllowance && "text-warning")}>
          Cloudflare: {total.toLocaleString()} of {summary.freeAllowance.toLocaleString()} free hostnames
        </p>
      )}
      {summary.cloudflareQuota && (
        <>
          <p className="text-xs tabular-nums text-muted-foreground">
            Quota {summary.cloudflareQuota.used.toLocaleString()} of {summary.cloudflareQuota.allocated.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            Cloudflare&apos;s quota isn&apos;t the free allowance; billing starts after {summary.freeAllowance.toLocaleString()}.
          </p>
        </>
      )}
    </Tile>
  )
}

function TokenTile({ summary }: { summary: DomainSummary }) {
  const check = useCheckCloudflare()
  const busy = check.isPending
  const { token } = summary

  const run = async () => {
    if (busy) return
    try {
      const result = await check.mutateAsync()
      const label = `Token: ${TOKEN_STATUS_LABELS[result.status]}`
      if (result.status === "OK") toast.success(label)
      else toast.error(label, result.message ? { description: result.message } : undefined)
    } catch (checkError) {
      toast.error(errorText(checkError))
    }
  }

  return (
    <Tile
      title="Cloudflare token"
      action={
        <Button type="button" size="sm" variant="outline" onClick={run} aria-disabled={busy} aria-busy={busy} className={busyButton}>
          {busy ? "Checking..." : "Check token"}
        </Button>
      }
    >
      <Badge variant={TOKEN_VARIANTS[token.status]} className={TOKEN_VARIANTS[token.status] === "destructive" ? "dark:bg-destructive/5" : undefined}>
        {TOKEN_STATUS_LABELS[token.status]}
      </Badge>
      {token.message && <p className="[overflow-wrap:anywhere]">{token.message}</p>}
      <p className="text-xs text-muted-foreground">{token.checkedAt ? checkedAgo(token.checkedAt) : "Not checked yet"}</p>
    </Tile>
  )
}

function ReconcileTile({ reconcile }: { reconcile: DomainReconcile | null }) {
  const run = useReconcileDomains()
  const busy = run.isPending

  const start = async () => {
    if (busy) return
    try {
      const result = await run.mutateAsync()
      if (result.error) toast.error(result.error)
      else toast.success("Checked Cloudflare")
    } catch (runError) {
      toast.error(errorText(runError))
    }
  }

  return (
    <Tile
      title="Last check against Cloudflare"
      action={
        <Button type="button" size="sm" variant="outline" onClick={start} aria-disabled={busy} aria-busy={busy} className={busyButton}>
          {busy ? "Checking..." : "Check Cloudflare now"}
        </Button>
      }
    >
      {reconcile ? (
        <>
          <p className="font-medium">{checkedAgo(reconcile.ranAt)}</p>
          {reconcile.error && <p className="text-destructive [overflow-wrap:anywhere]">{reconcile.error}</p>}
          {reconcile.oursInCloudflare !== null && reconcile.cloudflareTotal !== null && (
            <p className="text-xs tabular-nums text-muted-foreground">
              {reconcile.oursInCloudflare} of {reconcile.cloudflareTotal} Cloudflare hostnames are ours
            </p>
          )}
          <DriftList label="Not ours, in Cloudflare" items={reconcile.unknownHostnames.map((hostname) => ({ key: hostname, content: hostname }))} />
          <DriftList
            label="Ours, missing in Cloudflare"
            items={reconcile.missing.map((missing) => ({
              key: String(missing.id),
              content: (
                <Link href={`/admin/domains?id=${missing.id}`} className="text-brand-link">
                  {missing.hostname}
                </Link>
              ),
            }))}
          />
          {reconcile.ignored.length > 0 && (
            <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">Ignored: {reconcile.ignored.join(", ")}</p>
          )}
          {!reconcile.error && reconcile.unknownHostnames.length === 0 && reconcile.missing.length === 0 && (
            <p className="text-xs text-muted-foreground">No drift</p>
          )}
        </>
      ) : (
        <p className="font-medium">Not checked yet</p>
      )}
    </Tile>
  )
}

function DriftList({ label, items }: { label: string; items: { key: string; content: ReactNode }[] }) {
  if (items.length === 0) return null
  return (
    <div className="text-xs">
      <p className="font-medium text-warning">{label}</p>
      <ul className="mt-0.5 space-y-0.5">
        {items.map((item) => (
          <li key={item.key} className="[overflow-wrap:anywhere]">{item.content}</li>
        ))}
      </ul>
    </div>
  )
}
