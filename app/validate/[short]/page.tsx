"use client"

import { use, useState, useEffect } from "react"
import { urlApi } from "@/lib/api-client"
import type { PeekUrl } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ExternalLink, Copy, Check, AlertCircle, ArrowLeft, Calendar, Search } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { formatDate, formatShortUrl } from "@/lib/utils"

export default function ValidateByShortPage({ params }: { params: Promise<{ short: string }> }) {
  const { short } = use(params)
  const [data, setData] = useState<PeekUrl | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<PeekUrl | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    if (!short) return
    urlApi.peek(short)
      .then(setData)
      .catch((err) => setError(err.message || "URL not found"))
      .finally(() => setLoading(false))
  }, [short])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchInput.trim()) return
    setSearchLoading(true)
    setSearchError(null)
    setSearchResult(null)
    try {
      const result = await urlApi.peek(searchInput.trim())
      setSearchResult(result)
    } catch (err: unknown) {
      setSearchError((err instanceof Error && err.message) || "URL not found")
    } finally {
      setSearchLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Copied!")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-16 sm:py-24">
          <div className="mx-auto max-w-xl">
            <Link
              href="/validate"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
            <h1 className="mt-4 font-display text-3xl sm:text-4xl">Validate URL</h1>
            <p className="mt-3 text-muted-foreground">
              Look up where the short URL{" "}
              <span className="break-all font-mono text-[0.92em] text-foreground">{formatShortUrl(short).replace(/^https?:\/\//, "")}</span>{" "}
              redirects to.
            </p>

            <form onSubmit={handleSearch} className="mt-8 flex flex-col gap-2 sm:flex-row">
              <Input
                aria-label="Short code"
                placeholder="Look up another short code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="font-mono placeholder:font-sans sm:flex-1"
              />
              <Button type="submit" disabled={searchLoading} className="shrink-0 gap-1.5">
                <Search className="h-4 w-4" />
                Lookup
              </Button>
            </form>

            {searchLoading && <Skeleton className="mt-4 h-12 w-full rounded-xl" />}
            {searchError && <p className="mt-4 text-sm text-destructive">{searchError}</p>}
            {searchResult && (
              <div className="animate-result-in mt-4 flex items-start gap-3 rounded-xl border bg-card px-4 py-3 text-sm">
                <span className="shrink-0 font-mono font-medium text-brand">/{searchResult.shortUrl}</span>
                <span className="min-w-0 break-all font-mono text-muted-foreground">{searchResult.longUrl ?? "Password protected"}</span>
              </div>
            )}

            <div className="mt-6">
              {loading ? (
                <div className="space-y-3 rounded-xl border bg-card p-5">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ) : error ? (
                <div className="rounded-xl border bg-card px-6 py-10 text-center">
                  <AlertCircle className="mx-auto h-5 w-5 text-destructive" />
                  <h2 className="mt-3 font-semibold">URL not found</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                  <Button asChild variant="outline" size="sm" className="mt-5">
                    <Link href="/">Shorten a URL</Link>
                  </Button>
                </div>
              ) : data ? (
                <div className="animate-result-in divide-y rounded-xl border bg-card">
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">Short URL</p>
                      <p className="mt-1 break-all font-mono text-[15px] font-medium text-brand">
                        {formatShortUrl(data.shortUrl).replace(/^https?:\/\//, "")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(formatShortUrl(data.shortUrl))}
                      aria-label="Copy short URL"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex items-start gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">Redirects to</p>
                      <p className="mt-1 break-all font-mono text-sm">{data.longUrl ?? "Password protected. The destination shows after the password is entered."}</p>
                    </div>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground">
                      <a href={data.longUrl ?? formatShortUrl(data.shortUrl)} target="_blank" rel="noopener noreferrer" aria-label="Open destination">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Created: {formatDate(data.createDate)}
                    </p>
                    <Button asChild size="sm" className="gap-1.5">
                      <a href={data.longUrl ?? formatShortUrl(data.shortUrl)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Visit URL
                      </a>
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
