"use client"

import { useId, useRef, useState } from "react"
import { flushSync } from "react-dom"
import Link from "next/link"
import { Check, Copy, QrCode } from "lucide-react"
import { toast } from "sonner"
import { AnonymousLimitLine } from "@/components/anonymous-limit-line"
import { AnonymousNotice } from "@/components/anonymous-notice"
import { CHECKING_LABEL, TurnstileCheck } from "@/components/turnstile-check"
import { QrCustomizer } from "@/components/qr-customizer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useAnonymousLinksPaused, usePublicSettings } from "@/lib/hooks/useSettings"
import { HUMAN_CHECK_REQUIRED, humanCheckEnabled, signupsPaused } from "@/lib/moderation"
import { useTurnstile } from "@/lib/hooks/useTurnstile"
import { useCreateUrl } from "@/lib/hooks/useUrls"
import { destinationLengthError, formatShortUrl } from "@/lib/utils"
import { withScheme } from "@/lib/utm"

const fileNameFor = (address: string): string => {
  try {
    return `qr-${new URL(address).hostname.replace(/^www\./, "")}`
  } catch {
    return "qr-code"
  }
}

export function QrGenerator() {
  const id = useId()
  const { user, isLoading: authLoading } = useAuth()
  const createUrl = useCreateUrl()
  const paused = useAnonymousLinksPaused()
  const { data: publicSettings } = usePublicSettings()
  const humanCheck = useTurnstile({ enabled: humanCheckEnabled(publicSettings, Boolean(user), authLoading) })
  const signupsClosed = signupsPaused(publicSettings)
  const [typed, setTyped] = useState("")
  const [shortLink, setShortLink] = useState<{ destination: string; url: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [refusal, setRefusal] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [checkMissing, setCheckMissing] = useState(false)
  const resultRef = useRef<HTMLParagraphElement>(null)
  const refusalRef = useRef<HTMLParagraphElement>(null)
  const address = withScheme(typed)
  const lengthError = destinationLengthError(typed)
  const useShort = shortLink !== null && shortLink.destination === address
  const value = useShort ? shortLink.url : address

  const shorten = async () => {
    humanCheck.start()
    if (!address || lengthError || createUrl.isPending || checking || refusal) return
    setCheckMissing(false)
    let humanCheckToken: string | null = null
    if (humanCheck.active) {
      setChecking(true)
      humanCheckToken = await humanCheck.waitForToken()
      setChecking(false)
      if (!humanCheckToken) {
        humanCheck.reset()
        setCheckMissing(true)
        return
      }
    }
    try {
      const created = await createUrl.mutateAsync({ longUrl: address, humanCheckToken })
      flushSync(() => {
        setShortLink({ destination: address, url: formatShortUrl(created.shortUrl) })
        setCopied(false)
      })
      resultRef.current?.focus()
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        flushSync(() => setRefusal(err.message))
        refusalRef.current?.focus()
        return
      }
      if (err instanceof ApiError && err.message === HUMAN_CHECK_REQUIRED) {
        setCheckMissing(true)
        return
      }
      toast.error(err instanceof Error && err.message ? err.message : "Could not shorten that URL. Check it and try again.")
    } finally {
      humanCheck.reset()
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Copy failed. Select the link and copy it manually.")
    }
  }

  return (
    <div className="mt-8 rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-6">
      <Label htmlFor={`${id}-address`}>Address</Label>
      <Input
        id={`${id}-address`}
        type="text"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        placeholder="https://example.com/menu"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        aria-describedby={lengthError ? `${id}-error` : undefined}
        className="mt-2 h-11"
      />
      {lengthError && <p id={`${id}-error`} className="mt-2 text-sm text-destructive">{lengthError}</p>}

      <div className="mx-auto mt-6 max-w-md">
        {value && !lengthError ? (
          <QrCustomizer value={value} filename={fileNameFor(address)} marker={useShort} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">
            <QrCode aria-hidden="true" className="h-10 w-10" />
            Type an address above and its QR code appears here.
          </div>
        )}
      </div>

      {address && !lengthError && (
        <div className="mt-6 border-t pt-5">
          {useShort ? (
            <div className="space-y-2 text-sm">
              <p ref={resultRef} tabIndex={-1} className="font-medium outline-hidden">The code now opens your short link:</p>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 py-1.5 pl-3 pr-1.5">
                <span className="min-w-0 flex-1 font-mono [overflow-wrap:anywhere]">{shortLink.url}</span>
                <Button type="button" variant="ghost" size="sm" className="shrink-0 gap-1.5" onClick={() => copy(shortLink.url)}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-muted-foreground">
                {user ? (
                  <>Its scans show as QR scans in the link&apos;s stats on your <Link href="/dashboard" className="text-brand-link">dashboard</Link>.</>
                ) : (
                  <>Links made without an account have no stats page.{!signupsClosed && <> <Link href="/register" className="text-brand-link">Sign up free</Link> first to see scans counted.</>}</>
                )}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                {!paused && (
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground">
                      A hrva.cc short link makes a simpler code, and with an account you can see how often it is scanned.
                    </p>
                    <AnonymousLimitLine />
                  </div>
                )}
                {paused ? (
                  <AnonymousNotice className="w-full" />
                ) : refusal ? (
                  <p ref={refusalRef} tabIndex={-1} role="alert" className="text-foreground outline-hidden">{refusal}</p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={shorten}
                    onFocus={humanCheck.start}
                    aria-disabled={createUrl.isPending || checking}
                    aria-busy={createUrl.isPending || checking}
                    className="shrink-0"
                  >
                    {checking ? CHECKING_LABEL : createUrl.isPending ? "Shortening..." : "Use a short link"}
                  </Button>
                )}
              </div>
              <TurnstileCheck containerRef={humanCheck.containerRef} missing={checkMissing} ticking={checking && humanCheck.interactive} className="mt-3" />
            </>
          )}
        </div>
      )}
    </div>
  )
}
