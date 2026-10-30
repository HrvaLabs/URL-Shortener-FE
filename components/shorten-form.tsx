"use client"

import { useEffect, useId, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { QRCodeSVG } from "qrcode.react"
import { Check, Copy, ExternalLink, Link2 } from "lucide-react"
import { toast } from "sonner"
import { DomainPicker } from "@/components/domains/domain-picker"
import { AnonymousLimitLine } from "@/components/anonymous-limit-line"
import { AnonymousNotice } from "@/components/anonymous-notice"
import { LinkResultNotes } from "@/components/link-result-notes"
import { CHECKING_LABEL, TurnstileCheck } from "@/components/turnstile-check"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UtmFields } from "@/components/utm-fields"
import { ApiError } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useAnonymousLinksPaused, usePublicSettings } from "@/lib/hooks/useSettings"
import { useTurnstile } from "@/lib/hooks/useTurnstile"
import { useCreateUrl } from "@/lib/hooks/useUrls"
import { ALIASES_PAUSED, HUMAN_CHECK_REQUIRED, aliasFieldShown, humanCheckEnabled, type HumanCheckRefusal } from "@/lib/moderation"
import type { UrlResponse } from "@/lib/types"
import { cn, destinationLengthError, formatShortUrl, shortHostOf, withQrMarker } from "@/lib/utils"
import { CANT_TAKE_UTM, destinationToSend, rememberUtm, tooLongMessage, tooLongWithUtm, type UtmValues } from "@/lib/utm"

interface ShortenFormProps {
  initialUrl?: string
  withOptions?: boolean
  size?: "default" | "lg"
  className?: string
}

export function ShortenForm({ initialUrl = "", withOptions = false, size = "default", className }: ShortenFormProps) {
  const [longUrl, setLongUrl] = useState(initialUrl)
  const [customAlias, setCustomAlias] = useState("")
  const [domain, setDomain] = useState<string | null>(null)
  const [domainError, setDomainError] = useState<string | null>(null)
  const [visitLimit, setVisitLimit] = useState("")
  const [expirationDate, setExpirationDate] = useState("")
  const [utm, setUtm] = useState<UtmValues>({})
  const [utmOpen, setUtmOpen] = useState(false)
  const [result, setResult] = useState<UrlResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkRefusal, setCheckRefusal] = useState<HumanCheckRefusal | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLButtonElement>(null)

  const { user, isLoading: authLoading } = useAuth()
  const createUrl = useCreateUrl()
  const paused = useAnonymousLinksPaused()
  const { data: publicSettings } = usePublicSettings()
  const humanCheck = useTurnstile({ enabled: humanCheckEnabled(publicSettings, Boolean(user), authLoading) })
  const showUtm = withOptions && Boolean(user)
  const showDomains = withOptions && Boolean(user)
  const pickedDomain = showDomains ? domain : null
  const showAlias = aliasFieldShown(publicSettings, pickedDomain)
  const tagging = showUtm && utmOpen
  const isLarge = size === "lg"
  const longUrlError = destinationLengthError(longUrl)
  const longUrlErrorId = useId()
  const domainPickerId = useId()
  const noticeId = useId()
  const longUrlDescription = [paused ? noticeId : null, longUrlError ? longUrlErrorId : null].filter(Boolean).join(" ") || undefined

  useEffect(() => {
    if (!result) return
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    resultRef.current?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" })
    copyRef.current?.focus({ preventScroll: true })
  }, [result])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (paused || checking || createUrl.isPending || !longUrl || longUrlError) return

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
    setDomainError(null)
    setCheckRefusal(null)

    humanCheck.start()
    let humanCheckToken: string | null = null
    if (humanCheck.active) {
      setChecking(true)
      humanCheckToken = await humanCheck.waitForToken()
      setChecking(false)
      if (!humanCheckToken) {
        setCheckRefusal(humanCheck.refusal(true))
        humanCheck.reset()
        return
      }
    }

    try {
      const url = await createUrl.mutateAsync({
        longUrl: destination,
        shortUrl: showAlias ? customAlias || undefined : undefined,
        visitLimit: visitLimit ? parseInt(visitLimit) : undefined,
        expirationDate: expDate,
        domain: pickedDomain || undefined,
        humanCheckToken,
      })
      if (tagging) rememberUtm(utm)
      setUtm({})
      setUtmOpen(false)
      setResult(url)
      setCopied(false)
      toast.success("Link shortened")
    } catch (err) {
      if (pickedDomain !== null && err instanceof ApiError && err.fields.domain) {
        const message = err.fields.domain
        flushSync(() => setDomainError(message))
        document.getElementById(domainPickerId)?.focus()
        return
      }
      if (err instanceof ApiError && err.message === HUMAN_CHECK_REQUIRED) {
        setCheckRefusal(humanCheck.refusal(humanCheckToken !== null))
        return
      }
      toast.error(err instanceof Error && err.message ? err.message : "Could not shorten that URL. Check it and try again.")
    } finally {
      humanCheck.reset()
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

  const shortUrl = result ? formatShortUrl(result.shortUrl, result.domain?.hostname) : ""

  return (
    <div className={cn("w-full", className)}>
      {paused && <AnonymousNotice id={noticeId} className="mb-4" />}
      <form onSubmit={handleSubmit} onFocus={humanCheck.start} onInput={humanCheck.start} className="space-y-4">
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
                aria-describedby={longUrlDescription}
                aria-disabled={paused || undefined}
                readOnly={paused}
                className={cn(isLarge ? "h-14 rounded-xl pl-12 text-base" : "h-11 pl-9", paused && "cursor-not-allowed opacity-60")}
                required={!paused}
              />
            </div>
            <Button
              type="submit"
              aria-disabled={paused || checking || createUrl.isPending || undefined}
              aria-busy={checking || createUrl.isPending || undefined}
              aria-describedby={paused ? noticeId : undefined}
              className={cn("shrink-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50", isLarge ? "h-14 rounded-xl px-7 text-base" : "h-11 px-5")}
            >
              {checking ? CHECKING_LABEL : createUrl.isPending ? "Shortening…" : "Shorten"}
            </Button>
          </div>
          {longUrlError && <p id={longUrlErrorId} className="mt-2 text-left text-sm text-destructive">{longUrlError}</p>}
          <TurnstileCheck containerRef={humanCheck.containerRef} refusal={checkRefusal} ticking={checking && humanCheck.interactive} className="mt-2" />
        </div>

        {showDomains && (
          <div className="sm:max-w-sm">
            <DomainPicker id={domainPickerId} value={domain} onChange={(picked) => { setDomain(picked); setDomainError(null) }} error={domainError} variant="form" />
          </div>
        )}

        {withOptions && (
          <div className={cn("grid grid-cols-1 gap-3", showAlias ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
            {!showAlias && <p className="text-xs text-muted-foreground [overflow-wrap:anywhere] sm:col-span-2">{ALIASES_PAUSED}</p>}
            {showAlias && (
              <div>
                <Label htmlFor="alias" className="text-xs text-muted-foreground">Custom alias</Label>
                <div className="mt-1.5 flex min-h-9 overflow-hidden rounded-lg border border-input bg-background shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15">
                  <span className="flex min-w-0 max-w-[60%] select-none items-center border-r bg-muted/60 px-2.5 py-2 text-xs text-muted-foreground [overflow-wrap:anywhere]">{shortHostOf(pickedDomain)}/</span>
                  <input
                    id="alias"
                    placeholder="my-link"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent px-2.5 font-mono text-sm outline-hidden placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            )}
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

      <AnonymousLimitLine className="mt-3" />

      {result && (
        <div
          key={shortUrl}
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
          <LinkResultNotes link={result} signedIn={Boolean(user)} className="basis-full" />
        </div>
      )}
    </div>
  )
}
