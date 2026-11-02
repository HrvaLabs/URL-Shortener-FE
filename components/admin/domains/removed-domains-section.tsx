"use client"

import { useRef, useState, type RefObject } from "react"
import { useSearchParams } from "next/navigation"
import { DomainsTable } from "@/components/admin/domains/domains-table"
import { Button } from "@/components/ui/button"
import { hasRemovedDomainsParam, removedDomainsLabel } from "@/lib/domains"
import { useAdminDomains } from "@/lib/hooks/useDomains"
import { useFocusAfterRetry } from "@/lib/hooks/useFocusAfterRetry"
import type { AdminDomainFilters } from "@/lib/types"

const countFilters: AdminDomainFilters = { status: "DELETED", page: 0, size: 1 }

export function RemovedDomainsSection({ headingRef }: { headingRef: RefObject<HTMLElement | null> }) {
  const { data, error, isFetching, refetch } = useAdminDomains(countFilters)
  const summaryRef = useRef<HTMLElement>(null)
  const retry = useFocusAfterRetry(summaryRef, data !== undefined)
  const searchParams = useSearchParams()
  const [openOnLoad] = useState(() => hasRemovedDomainsParam(searchParams.keys()))
  const [open, setOpen] = useState(openOnLoad)
  const count = data?.totalElements
  if (count === 0) return null
  if (data === undefined && error) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-4 py-3">
        <p className="text-sm font-medium">{removedDomainsLabel()}</p>
        <p role="alert" className="text-sm text-destructive">Couldn&apos;t load the removed domains.</p>
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
    )
  }
  return (
    <details open={openOnLoad} className="rounded-lg border" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary ref={summaryRef} className="cursor-pointer px-4 py-3 text-sm font-medium">{removedDomainsLabel(count)}</summary>
      {open && (
        <div className="border-t p-4">
          <DomainsTable highlightId={null} headingRef={headingRef} removed />
        </div>
      )}
    </details>
  )
}
