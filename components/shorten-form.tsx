"use client"

import { useEffect, useId, useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Check, Copy, ExternalLink, Link2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UtmFields } from "@/components/utm-fields"
import { useAuth } from "@/lib/auth-context"
import { useCreateUrl } from "@/lib/hooks/useUrls"
import type { UrlResponse } from "@/lib/types"
import { cn, destinationLengthError, formatShortUrl, getShortBaseUrl, withQrMarker } from "@/lib/utils"
import { CANT_TAKE_UTM, destinationToSend, rememberUtm, tooLongMessage, tooLongWithUtm, type UtmValues } from "@/lib/utm"

interface ShortenFormProps {
  withOptions?: boolean
  size?: "default" | "lg"
  className?: string
}

export function ShortenForm({ withOptions = false, size = "default", className }: ShortenFormProps) {
  const [longUrl, setLongUrl] = useState("")
  const [customAlias, setCustomAlias] = useState("")
  const [visitLimit, setVisitLimit] = useState("")
  const [expirationDate, setExpirationDate] = useState("")
  const [utm, setUtm] = useState<UtmValues>({})
  const [utmOpen, setUtmOpen] = useState(false)
  const [result, setResult] = useState<UrlResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLButtonElement>(null)

  const { user } = useAuth()
  const createUrl = useCreateUrl()
  const showUtm = withOptions && Boolean(user)
  const tagging = showUtm && utmOpen
  const isLarge = size === "lg"
  const shortBase = getShortBaseUrl().replace(/^https?:\/\//, "")
  const longUrlError = destinationLengthError(longUrl)
  const longUrlErrorId = useId()

  useEffect(() => {
    if (!result) return
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    resultRef.current?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" })
    copyRef.current?.focus({ preventScroll: true })
  }, [result])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!longUrl || longUrlError) return

    const destination = destinationToSend(longUrl, tagging, utm)
    if (destination === null) {
      toast.error(`${CANT_TAKE_UTM} Collapse Campaign tracking (UTM) to save it as typed.`)
      return
    }
    if (tooLongWithUtm(longUrl, destination)) {
      toast.error(tooLongMessage("long URL"))
      return
    }
    const expDate = expirationDate ? new Date(expirationDate).toISOString() : undefined

    try {
      const url = await createUrl.mutateAsync({
        longUrl: destination,
        shortUrl: customAlias || undefined,
        visitLimit: visitLimit ? parseInt(visitLimit) : undefined,
        expirationDate: expDate,
      })
      if (tagging) rememberUtm(utm)
      setUtm({})
      setUtmOpen(false)
      setResult(url)
      setCopied(false)
      toast.success("Link shortened")
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Could not shorten that URL. Check it and try again.")
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Copy failed. Select the link and copy it manually.")
    }
  }

  const shortUrl = result ? formatShortUrl(result.shortUrl) : ""

  return (
    <div className={cn("w-full", className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Link2
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
                  isLarge ? "left-4 h-5 w-5" : "left-3 h-4 w-4",
                )}
              />
              <Input
                type="text"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                aria-label="Long URL"
                placeholder="https://example.com/a-very-long-link"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                aria-invalid={!!longUrlError}
                aria-describedby={longUrlError ? longUrlErrorId : undefined}
                className={cn(isLarge ? "h-14 rounded-xl pl-12 text-base" : "h-11 pl-9")}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={createUrl.isPending}
              className={cn("shrink-0", isLarge ? "h-14 rounded-xl px-7 text-base" : "h-11 px-5")}
            >
              {createUrl.isPending ? "Shortening…" : "Shorten"}
            </Button>
          </div>
          {longUrlError && <p id={longUrlErrorId} className="mt-2 text-left text-sm text-destructive">{longUrlError}</p>}
        </div>

        {withOptions && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="alias" className="text-xs text-muted-foreground">Custom alias</Label>
              <div className="mt-1.5 flex h-9 items-center overflow-hidden rounded-lg border border-input bg-background shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15">
                <span className="select-none border-r bg-muted/60 px-2.5 py-2 text-xs text-muted-foreground">{shortBase}/</span>
                <input
                  id="alias"
                  placeholder="my-link"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent px-2.5 font-mono text-sm outline-hidden placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="visit-limit" className="text-xs text-muted-foreground">Visit limit</Label>
              <Input id="visit-limit" type="number" min={1} placeholder="No limit" value={visitLimit} onChange={(e) => setVisitLimit(e.target.value)} className="mt-1.5 h-9" />
            </div>
            <div>
              <Label htmlFor="expires" className="text-xs text-muted-foreground">Expires</Label>
              <Input id="expires" type="datetime-local" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className={cn("mt-1.5 h-9", !expirationDate && "text-muted-foreground")} />
            </div>
          </div>
        )}

        {showUtm && (
          <div className="border-t pt-3">
            <UtmFields destination={longUrl} value={utm} onChange={setUtm} open={utmOpen} onOpenChange={setUtmOpen} />
          </div>
        )}
      </form>

      {result && (
        <div
          key={result.shortUrl}
          ref={resultRef}
          className="animate-result-in mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border bg-card p-3 pr-4 text-left shadow-[0_8px_24px_-12px_rgb(0_0_0/0.15)]"
          aria-live="polite"
        >
          <div className="hidden shrink-0 rounded-lg border bg-white p-1.5 sm:block">
            <QRCodeSVG value={withQrMarker(shortUrl)} size={64} fgColor="#0e0e11" bgColor="#ffffff" level="M" />
          </div>
          <div className="min-w-0 flex-1 basis-56">
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block break-all font-mono text-base font-medium text-brand hover:underline"
            >
              {shortUrl.replace(/^https?:\/\//, "")}
            </a>
            <p className="mt-0.5 break-all text-sm text-muted-foreground">{result.longUrl}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              ref={copyRef}
              type="button"
              size="sm"
              onClick={() => copyToClipboard(shortUrl)}
              className={cn("gap-1.5", copied && "animate-copy-pulse")}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button asChild type="button" size="icon" variant="outline" className="h-9 w-9">
              <a href={result.longUrl} target="_blank" rel="noopener noreferrer" aria-label="Open destination">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
