import { Suspense } from "react"
import type { Metadata } from "next"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { noIndex } from "@/lib/seo"
import { ShareContent, ShareLoading } from "./content"

export const metadata: Metadata = noIndex("Shorten a shared link")

export default function SharePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container py-10 sm:py-14">
          <div className="mx-auto max-w-2xl">
            <h1 className="font-display text-3xl sm:text-4xl">Shorten a shared link</h1>
            <div className="mt-8 rounded-xl border bg-card p-5 sm:p-6">
              <Suspense fallback={<ShareLoading />}>
                <ShareContent />
              </Suspense>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
