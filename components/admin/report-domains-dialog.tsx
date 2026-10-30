"use client"

import { useMemo, useRef, useState, type RefObject } from "react"
import { Mail } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api-client"
import { useAbuseReports, useMarkReported } from "@/lib/hooks/useAbuseReports"
import { useFocusAfterRetry } from "@/lib/hooks/useFocusAfterRetry"
import { copyMarksReported, mailtoHref, markedStatus, noContactText, reportAsText, reportStatusText, type ReportCopyField } from "@/lib/moderation"
import { cn, plural } from "@/lib/utils"
import type { AbuseReport, AbuseReportSource } from "@/lib/types"

const wrap = "[overflow-wrap:anywhere]"

const words = "break-words"

const disabledClass = "aria-disabled:cursor-not-allowed aria-disabled:opacity-50"

const COPY_REFUSED = "Couldn't copy. Select the text and copy it by hand."

interface ReportDomainsDialogProps {
  source: AbuseReportSource
  open: boolean
  onOpenChange(open: boolean): void
  onCloseAutoFocus?(event: Event): void
}

export function ReportDomainsDialog({ source, open, onOpenChange, onCloseAutoFocus }: ReportDomainsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl" onCloseAutoFocus={onCloseAutoFocus}>
        <ReportDomainsBody source={source} />
      </DialogContent>
    </Dialog>
  )
}

function ReportDomainsBody({ source }: { source: AbuseReportSource }) {
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useAbuseReports(source, true)
  const { marked, mark } = useMarkReported()
  const now = new Date(dataUpdatedAt)
  const lookupFailed = data?.noContact.some((entry) => entry.lookupFailed) ?? false
  const nothing = data && data.reports.length === 0 && data.noContact.length === 0
  const noContactRef = useRef<HTMLHeadingElement>(null)
  const firstCardRef = useRef<HTMLHeadingElement>(null)
  const firstResultRef = useMemo<RefObject<HTMLElement | null>>(() => ({ get current() { return noContactRef.current ?? firstCardRef.current } }), [])
  const retry = useFocusAfterRetry(firstResultRef, !!data && !error && !isFetching)

  return (
    <>
      <DialogHeader>
        <DialogTitle>Report domains</DialogTitle>
        <DialogDescription>
          One email per registrar. Open it in your mail app or copy it; hrva.cc sends nothing itself. The first time you open an email in your mail app, copy its body or copy all of it, its domains are marked as reported. Copying only the To, Cc or Subject marks nothing.
        </DialogDescription>
      </DialogHeader>

      {isLoading ? (
        <div role="status" className="space-y-2">
          <p className="text-sm text-muted-foreground">Looking up the registrars. This can take up to 20 seconds.</p>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : error && !data ? (
        <div role="alert" className="rounded-lg border px-4 py-3 text-sm">
          <p className={cn("text-destructive", wrap)}>
            {error instanceof ApiError && error.message ? error.message : "Couldn't prepare the reports."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className={cn("mt-3", disabledClass)}
            onClick={() => { if (!isFetching) retry(refetch) }}
            aria-disabled={isFetching}
          >
            Retry
          </Button>
        </div>
      ) : data ? (
        <>
          {error && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/40 px-4 py-3 text-sm">
              <p className={cn("min-w-0 flex-1 text-destructive", wrap)}>
                {error instanceof ApiError && error.message ? error.message : "Couldn't look up the registrars again."} The list below may be out of date.
              </p>
              <Button
                variant="outline"
                size="sm"
                className={disabledClass}
                onClick={() => { if (!isFetching) retry(refetch) }}
                aria-disabled={isFetching}
              >
                Retry
              </Button>
            </div>
          )}

          {nothing && <p className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">There are no domains to report.</p>}

          {data.reports.length > 0 && (
            <ul className="space-y-3">
              {data.reports.map((report, index) => (
                <ReportCard key={`${report.registrar}|${report.to}`} report={report} marked={marked} mark={mark} now={now} headingRef={index === 0 ? firstCardRef : undefined} />
              ))}
            </ul>
          )}

          {data.noContact.length > 0 && (
            <section aria-labelledby="no-contact-heading" className="space-y-3 rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="no-contact-heading" ref={noContactRef} tabIndex={-1} className="rounded-sm text-sm font-medium">No abuse contact found</h3>
                {lookupFailed && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={disabledClass}
                    onClick={() => { if (!isFetching) retry(refetch) }}
                    aria-disabled={isFetching}
                  >
                    {isFetching ? "Looking up..." : "Look up again"}
                  </Button>
                )}
              </div>
              <ul className="space-y-2">
                {data.noContact.map((entry) => (
                  <li key={entry.domain} className="text-sm">
                    <p className={cn("font-mono text-[13px] font-medium", wrap)}>{entry.domain}</p>
                    <p className={cn("text-xs text-muted-foreground", words)}>
                      {noContactText(entry)}
                      {" - "}
                      {reportStatusText(entry.report, now)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : null}
    </>
  )
}

interface ReportCardProps {
  report: AbuseReport
  marked: ReadonlySet<string>
  mark(report: AbuseReport): Promise<boolean>
  now: Date
  headingRef?: RefObject<HTMLHeadingElement | null>
}

function ReportCard({ report, marked, mark, now, headingRef }: ReportCardProps) {
  const [markFailed, setMarkFailed] = useState(false)
  const href = mailtoHref(report)

  const markFirst = async () => setMarkFailed(!(await mark(report)))

  const copy = async (field: ReportCopyField, label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      toast.error(COPY_REFUSED)
      return
    }
    toast.success(`${label} copied`)
    if (copyMarksReported(field)) void markFirst()
  }

  const fields: { field: Exclude<ReportCopyField, "all">; label: string; text: string }[] = [
    { field: "to", label: "To", text: report.to },
    { field: "cc", label: "Cc", text: report.cc.join(", ") },
    { field: "subject", label: "Subject", text: report.subject },
    { field: "body", label: "Body", text: report.body },
  ]

  return (
    <li className="space-y-3 rounded-xl border bg-card p-4 @lg:p-5">
      <h3 ref={headingRef} tabIndex={-1} className={cn("rounded-sm text-sm font-semibold", words)}>{report.registrar}</h3>

      {fields.map(({ field, label, text }) => (
        <div key={field} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5"
              onClick={() => void copy(field, label, text)}
              disabled={text === ""}
              aria-label={`Copy ${label} for ${report.registrar}`}
            >
              Copy
            </Button>
          </div>
          {field === "body" ? (
            <div
              tabIndex={0}
              role="region"
              aria-label={`${label} for ${report.registrar}`}
              className={cn("max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/40 px-3 py-2 text-[13px]", wrap)}
            >
              {text}
            </div>
          ) : (
            <p className={cn("font-mono text-[13px]", wrap)}>{text === "" ? "None" : text}</p>
          )}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        {href ? (
          <Button asChild size="sm">
            <a href={href} onClick={() => void markFirst()}>
              <Mail aria-hidden="true" className="h-3.5 w-3.5" />
              Open in mail app
            </a>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Too long for a mail link. Use Copy all.</p>
        )}
        <Button variant="outline" size="sm" onClick={() => void copy("all", "Email", reportAsText(report))} aria-label={`Copy all for ${report.registrar}`}>
          Copy all
        </Button>
      </div>

      {markFailed && (
        <p role="alert" className="text-sm text-destructive">
          Couldn&apos;t mark these domains as reported. Open or copy the email again to retry.
        </p>
      )}

      <div>
        <p className="text-xs font-medium text-muted-foreground">{plural(report.domains.length, "domain")}</p>
        <ul className="mt-1 space-y-1">
          {report.domains.map(({ domain, report: status }) => (
            <li key={domain} className={cn("text-sm", words)}>
              <span className={cn("font-mono text-[13px] font-medium", wrap)}>{domain}</span>
              <span className="text-xs text-muted-foreground">
                {" - "}
                {reportStatusText(marked.has(domain) ? markedStatus(status, report.registrar, now) : status, now)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}
