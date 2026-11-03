"use client"

import { useEffect, useId, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api-client"
import { REVIEW_QUEUE_KEY, useLinkInspection, useLinkScreenshotUrl, useSendToVirusTotal, useTakeLinkScreenshot } from "@/lib/hooks/useLinkInspection"
import {
  NOT_CHECKED_YET,
  OPEN_VIRUSTOTAL_REPORT,
  SCREENSHOT_DIDNT_LOAD,
  SEND,
  SEND_TO_VIRUSTOTAL,
  SEND_TO_VIRUSTOTAL_BODY,
  SEND_TO_VIRUSTOTAL_TITLE,
  WHERE_IT_GOES,
  inspectionStateKey,
  screenshotAlt,
  screenshotCaption,
  screenshotShown,
  screenshotStateLines,
  screenshotTakenText,
  sendToVirusTotalOffered,
  takeScreenshotLabel,
  takeScreenshotOffered,
  takeScreenshotWaiting,
  virusTotalLines,
} from "@/lib/inspection"
import type { LinkInspection } from "@/lib/types"

const emDash = String.fromCodePoint(0x2014)

const actionButton = "h-8 px-2.5 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname || null
  } catch {
    return null
  }
}

const failureText = (error: unknown, fallback: string) => (error instanceof ApiError && error.message ? error.message : fallback)

interface LinkInspectionDialogProps {
  urlId: number | null
  label: string
  longUrl: string
  open: boolean
  onOpenChange(open: boolean): void
  onCloseAutoFocus?(event: Event): void
}

/** A link's screenshot, VirusTotal verdict and redirect chain for admins, with Take again and Send to VirusTotal. */
export function LinkInspectionDialog({ urlId, label, longUrl, open, onOpenChange, onCloseAutoFocus }: LinkInspectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl" onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle className="pr-6 leading-snug [overflow-wrap:anywhere]">
            Inspection {emDash} <span className="font-mono">{label}</span>
          </DialogTitle>
          <DialogDescription className="[overflow-wrap:anywhere]">{longUrl}</DialogDescription>
        </DialogHeader>
        {urlId != null && <InspectionBody key={urlId} urlId={urlId} open={open} />}
      </DialogContent>
    </Dialog>
  )
}

function InspectionBody({ urlId, open }: { urlId: number; open: boolean }) {
  const queryClient = useQueryClient()
  const { data, error, isPending, isFetching, refetch } = useLinkInspection(urlId, open)
  const stateKey = inspectionStateKey(data)
  const seenStateKey = useRef<string | null>(null)

  useEffect(() => {
    if (!stateKey) return
    if (seenStateKey.current !== null && seenStateKey.current !== stateKey) queryClient.invalidateQueries({ queryKey: REVIEW_QUEUE_KEY })
    seenStateKey.current = stateKey
  }, [stateKey, queryClient])

  if (isPending) {
    return (
      <div className="grid gap-6 sm:grid-cols-[minmax(0,22.5rem)_minmax(0,1fr)]">
        <Skeleton className="h-64 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border px-4 py-8 text-center">
        <p className="text-sm font-medium text-destructive">{failureText(error, "Failed to load the inspection")}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()} disabled={isFetching}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="grid min-w-0 gap-6 sm:grid-cols-[minmax(0,22.5rem)_minmax(0,1fr)]">
      <ScreenshotSection inspection={data} />
      <div className="min-w-0 space-y-6">
        <VirusTotalSection inspection={data} />
        <ChainSection chain={data.redirectChain} />
      </div>
    </div>
  )
}

function ScreenshotSection({ inspection }: { inspection: LinkInspection }) {
  const headingId = useId()
  const { urlId, screenshot } = inspection
  const take = useTakeLinkScreenshot(urlId)
  const shown = screenshotShown(screenshot)
  const lines = screenshotStateLines(screenshot)
  const waiting = takeScreenshotWaiting(screenshot) || take.isPending

  const takeScreenshot = () => {
    if (waiting) return
    take.mutate(undefined, { onError: (error) => toast.error(failureText(error, "Failed to take the screenshot")) })
  }

  return (
    <section aria-labelledby={headingId} className="min-w-0 space-y-2">
      <h3 id={headingId} className="text-sm font-semibold">Screenshot</h3>
      {shown && screenshot?.takenAt && (
        <>
          <ScreenshotImage urlId={urlId} takenAt={screenshot.takenAt} host={hostOf(screenshot.screenshotUrl ?? inspection.longUrl)} />
          <div>
            <p className="text-sm [overflow-wrap:anywhere]">{screenshotCaption(screenshot)}</p>
            <p className="text-xs text-muted-foreground">{screenshotTakenText(screenshot.takenAt)}</p>
          </div>
        </>
      )}
      {lines.map((line) => (
        <p key={line} className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{line}</p>
      ))}
      {takeScreenshotOffered(screenshot) && (
        <Button type="button" size="sm" variant="outline" className={actionButton} aria-disabled={waiting} onClick={takeScreenshot}>
          {takeScreenshotLabel(screenshot)}
        </Button>
      )}
    </section>
  )
}

function ScreenshotImage({ urlId, takenAt, host }: { urlId: number; takenAt: string; host: string | null }) {
  const { url, failed } = useLinkScreenshotUrl(urlId, takenAt)

  if (failed) return <p className="text-sm text-muted-foreground">{SCREENSHOT_DIDNT_LOAD}</p>
  if (!url) return <Skeleton className="h-80 w-full max-w-[22.5rem]" />

  return (
    <div className="max-h-[70vh] w-full max-w-[22.5rem] overflow-y-auto rounded-md border bg-muted">
      <a
        href={url}
        target="_blank"
        rel="noopener"
        className="block rounded-md ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- an object URL of a private admin image, which next/image can't load */}
        <img src={url} alt={screenshotAlt(host)} className="block h-auto w-full" />
      </a>
    </div>
  )
}

function VirusTotalSection({ inspection }: { inspection: LinkInspection }) {
  const headingId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const focusHeadingOnClose = useRef(false)
  const { urlId, virusTotal } = inspection
  const send = useSendToVirusTotal(urlId)

  const confirmSend = () => {
    focusHeadingOnClose.current = true
    send.mutate(undefined, { onError: (error) => toast.error(failureText(error, "Failed to send the link to VirusTotal")) })
  }

  return (
    <section aria-labelledby={headingId} className="min-w-0 space-y-2">
      <h3 ref={headingRef} id={headingId} tabIndex={-1} className="rounded-sm text-sm font-semibold">VirusTotal</h3>
      {virusTotalLines(virusTotal).map((line) => (
        <p key={line} className="text-sm [overflow-wrap:anywhere]">{line}</p>
      ))}
      {virusTotal?.reportUrl && (
        <a
          href={virusTotal.reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-brand underline-offset-2 hover:underline"
        >
          {OPEN_VIRUSTOTAL_REPORT}
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </a>
      )}
      {sendToVirusTotalOffered(virusTotal) && (
        <div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={actionButton}
                aria-disabled={send.isPending}
                onClick={(event) => { if (send.isPending) event.preventDefault() }}
              >
                {SEND_TO_VIRUSTOTAL}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent
              onCloseAutoFocus={(event) => {
                if (!focusHeadingOnClose.current) return
                focusHeadingOnClose.current = false
                event.preventDefault()
                headingRef.current?.focus()
              }}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>{SEND_TO_VIRUSTOTAL_TITLE}</AlertDialogTitle>
                <AlertDialogDescription>{SEND_TO_VIRUSTOTAL_BODY}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmSend}>{SEND}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </section>
  )
}

function ChainSection({ chain }: { chain: string[] }) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="min-w-0 space-y-2">
      <h3 id={headingId} className="text-sm font-semibold">{WHERE_IT_GOES}</h3>
      {chain.length > 0 ? (
        <ol className="list-decimal space-y-1 pl-5 font-mono text-[13px] marker:text-muted-foreground">
          {chain.map((hop, index) => (
            <li key={`${index}-${hop}`} className="[overflow-wrap:anywhere]">{hop}</li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">{NOT_CHECKED_YET}</p>
      )}
    </section>
  )
}
