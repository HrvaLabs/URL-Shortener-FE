import { Suspense } from "react"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Card } from "@/components/ui/card"
import { UnsubscribeContent } from "./content"

export default function UnsubscribePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-5 py-16 sm:py-24">
        <Card className="w-full max-w-md p-8">
          <Suspense fallback={<UnsubscribeFallback />}>
            <UnsubscribeContent />
          </Suspense>
        </Card>
      </main>
      <SiteFooter />
    </div>
  )
}

function UnsubscribeFallback() {
  return (
    <div role="status" className="flex flex-col items-center gap-4 py-4">
      <div aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      <span className="sr-only">Loading...</span>
    </div>
  )
}
