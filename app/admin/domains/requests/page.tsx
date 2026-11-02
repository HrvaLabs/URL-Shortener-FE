"use client"

import { Suspense, useRef, type RefObject } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { PageMeta } from "@/components/page-meta"
import { DomainRequestsList, DomainRequestsLoading } from "@/components/admin/domains/domain-requests-list"

const subline = "Requests for more custom domains: approve to raise the account's limit, or decline with a note."

const ID_PARAM = "id"

export default function AdminDomainRequestsPage() {
  const headingRef = useRef<HTMLHeadingElement>(null)
  return (
    <div className="space-y-6">
      <PageMeta title={`Admin ${String.fromCodePoint(0x2014)} Limit requests`} description={subline} />
      <div>
        <Link href="/admin/domains" className="text-sm text-brand-link">Domains</Link>
        <h1 ref={headingRef} tabIndex={-1} className="mt-1 font-display text-2xl focus-visible:ring-0 focus-visible:ring-offset-0">
          Limit requests
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subline}</p>
      </div>
      <Suspense fallback={<DomainRequestsLoading />}>
        <RequestsContent headingRef={headingRef} />
      </Suspense>
    </div>
  )
}

function RequestsContent({ headingRef }: { headingRef: RefObject<HTMLElement | null> }) {
  const idParam = useSearchParams().get(ID_PARAM)
  const highlightId = idParam && /^\d+$/.test(idParam) ? Number(idParam) : null
  return <DomainRequestsList highlightId={highlightId} headingRef={headingRef} />
}
