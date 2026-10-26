"use client"

import { Suspense } from "react"
import { PageMeta } from "@/components/page-meta"
import { BioPagesLoading, BioPagesTable } from "@/components/admin/bio-pages/bio-pages-table"

const subline = "Every bio page on hrva.cc. Hide a page with a reason, or change or revoke its handle."

export default function AdminBioPagesPage() {
  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Bio pages" description={subline} />
      <div>
        <h1 className="font-display text-2xl">Bio pages</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subline}</p>
      </div>
      <Suspense fallback={<BioPagesLoading />}>
        <BioPagesTable />
      </Suspense>
    </div>
  )
}
