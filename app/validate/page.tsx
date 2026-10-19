"use client"

import { useState } from "react"
import { urlApi } from "@/lib/api-client"
import type { PeekUrl } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PageMeta } from "@/components/page-meta"
import { ExternalLink, Copy, Check, Search, Calendar, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { formatDate, formatShortUrl } from "@/lib/utils"

export default function ValidatePage() {
  const [shortCode, setShortCode] = useState("")
  const [data, setData] = useState<PeekUrl | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shortCode.trim()) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const result = await urlApi.peek(shortCode.trim())
      setData(result)
    } catch (err: any) {
      setError(err.message || "URL not found")
      setData(null)
    } finally {
      setLoading(false)
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
      <PageMeta title="Validate a short URL" description="Look up where a hrva.cc short URL redirects to. Enter a short code to check its destination." />
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-16 sm:py-24">
          <div className="mx-auto max-w-xl">
            <h1 className="font-display text-3xl sm:text-4xl">Validate a short URL</h1>
            <p className="mt-3 text-muted-foreground">Enter a short code to see where it redirects</p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-2 sm:flex-row">
              <Input
                aria-label="Short code"
                placeholder="Enter short code (e.g. abc123)"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                className="font-mono placeholder:font-sans sm:flex-1"
              />
              <Button type="submit" disabled={loading} className="shrink-0 gap-1.5">
                <Search className="h-4 w-4" />
                Lookup
              </Button>
            </form>

            <div className="mt-6">
              {loading && (
                <div className="space-y-3 rounded-xl border bg-card p-5">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              )}

              {error && searched && !loading && (
                <div className="rounded-xl border bg-card px-6 py-10 text-center">
                  <AlertCircle className="mx-auto h-5 w-5 text-destructive" />
                  <h2 className="mt-3 font-semibold">URL not found</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                </div>
              )}

              {data && !loading && (
                <div key={data.shortUrl} className="animate-result-in divide-y rounded-xl border bg-card">
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">Short URL</p>
                      <p className="mt-1 truncate font-mono text-[15px] font-medium text-brand">
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
                      <p className="mt-1 break-all font-mono text-sm">{data.longUrl}</p>
                    </div>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground">
                      <a href={data.longUrl} target="_blank" rel="noopener noreferrer" aria-label="Open destination">
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
                      <a href={data.longUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Visit URL
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {!searched && (
                <p className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                  Enter a short code above to check where it redirects
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
