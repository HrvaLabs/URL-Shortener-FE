"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ApiError, reportApi } from "@/lib/api-client"
import type { ReportCategory } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { cn } from "@/lib/utils"

const DETAILS_LIMIT = 500
const SHORT_CODE = /^[a-zA-Z0-9_-]+$/
const SEND_FAILED = "Couldn't send the report. Try again, or email abuse@hrva.cc."

const categories: { value: ReportCategory; label: string }[] = [
  { value: "PHISHING", label: "Phishing" },
  { value: "MALWARE", label: "Malware" },
  { value: "SPAM", label: "Spam" },
  { value: "OTHER", label: "Something else" },
]

const selectClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[border-color,box-shadow] duration-150 focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0"

type ReportStatus = { kind: "idle" } | { kind: "sent" } | { kind: "failed"; message: string }

function toShortCode(input: string) {
  return input
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?hrva\.cc(?=\/|$)/i, "")
    .replace(/[?#].*$/, "")
    .replace(/^\/+|\/+$/g, "")
}

function failureMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 429 && error.message !== "Request failed") return error.message
  return SEND_FAILED
}

function ReportForm({ initialShort }: { initialShort: string }) {
  const [shortLink, setShortLink] = useState(initialShort)
  const [category, setCategory] = useState<ReportCategory | "">("")
  const [details, setDetails] = useState("")
  const [linkError, setLinkError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<ReportStatus>({ kind: "idle" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const shortUrl = toShortCode(shortLink)
    if (!SHORT_CODE.test(shortUrl)) {
      setLinkError("Enter a hrva.cc short link, like hrva.cc/abc.")
      return
    }
    if (!category) return
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
      setStatus({ kind: "failed", message: failureMessage(error) })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-16 sm:py-24">
          <div className="mx-auto max-w-xl">
            <h1 className="font-display text-3xl sm:text-4xl">Report a link</h1>
            <p className="mt-3 text-muted-foreground">
              Tell us about a hrva.cc link that leads to phishing, malware, spam or other abuse. You can also email{" "}
              <a href="mailto:abuse@hrva.cc" className="text-brand hover:underline">
                abuse@hrva.cc
              </a>
              .
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-xl border bg-card p-6">
              <div>
                <Label htmlFor="short-link">Short link</Label>
                <Input
                  id="short-link"
                  placeholder="hrva.cc/abc"
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
                  placeholder="Where did you see the link, and what did the page ask for?"
                  className="mt-2"
                />
              </div>

              <div>
                <Button type="submit" disabled={sending} className="w-full sm:w-auto">
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

function ReportFormFromQuery() {
  const searchParams = useSearchParams()
  return <ReportForm initialShort={searchParams.get("s")?.trim() ?? ""} />
}

export default function ReportPage() {
  return (
    <Suspense fallback={<ReportForm initialShort="" />}>
      <ReportFormFromQuery />
    </Suspense>
  )
}
