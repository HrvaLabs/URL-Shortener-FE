"use client"

import { Suspense, useRef } from "react"
import { PageMeta } from "@/components/page-meta"
import { BioPagesLoading, BioPagesTable } from "@/components/admin/bio-pages/bio-pages-table"

const subline = "Every bio page on hrva.cc. Hide a page with a reason, or change or revoke its handle."

export default function AdminBioPagesPage() {
  const headingRef = useRef<HTMLHeadingElement>(null)
  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Bio pages" description={subline} />
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl focus-visible:ring-0 focus-visible:ring-offset-0">
          Bio pages
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subline}</p>
      </div>
      <Suspense fallback={<BioPagesLoading />}>
        <BioPagesTable headingRef={headingRef} />
      </Suspense>
    </div>
  )
}
