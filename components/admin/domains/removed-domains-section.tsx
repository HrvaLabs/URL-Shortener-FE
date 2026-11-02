"use client"

import { useState, type RefObject } from "react"
import { DomainsTable } from "@/components/admin/domains/domains-table"
import { removedDomainsLabel } from "@/lib/domains"
import { useAdminDomains } from "@/lib/hooks/useDomains"
import type { AdminDomainFilters } from "@/lib/types"

const countFilters: AdminDomainFilters = { status: "DELETED", page: 0, size: 1 }

export function RemovedDomainsSection({ headingRef }: { headingRef: RefObject<HTMLElement | null> }) {
  const { data } = useAdminDomains(countFilters)
  const [open, setOpen] = useState(false)
  const count = data?.totalElements ?? 0
  if (count === 0) return null
  return (
    <details className="rounded-lg border" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium">{removedDomainsLabel(count)}</summary>
      {open && (
        <div className="border-t p-4">
          <DomainsTable highlightId={null} headingRef={headingRef} removed />
        </div>
      )}
    </details>
  )
}
