"use client"

import { useEffect, useRef, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useLinkScreenshotUrl } from "@/lib/hooks/useLinkInspection"
import { SCREENSHOT_DIDNT_LOAD, screenshotAlt, screenshotRowText, screenshotShown } from "@/lib/inspection"
import { cn } from "@/lib/utils"
import type { ScreenshotView } from "@/lib/types"

const LOAD_AHEAD = "200px"

interface LinkScreenshotThumbnailProps {
  urlId: number
  screenshot: ScreenshotView | null
  host: string | null
  onOpen(opener: HTMLElement): void
  className?: string
}

/** A row's screenshot at 56 by 100 px, fetched once the row comes near the screen; clicking it opens the inspection. Without an image, the state's one sentence. */
export function LinkScreenshotThumbnail({ urlId, screenshot, host, onOpen, className }: LinkScreenshotThumbnailProps) {
  const shown = screenshotShown(screenshot)
  const rowText = screenshotRowText(screenshot)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [nearScreen, setNearScreen] = useState(false)
  const { url, failed } = useLinkScreenshotUrl(urlId, shown ? screenshot?.takenAt ?? null : null, nearScreen)

  useEffect(() => {
    const element = buttonRef.current
    if (!shown || nearScreen || !element) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setNearScreen(true)
        observer.disconnect()
      },
      { rootMargin: LOAD_AHEAD },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [shown, nearScreen])

  return (
    <div className={cn("w-[3.75rem] space-y-1", className)}>
      {shown && (
        <button
          ref={buttonRef}
          type="button"
          onClick={(event) => onOpen(event.currentTarget)}
          aria-label={url ? undefined : screenshotAlt(host)}
          className="block h-[100px] w-14 overflow-hidden rounded-md border bg-muted ring-offset-background transition-opacity hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- an object URL of a private admin image, which next/image can't load
            <img src={url} alt={screenshotAlt(host)} width={56} height={100} className="h-full w-full object-cover object-top" />
          ) : failed ? (
            <span className="flex h-full items-center justify-center px-1 text-center text-[10px] leading-tight text-muted-foreground">{SCREENSHOT_DIDNT_LOAD}</span>
          ) : (
            <Skeleton className="h-full w-full rounded-none" />
          )}
        </button>
      )}
      {rowText && <p className="text-[11px] leading-tight text-muted-foreground break-words">{rowText}</p>}
    </div>
  )
}
