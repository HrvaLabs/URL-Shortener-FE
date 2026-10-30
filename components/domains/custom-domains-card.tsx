"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ApplyDomainForm } from "@/components/domains/apply-domain-form"
import { DnsRecord } from "@/components/domains/dns-record"
import { DomainStatusBadge, DomainStepList } from "@/components/domains/domain-status"
import { RemoveDomainDialog, type RemovableDomain } from "@/components/domains/remove-domain-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { parseServerDateTime } from "@/lib/analytics"
import { ApiError } from "@/lib/api-client"
import {
  DOMAIN_STATUS_HINTS,
  domainApplyState,
  domainLimitLine,
  domainProblemLines,
  domainRemovalSummary,
  isWaitingForSetup,
} from "@/lib/domains"
import { useDomain, useMyDomains, useRemoveDomain } from "@/lib/hooks/useDomains"
import { useFocusAfterRetry } from "@/lib/hooks/useFocusAfterRetry"
import { useRowRemovalFocus } from "@/lib/hooks/useRowRemovalFocus"
import type { CustomDomain, DomainLinkMode } from "@/lib/types"
import { formatDate, formatTimeAgo } from "@/lib/utils"

const CARD_ID = "custom-domains"

const rowButton = "h-8 px-2.5 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"

const headingId = (domainId: number) => `custom-domain-${domainId}`

const errorText = (error: unknown) => (error instanceof Error && error.message ? error.message : "Something went wrong. Try again.")

const serverDate = (value: string) => formatDate(parseServerDateTime(value))

const focusIsLost = () => {
  const active = document.activeElement
  return active === null || active === document.body
}

export function CustomDomainsCard() {
  const cardRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const hostnameRef = useRef<HTMLInputElement>(null)
  const removeTrigger = useRef<HTMLElement | null>(null)
  const scrolled = useRef(false)
  const pendingFocus = useRef<number | null>(null)
  const { data, error, isPending, isFetching, refetch } = useMyDomains()
  const remove = useRemoveDomain()
  const retry = useFocusAfterRetry(titleRef, data !== undefined)
  const refreshList = useCallback(() => void refetch({ cancelRefetch: false }), [refetch])
  const focusFallback = useCallback(() => hostnameRef.current ?? titleRef.current, [])
  const removal = useRowRemovalFocus(focusFallback)
  const [removing, setRemoving] = useState<RemovableDomain | null>(null)
  const [removeBusy, setRemoveBusy] = useState(false)

  useEffect(() => {
    if (scrolled.current || isPending) return
    scrolled.current = true
    if (window.location.hash === `#${CARD_ID}`) cardRef.current?.scrollIntoView({ block: "start" })
  }, [isPending])

  const focusNewRow = useCallback(() => {
    const id = pendingFocus.current
    if (id === null) return
    const heading = document.getElementById(headingId(id))
    if (!heading) return
    pendingFocus.current = null
    heading.focus()
  }, [])

  useEffect(() => {
    focusNewRow()
  }, [data, focusNewRow])

  const onApplied = (domain: CustomDomain) => {
    pendingFocus.current = domain.id
    window.requestAnimationFrame(focusNewRow)
  }

  const neighbourOf = (trigger: HTMLElement | null): HTMLElement | null => {
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-remove-row]") ?? [])
    const index = trigger ? buttons.indexOf(trigger) : -1
    return index === -1 ? null : (buttons[index + 1] ?? buttons[index - 1] ?? null)
  }

  const confirmRemove = async (links: DomainLinkMode) => {
    if (!removing || removeBusy) return
    const neighbour = neighbourOf(removeTrigger.current)
    setRemoveBusy(true)
    try {
      const result = await remove.mutateAsync({ id: removing.id, links })
      const summary = removing.withdraw ? null : domainRemovalSummary(result)
      toast.success(
        removing.withdraw ? `Withdrew your application for ${removing.hostname}.` : `Removed ${removing.hostname}.`,
        summary ? { description: summary } : undefined,
      )
    } catch (err) {
      toast.error(errorText(err))
      if (!(err instanceof ApiError && err.status === 404)) {
        setRemoveBusy(false)
        return
      }
    }
    removal.setTarget(neighbour)
    setRemoveBusy(false)
    setRemoving(null)
  }

  const applyState = data ? domainApplyState(data) : null

  return (
    <Card ref={cardRef} id={CARD_ID} className="scroll-mt-40 md:scroll-mt-24">
      <CardHeader>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <CardTitle ref={titleRef} tabIndex={-1} className="text-base focus-visible:ring-0 focus-visible:ring-offset-0">
            Custom domains
          </CardTitle>
          <Link href="/help/custom-domains" className="text-sm text-brand-link">How custom domains work</Link>
        </div>
        <CardDescription>
          Use your own subdomain, like go.example.com, for your short links. It&apos;s free; each domain is reviewed by a person first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {data === undefined ? (
          error ? (
            <div className="flex flex-wrap items-center gap-3">
              <p role="alert" className="text-sm text-destructive">Couldn&apos;t load your custom domains.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-disabled={isFetching}
                aria-busy={isFetching}
                onClick={() => { if (!isFetching) retry(refetch) }}
                className="aria-disabled:opacity-50"
              >
                Retry
              </Button>
            </div>
          ) : (
            <Skeleton className="h-32 w-full" aria-hidden="true" />
          )
        ) : (
          <>
            {data.domains.length === 0 ? (
              <p className="text-sm text-muted-foreground">No custom domains yet.</p>
            ) : (
              <ul ref={listRef} aria-label="Your custom domains" className="divide-y rounded-lg border">
                {data.domains.map((domain) => (
                  <DomainRow
                    key={domain.id}
                    domain={domain}
                    onStatusChange={refreshList}
                    onRemove={(trigger) => {
                      removeTrigger.current = trigger
                      setRemoving({
                        id: domain.id,
                        hostname: domain.hostname,
                        links: domain.links,
                        withdraw: domain.status === "PENDING_REVIEW",
                      })
                    }}
                  />
                ))}
              </ul>
            )}
            {applyState === "form" && <ApplyDomainForm ref={hostnameRef} onApplied={onApplied} />}
            {applyState === "limit" && <p className="text-sm text-muted-foreground">{domainLimitLine(data.limit)}</p>}
            {applyState === "off" && <p className="text-sm text-muted-foreground">Custom domains aren&apos;t available right now.</p>}
          </>
        )}
      </CardContent>
      <RemoveDomainDialog
        domain={removing}
        busy={removeBusy}
        onOpenChange={(open) => { if (!open) setRemoving(null) }}
        onConfirm={confirmRemove}
        onCloseAutoFocus={(event) => removal.onCloseAutoFocus(event, removeTrigger.current)}
      />
    </Card>
  )
}

const SETTLED: ReadonlySet<CustomDomain["status"]> = new Set(["REJECTED", "DELETED"])

interface DomainRowProps {
  domain: CustomDomain
  onStatusChange: () => void
  onRemove: (trigger: HTMLElement) => void
}

function DomainRow({ domain, onStatusChange, onRemove }: DomainRowProps) {
  if (SETTLED.has(domain.status)) return <DomainRowBody domain={domain} checking={false} onCheck={() => {}} onRemove={onRemove} />
  return <LiveDomainRow domain={domain} onStatusChange={onStatusChange} onRemove={onRemove} />
}

function LiveDomainRow({ domain: listed, onStatusChange, onRemove }: DomainRowProps) {
  const detail = useDomain(listed.id, { poll: true })
  const liveStatus = detail.data?.status

  useEffect(() => {
    if (liveStatus && liveStatus !== listed.status) onStatusChange()
  }, [liveStatus, listed.status, onStatusChange])

  return (
    <DomainRowBody
      domain={detail.data ?? listed}
      checking={detail.isFetching}
      onCheck={() => void detail.refetch()}
      onRemove={onRemove}
    />
  )
}

interface DomainRowBodyProps {
  domain: CustomDomain
  checking: boolean
  onCheck: () => void
  onRemove: (trigger: HTMLElement) => void
}

function DomainRowBody({ domain, checking, onCheck, onRemove }: DomainRowBodyProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const checkFocused = useRef(false)
  const waiting = isWaitingForSetup(domain.status)
  const problem = domainProblemLines(domain)
  const withdraw = domain.status === "PENDING_REVIEW"

  useLayoutEffect(() => {
    if (waiting || !checkFocused.current) return
    checkFocused.current = false
    if (focusIsLost()) headingRef.current?.focus()
  }, [waiting])

  return (
    <li className="space-y-3 px-4 py-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h4
          ref={headingRef}
          id={headingId(domain.id)}
          tabIndex={-1}
          className="min-w-0 text-sm font-semibold [overflow-wrap:anywhere] focus-visible:outline-hidden"
        >
          {domain.hostname}
        </h4>
        <div role="status">
          <DomainStatusBadge status={domain.status} />
        </div>
      </div>
      {!problem?.retry && <p className="text-sm text-muted-foreground">{DOMAIN_STATUS_HINTS[domain.status]}</p>}
      <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>Applied {serverDate(domain.createdAt)}</span>
        {domain.reviewedAt && <span>Reviewed {serverDate(domain.reviewedAt)}</span>}
        {domain.activatedAt && <span>Active since {serverDate(domain.activatedAt)}</span>}
      </p>
      {domain.reviewNote && (
        <p className="text-sm [overflow-wrap:anywhere]">Note from the admin: {domain.reviewNote}</p>
      )}
      {domain.status === "DISABLED" && domain.disabledNote && (
        <p className="text-sm [overflow-wrap:anywhere]">{domain.disabledNote}</p>
      )}
      {problem && (problem.text || problem.followUp) && (
        <div className="space-y-1">
          {problem.text && <p role="alert" className="text-sm text-destructive [overflow-wrap:anywhere]">{problem.text}</p>}
          {problem.followUp && <p className="text-xs text-muted-foreground">{problem.followUp}</p>}
        </div>
      )}
      {domain.status === "AWAITING_DNS" && domain.steps && <DomainStepList steps={domain.steps} />}
      {domain.dnsRecord && <DnsRecord record={domain.dnsRecord} />}
      {waiting && (
        <p className="text-xs text-muted-foreground">
          {domain.lastCheckedAt ? `Last checked ${formatTimeAgo(parseServerDateTime(domain.lastCheckedAt))}` : "Not checked yet"}
        </p>
      )}
      {domain.status !== "DELETED" && (
        <div className="flex flex-wrap items-center gap-2">
          {waiting && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-disabled={checking}
              aria-busy={checking}
              onFocus={() => { checkFocused.current = true }}
              onBlur={() => { checkFocused.current = false }}
              onClick={() => { if (!checking) onCheck() }}
              className={rowButton}
            >
              {problem?.retry ? (checking ? "Retrying..." : "Retry") : checking ? "Checking..." : "Check now"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-remove-row
            aria-label={withdraw ? `Withdraw application for ${domain.hostname}` : `Remove ${domain.hostname}`}
            onClick={(event) => onRemove(event.currentTarget)}
            className={`${rowButton} border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive`}
          >
            {withdraw ? "Withdraw application" : "Remove"}
          </Button>
        </div>
      )}
    </li>
  )
}
