"use client"

import Link from "next/link"
import { BarChart3, Copy, ExternalLink, QrCode } from "lucide-react"
import { toast } from "sonner"
import { QrCustomizer } from "@/components/qr-customizer"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { bioShareUrl, displayShareUrl } from "@/lib/bio"
import { getShortBaseUrl } from "@/lib/utils"

const NEW_TAB = <span className="sr-only"> (opens in a new tab)</span>

const VIEWS_LINK = (
  <Button asChild variant="outline" size="sm" className="gap-1.5">
    <Link href="/dashboard/analytics?view=bio">
      <BarChart3 className="h-4 w-4" aria-hidden />
      Views
    </Link>
  </Button>
)

export function ShareBar({ handle }: { handle: string | null }) {
  if (!handle) {
    return (
      <section aria-label="Share" className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">No address yet</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled className="gap-1.5">
            <Copy className="h-4 w-4" aria-hidden />
            Copy link
          </Button>
          <Button type="button" variant="outline" size="sm" disabled className="gap-1.5">
            <QrCode className="h-4 w-4" aria-hidden />
            QR code
          </Button>
          <Button type="button" variant="outline" size="sm" disabled className="gap-1.5">
            <ExternalLink className="h-4 w-4" aria-hidden />
            View page
          </Button>
          {VIEWS_LINK}
        </div>
      </section>
    )
  }

  const shortBase = getShortBaseUrl()
  const shareUrl = bioShareUrl(handle, shortBase)
  const shownUrl = displayShareUrl(handle, shortBase)
  const pagePath = `/bio/${handle}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Link copied")
    } catch {
      toast.error("Copy failed. Select the link and copy it manually.")
    }
  }

  return (
    <section aria-label="Share" className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:flex-row sm:items-center sm:justify-between">
      <a
        href={pagePath}
        target="_blank"
        rel="noopener"
        className="min-w-0 rounded-sm font-mono text-base font-medium text-brand underline-offset-4 [overflow-wrap:anywhere] hover:underline"
      >
        {shownUrl}
        {NEW_TAB}
      </a>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
          <Copy className="h-4 w-4" aria-hidden />
          Copy link
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <QrCode className="h-4 w-4" aria-hidden />
              QR code
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="pr-6 leading-snug [overflow-wrap:anywhere]">QR code for {shownUrl}</DialogTitle>
            </DialogHeader>
            <QrCustomizer value={shareUrl} filename={`${handle}-bio-qr`} />
          </DialogContent>
        </Dialog>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <a href={pagePath} target="_blank" rel="noopener">
            <ExternalLink className="h-4 w-4" aria-hidden />
            View page
            {NEW_TAB}
          </a>
        </Button>
        {VIEWS_LINK}
      </div>
    </section>
  )
}
