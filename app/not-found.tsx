import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you are looking for does not exist or has been moved.",
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-5 py-24">
        <div className="text-center">
          <p className="font-mono text-sm text-muted-foreground">404</p>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">Page not found</h1>
          <p className="mt-3 text-muted-foreground">This page doesn&apos;t exist or has been moved.</p>
          <Button asChild className="mt-8">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
