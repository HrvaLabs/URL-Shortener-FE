"use client"

import { Suspense, useRef, type RefObject } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { PageMeta } from "@/components/page-meta"
import { ApplicationsSection } from "@/components/admin/domains/applications-section"
import { DomainSummaryBar } from "@/components/admin/domains/domain-summary-bar"
import { DomainsLoading, DomainsTable } from "@/components/admin/domains/domains-table"
import { RemovedDomainsSection } from "@/components/admin/domains/removed-domains-section"
import { useAdminDomainRequests } from "@/lib/hooks/useDomains"

const subline = "Custom domains: review applications, keep an eye on the Cloudflare cap, and turn off or remove a domain."

const ID_PARAM = "id"

export default function AdminDomainsPage() {
  const headingRef = useRef<HTMLHeadingElement>(null)
  return (
    <div className="space-y-6">
      <PageMeta title={`Admin ${String.fromCodePoint(0x2014)} Domains`} description={subline} />
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl focus-visible:ring-0 focus-visible:ring-offset-0">
          Domains
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subline}</p>
        <LimitRequestsLink />
      </div>
      <DomainSummaryBar headingRef={headingRef} />
      <Suspense fallback={<DomainsLoading />}>
        <DomainsContent headingRef={headingRef} />
      </Suspense>
    </div>
  )
}

function DomainsContent({ headingRef }: { headingRef: RefObject<HTMLElement | null> }) {
  const idParam = useSearchParams().get(ID_PARAM)
  const highlightId = idParam && /^\d+$/.test(idParam) ? Number(idParam) : null
  return (
    <div className="space-y-6">
      <ApplicationsSection highlightId={highlightId} fallbackFocusRef={headingRef} />
      <DomainsTable highlightId={highlightId} headingRef={headingRef} />
      <RemovedDomainsSection headingRef={headingRef} />
    </div>
  )
}

function LimitRequestsLink() {
  const { data } = useAdminDomainRequests({ status: "WAITING", page: 0, size: 1 })
  const waiting = data?.totalElements ?? 0
  return (
    <p className="mt-2 text-sm">
      <Link href="/admin/domains/requests" className="text-brand-link">Limit requests</Link>
      {waiting > 0 && <span className="ml-1.5 text-muted-foreground tabular-nums">({waiting} waiting)</span>}
    </p>
  )
}
