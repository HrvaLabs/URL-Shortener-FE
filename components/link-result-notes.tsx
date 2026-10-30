import Link from "next/link"
import { WARNING_PAGE_NOTE, linkEndsText } from "@/lib/moderation"
import type { UrlResponse } from "@/lib/types"
import { cn } from "@/lib/utils"

const linkClass = "text-brand-link"

export function LinkResultNotes({ link, signedIn, className }: { link: Pick<UrlResponse, "expirationDate" | "visitLimit" | "warningPage">; signedIn: boolean; className?: string }) {
  const ends = signedIn ? null : linkEndsText(link.expirationDate, link.visitLimit)
  if (!ends && !link.warningPage) return null
  return (
    <div className={cn("space-y-1 text-left text-sm text-muted-foreground [overflow-wrap:anywhere]", className)}>
      {ends && <p>{ends}</p>}
      {link.warningPage && (
        <p>
          {WARNING_PAGE_NOTE}{" "}
          <Link href="/help/links-without-an-account#warning-page" className={linkClass}>About the warning page</Link>.
        </p>
      )}
    </div>
  )
}
