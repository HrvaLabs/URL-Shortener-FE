"use client"

import { Suspense } from "react"
import { PageMeta } from "@/components/page-meta"
import { ReservedAliasForm } from "@/components/admin/reserved/reserved-alias-form"
import { ReservedAliasTable } from "@/components/admin/reserved/reserved-alias-table"

const subline = "Short link names nobody can create. Built-in ones are used by hrva.cc itself."

export default function AdminReservedAliasesPage() {
  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Reserved aliases" description={subline} />
      <div>
        <h1 className="font-display text-2xl">Reserved aliases</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subline}</p>
      </div>
      <ReservedAliasForm />
      <Suspense fallback={null}>
        <ReservedAliasTable />
      </Suspense>
    </div>
  )
}
