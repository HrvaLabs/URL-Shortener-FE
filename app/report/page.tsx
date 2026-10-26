"use client"

import { Suspense, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { useSearchParams } from "next/navigation"
import { ApiError, REQUEST_FAILED, reportApi } from "@/lib/api-client"
import { handleFormatError, normalizeHandle } from "@/lib/bio"
import type { ReportCategory } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { cn, getShortBaseUrl } from "@/lib/utils"

const DETAILS_LIMIT = 500
const SHORT_CODE = /^[a-zA-Z0-9_-]{1,32}$/
const SEND_FAILED = "Couldn't send the report. Try again, or email abuse@hrva.cc."
const SCHEME = /^https?:\/\//i
const SHORT_HOST = getShortBaseUrl().replace(SCHEME, "").replace(/\/+$/, "").toLowerCase()
const BIO_PATH = "bio/"
const TARGET_INVALID = "Enter a hrva.cc short link or bio page, like hrva.cc/abc or hrva.cc/@name."

const categories: { value: ReportCategory; label: string }[] = [
  { value: "PHISHING", label: "Phishing" },
  { value: "MALWARE", label: "Malware" },
  { value: "SPAM", label: "Spam" },
  { value: "IMPERSONATION", label: "Pretends to be someone" },
  { value: "OTHER", label: "Something else" },
]

const selectClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[border-color,box-shadow] duration-150 focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0"

type ReportStatus = { kind: "idle" } | { kind: "sent" } | { kind: "failed"; message: string }

type ReportTarget = { kind: "link"; code: string } | { kind: "bio"; handle: string }

function frontendHost() {
  return typeof window === "undefined" ? "" : window.location.host.toLowerCase()
}

function pathOf(link: string) {
  return link.replace(/[?#].*$/, "").replace(/^\/+|\/+$/g, "")
}

function bioTarget(raw: string): ReportTarget | null {
  const handle = normalizeHandle(raw)
  return handleFormatError(handle) === null ? { kind: "bio", handle } : null
}

function targetOf(path: string, { shortCodes }: { shortCodes: boolean }): ReportTarget | null {
  if (path.startsWith("@")) return bioTarget(path)
  if (path.startsWith(BIO_PATH)) return bioTarget(path.slice(BIO_PATH.length))
  return shortCodes && SHORT_CODE.test(path) ? { kind: "link", code: path } : null
}

function toReportTarget(input: string): ReportTarget | null {
  const link = input.trim().replace(SCHEME, "").replace(/^www\./i, "")
  const lower = link.toLowerCase()
  const onHost = (host: string) => host !== "" && (lower === host || lower.startsWith(`${host}/`))
  if (onHost(SHORT_HOST)) return targetOf(pathOf(link.slice(SHORT_HOST.length)), { shortCodes: true })
  const appHost = frontendHost()
  if (onHost(appHost)) return targetOf(pathOf(link.slice(appHost.length)), { shortCodes: false })
  return targetOf(pathOf(link), { shortCodes: true })
}

function refusedMessage(error: unknown) {
  return error instanceof ApiError && error.message !== REQUEST_FAILED ? error.message : null
}

function failureMessage(error: unknown) {
  if (error instanceof ApiError && (error.status === 400 || error.status === 429)) return refusedMessage(error) ?? SEND_FAILED
  return SEND_FAILED
}

function ReportForm({ initialShort }: { initialShort: string }) {
  const [reportsBioPage] = useState(() => toReportTarget(initialShort)?.kind === "bio")
  const [shortLink, setShortLink] = useState(initialShort)
  const [category, setCategory] = useState<ReportCategory | "">("")
  const [details, setDetails] = useState("")
  const [linkError, setLinkError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<ReportStatus>({ kind: "idle" })
  const linkInput = useRef<HTMLInputElement>(null)
  const submitting = useRef(false)
  const typedBioPage = toReportTarget(shortLink)?.kind === "bio"

  const refuseLink = (message: string) => {
    flushSync(() => {
      setLinkError(message)
      setStatus({ kind: "idle" })
    })
    linkInput.current?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting.current) return
    const target = toReportTarget(shortLink)
    if (!target) {
      refuseLink(TARGET_INVALID)
      return
    }
    if (!category) return
    const shortUrl = target.kind === "bio" ? `@${target.handle}` : target.code
    submitting.current = true
    setLinkError(null)
    setStatus({ kind: "idle" })
    setSending(true)
    try {
      await reportApi.report({ shortUrl, category, details: details.trim() || undefined })
      setShortLink("")
      setCategory("")
      setDetails("")
      setStatus({ kind: "sent" })
    } catch (error) {
      const refused = error instanceof ApiError && error.status === 400 ? refusedMessage(error) : null
      if (refused?.startsWith("Enter a hrva.cc")) refuseLink(TARGET_INVALID)
      else setStatus({ kind: "failed", message: failureMessage(error) })
    } finally {
      submitting.current = false
      setSending(false)
    }
  }

  return (
    <>
      <h1 className="font-display text-3xl sm:text-4xl">{reportsBioPage ? "Report a bio page" : "Report a link"}</h1>
      <p className="mt-3 text-muted-foreground">
        Tell us about a hrva.cc link or bio page used for phishing, malware, spam, impersonation or other abuse. You can also email{" "}
        <a href="mailto:abuse@hrva.cc" className="text-brand hover:underline">
          abuse@hrva.cc
        </a>
        .
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-xl border bg-card p-6">
        <div>
          <Label htmlFor="short-link">Short link or bio page</Label>
          <Input
            ref={linkInput}
            id="short-link"
            placeholder="hrva.cc/abc or hrva.cc/@name"
            value={shortLink}
            onChange={(e) => {
              setShortLink(e.target.value)
              setLinkError(null)
            }}
            required
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={linkError ? true : undefined}
            aria-describedby={linkError ? "short-link-error" : undefined}
            className="mt-2 font-mono placeholder:font-sans"
          />
          {linkError && (
            <p id="short-link-error" className="mt-1.5 text-sm text-destructive">
              {linkError}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="category">What&apos;s wrong with it?</Label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ReportCategory | "")}
            required
            className={cn(selectClass, "mt-2", !category && "text-muted-foreground")}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((option) => (
              <option key={option.value} value={option.value} className="text-foreground">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="details">Details (optional)</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {details.length}/{DETAILS_LIMIT}
            </span>
          </div>
          <Textarea
            id="details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={DETAILS_LIMIT}
            rows={4}
            placeholder={typedBioPage ? "Which link on the page, and what's wrong with it?" : "Where did you see the link, and what did the page ask for?"}
            className="mt-2"
          />
        </div>

        <div>
          <Button
            type="submit"
            aria-disabled={sending}
            aria-busy={sending}
            className="w-full aria-disabled:pointer-events-none aria-disabled:opacity-50 sm:w-auto"
          >
            {sending ? "Sending…" : "Send"}
          </Button>
          <div aria-live="polite">
            {status.kind === "sent" && (
              <p className="mt-4 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">Thanks. We&apos;ll take a look.</p>
            )}
            {status.kind === "failed" && (
              <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{status.message}</p>
            )}
          </div>
        </div>
      </form>
    </>
  )
}

function ReportFormFromQuery() {
  const searchParams = useSearchParams()
  return <ReportForm initialShort={searchParams.get("s")?.trim() ?? ""} />
}

export default function ReportPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-16 sm:py-24">
          <div className="mx-auto max-w-xl">
            <Suspense fallback={<ReportForm initialShort="" />}>
              <ReportFormFromQuery />
            </Suspense>

            <p className="mt-4 text-sm text-muted-foreground">
              Reports go to a person for review. Nothing is blocked automatically.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
