"use client"

import { useLayoutEffect, useRef } from "react"
import Link from "next/link"
import { BioEditor } from "@/components/bio/bio-editor"
import { CreateBioPage } from "@/components/bio/create-bio-page"
import { errorText } from "@/components/bio/handle-field"
import { PageMeta } from "@/components/page-meta"
import { Button } from "@/components/ui/button"
import { useBioPage } from "@/lib/hooks/useBioPage"

export default function BioPageRoute() {
  const { data: page, error, refetch, isFetching } = useBioPage()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const hadPage = useRef<boolean | null>(null)
  const hasPage = page === undefined ? null : page !== null

  useLayoutEffect(() => {
    if (hasPage === null) return
    if (hadPage.current !== null && hadPage.current !== hasPage) headingRef.current?.focus()
    hadPage.current = hasPage
  }, [hasPage])

  return (
    <div className="space-y-6">
      <PageMeta title="Dashboard — Bio page" description="Create and edit your hrva.cc bio page." />
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl focus-visible:ring-0 focus-visible:ring-offset-0">
          Bio page
        </h1>
        <Link href="/help/link-in-bio" className="text-sm text-brand-link">How bio pages work</Link>
      </div>

      {page === undefined ? (
        error ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-destructive [overflow-wrap:anywhere]">Couldn&apos;t load your bio page. {errorText(error)}</p>
            <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()}>Retry</Button>
          </div>
        ) : (
          <div role="status" className="flex min-h-[40vh] items-center justify-center">
            <div aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
            <span className="sr-only">Loading…</span>
          </div>
        )
      ) : page === null ? (
        <CreateBioPage />
      ) : (
        <BioEditor page={page} headingRef={headingRef} />
      )}
    </div>
  )
}
