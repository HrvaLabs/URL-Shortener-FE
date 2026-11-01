"use client"

import { useEffect } from "react"
import { ErrorFallback } from "@/components/error-fallback"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { reloadIfStaleChunkError } from "@/lib/stale-chunk"

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
    reloadIfStaleChunkError(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col">
      <title>Something went wrong — hrva.cc</title>
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-24">
        <ErrorFallback error={error} retry={retry} />
      </main>
    </div>
  )
}
