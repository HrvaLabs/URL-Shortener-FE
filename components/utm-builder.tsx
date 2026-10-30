"use client"

import { useId, useRef, useState } from "react"
import { flushSync } from "react-dom"
import Link from "next/link"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"
import { AnonymousLimitLine } from "@/components/anonymous-limit-line"
import { AnonymousNotice } from "@/components/anonymous-notice"
import { LinkResultNotes } from "@/components/link-result-notes"
import { CHECKING_LABEL, TurnstileCheck } from "@/components/turnstile-check"
import { UtmFields } from "@/components/utm-fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useAnonymousLinksPaused, usePublicSettings } from "@/lib/hooks/useSettings"
import { HUMAN_CHECK_REQUIRED, humanCheckEnabled, signupsPaused, type HumanCheckRefusal } from "@/lib/moderation"
import type { UrlResponse } from "@/lib/types"
import { useTurnstile } from "@/lib/hooks/useTurnstile"
import { useCreateUrl } from "@/lib/hooks/useUrls"
import { destinationLengthError, formatShortUrl } from "@/lib/utils"
import { destinationToSend, hasUtmValues, tooLongWithUtm, withScheme, type UtmValues } from "@/lib/utm"

function CopyLine({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Copy failed. Select the link and copy it manually.")
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 py-1.5 pl-3 pr-1.5">
      <span className="min-w-0 flex-1 font-mono text-sm [overflow-wrap:anywhere]">{text}</span>
      <Button type="button" variant="ghost" size="sm" className="shrink-0 gap-1.5" onClick={copy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
        <span className="sr-only"> {label}</span>
      </Button>
    </div>
  )
}

export function UtmBuilder() {
  const id = useId()
  const { user, isLoading: authLoading } = useAuth()
  const createUrl = useCreateUrl()
  const paused = useAnonymousLinksPaused()
  const { data: publicSettings } = usePublicSettings()
  const humanCheck = useTurnstile({ enabled: humanCheckEnabled(publicSettings, Boolean(user), authLoading) })
  const signupsClosed = signupsPaused(publicSettings)
  const [typed, setTyped] = useState("")
  const [utm, setUtm] = useState<UtmValues>({})
  const [open, setOpen] = useState(true)
  const [shortLink, setShortLink] = useState<{ destination: string; url: string; created: UrlResponse } | null>(null)
  const [refusal, setRefusal] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [checkRefusal, setCheckRefusal] = useState<HumanCheckRefusal | null>(null)
  const resultRef = useRef<HTMLParagraphElement>(null)
  const refusalRef = useRef<HTMLParagraphElement>(null)
  const lengthError = destinationLengthError(typed)
  const sent = typed.trim() ? destinationToSend(typed, open, utm) : null
  const tagged = sent === null ? null : withScheme(sent)
  const tooLong = tooLongWithUtm(typed, sent)
  const ready = Boolean(tagged) && !lengthError && !tooLong && open && hasUtmValues(utm)
  const shortFor = ready && shortLink?.destination === tagged ? shortLink.url : null

  const shorten = async () => {
    humanCheck.start()
    if (!ready || !tagged || createUrl.isPending || checking || refusal) return
    setCheckRefusal(null)
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
      const created = await createUrl.mutateAsync({ longUrl: tagged, humanCheckToken })
      flushSync(() => setShortLink({ destination: tagged, url: formatShortUrl(created.shortUrl), created }))
      resultRef.current?.focus()
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        flushSync(() => setRefusal(err.message))
        refusalRef.current?.focus()
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

  return (
    <div className="mt-8 rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-6">
      <Label htmlFor={`${id}-destination`}>Long URL</Label>
      <Input
        id={`${id}-destination`}
        type="text"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        placeholder="https://shop.example/sale"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        aria-describedby={lengthError ? `${id}-error` : undefined}
        className="mt-2 h-11"
      />
      {lengthError && <p id={`${id}-error`} className="mt-2 text-sm text-destructive">{lengthError}</p>}

      <div className="mt-5">
        <UtmFields destination={typed} value={utm} onChange={setUtm} open={open} onOpenChange={setOpen} variant="tool" />
      </div>

      <div className="mt-6 border-t pt-5">
        {ready && tagged ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Your tagged link</p>
              <CopyLine text={tagged} label="tagged link" />
            </div>
            {shortFor ? (
              <div className="space-y-2">
                <p ref={resultRef} tabIndex={-1} className="text-sm font-medium outline-hidden">Short link</p>
                <CopyLine text={shortFor} label="short link" />
                <p className="text-sm text-muted-foreground">
                  {user ? (
                    <>It&apos;s in your <Link href="/dashboard" className="text-brand-link">dashboard</Link>, with the tags shown on its analytics page.</>
                  ) : (
                    <>Links made without an account have no stats page.{!signupsClosed && <> <Link href="/register" className="text-brand-link">Sign up free</Link> to see clicks, referrers and the campaign tags.</>}</>
                  )}
                </p>
                {shortLink && <LinkResultNotes link={shortLink.created} signedIn={Boolean(user)} />}
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  {!paused && (
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground">Tagged links are long. Shorten it to share it.</p>
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
                      {checking ? CHECKING_LABEL : createUrl.isPending ? "Shortening..." : "Shorten it"}
                    </Button>
                  )}
                </div>
                <TurnstileCheck containerRef={humanCheck.containerRef} refusal={checkRefusal} ticking={checking && humanCheck.interactive} className="mt-3" />
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Type a long URL and at least a Source, and your tagged link appears here, ready to copy.
          </p>
        )}
      </div>
    </div>
  )
}
