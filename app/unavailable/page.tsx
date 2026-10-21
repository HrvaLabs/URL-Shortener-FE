"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Link2Off } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PageMeta } from "@/components/page-meta"
import { formatShortUrl } from "@/lib/utils"

const missingMessage = "There's no hrva.cc link with this name."

const reasonMessages = new Map([
  ["blocked", "hrva.cc disabled this link because it led to a site reported for phishing, malware or scams."],
  ["expired", "This link has expired."],
  ["limit", "This link has reached its visit limit."],
  ["inactive", "Its owner has turned this link off."],
  ["missing", missingMessage],
])

function UnavailableShell({ short, message }: { short: string; message: string }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PageMeta title="Link unavailable — hrva.cc" />
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-5 py-24">
        <div className="max-w-xl text-center">
          <Link2Off className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 font-display text-3xl sm:text-4xl">This link isn&apos;t available</h1>
          {short && (
            <p className="mt-4 break-all font-mono text-[15px] font-medium text-brand">
              {formatShortUrl(short).replace(/^https?:\/\//, "")}
            </p>
          )}
          {message && <p className="mt-3 text-muted-foreground">{message}</p>}
          <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href={short ? `/report?s=${encodeURIComponent(short)}` : "/report"}>Report a link</Link>
            </Button>
            <Button asChild>
              <Link href="/">Go to hrva.cc</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function UnavailableContent() {
  const searchParams = useSearchParams()
  const short = searchParams.get("s")?.trim() ?? ""
  const message = reasonMessages.get(searchParams.get("reason") ?? "") ?? missingMessage
  return <UnavailableShell short={short} message={message} />
}

export default function UnavailablePage() {
  return (
    <Suspense fallback={<UnavailableShell short="" message="" />}>
      <UnavailableContent />
    </Suspense>
  )
}
