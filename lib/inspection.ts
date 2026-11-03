import { formatDateTime, parseServerDateTime } from "./utils"
import type { LinkInspection, ScreenshotView, VirusTotalView } from "./types"

export const NO_SCREENSHOT = "No screenshot yet."

export const SCREENSHOT_QUEUED = "Screenshot queued."

export const SCREENSHOT_EXPIRED = "Screenshot removed after 7 days. Take it again to see the page now."

export const SCREENSHOTS_NOT_SET_UP = "Screenshots aren't set up."

export const SCREENSHOT_FAILED = "Taking the screenshot failed. Take it again to retry."

export const SCREENSHOT_DIDNT_LOAD = "The screenshot didn't load."

export const NO_PAGE_TITLE = "No page title"

export const TAKE_AGAIN = "Take again"

export const TAKE_SCREENSHOT = "Take screenshot"

export const VIRUSTOTAL_NOT_LOOKED_UP = "Not looked up on VirusTotal yet."

export const VIRUSTOTAL_NO_REPORT = "VirusTotal has no report for this link."

export const VIRUSTOTAL_LOOKING = "Looking it up on VirusTotal."

export const VIRUSTOTAL_NOT_SET_UP = "VirusTotal isn't set up."

export const VIRUSTOTAL_FAILED = "Looking up the link on VirusTotal failed. Send it to VirusTotal to try again."

export const OPEN_VIRUSTOTAL_REPORT = "Open the report on VirusTotal"

export const SEND_TO_VIRUSTOTAL = "Send to VirusTotal"

export const SEND_TO_VIRUSTOTAL_TITLE = "Send this link to VirusTotal?"

export const SEND_TO_VIRUSTOTAL_BODY = "VirusTotal scans it and shows the link to its paying users. Send it only if it isn't someone's private link."

export const SEND = "Send"

export const WHERE_IT_GOES = "Where it goes"

export const NOT_CHECKED_YET = "Not checked yet."

export const INSPECTION_REFRESH_MS = 10_000

const MIDDLE_DOT = String.fromCodePoint(0xb7)

const reportDayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" })

const withFailure = (line: string, failure: string | null) => (failure ? [line, failure] : [line])

/** Whether an image is stored to show: one was taken and hasn't expired, even while a retake waits in the queue. */
export function screenshotShown(view: ScreenshotView | null): boolean {
  return view?.takenAt != null && view.state !== "EXPIRED"
}

/** The lines that describe a screenshot's state; none when the finished image says it all. */
export function screenshotStateLines(view: ScreenshotView | null): string[] {
  if (!view) return [NO_SCREENSHOT]
  if (!view.configured) return view.state === "DONE" ? [] : [SCREENSHOTS_NOT_SET_UP]
  switch (view.state) {
    case null:
      return [NO_SCREENSHOT]
    case "PENDING":
      return withFailure(SCREENSHOT_QUEUED, view.failure)
    case "FAILED":
      return [view.failure || SCREENSHOT_FAILED]
    case "EXPIRED":
      return [SCREENSHOT_EXPIRED]
    default:
      return []
  }
}

export function screenshotCaption(view: ScreenshotView): string {
  const title = view.pageTitle?.trim() || NO_PAGE_TITLE
  return view.pageStatus == null ? title : `${title} ${MIDDLE_DOT} ${view.pageStatus}`
}

export const screenshotTakenText = (takenAt: string): string => `Taken ${formatDateTime(takenAt)}`

export const screenshotAlt = (host: string | null): string => `Screenshot of ${host ?? "the page"}`

export const takeScreenshotLabel = (view: ScreenshotView | null): string => (view?.state == null ? TAKE_SCREENSHOT : TAKE_AGAIN)

export const takeScreenshotOffered = (view: ScreenshotView | null): boolean => view?.configured === true

export const takeScreenshotWaiting = (view: ScreenshotView | null): boolean => view?.state === "PENDING"

export const reportDate = (value: string): string => reportDayFormat.format(parseServerDateTime(value))

/** The verdict of a VirusTotal report: how many of all its scanners flag the link, and the report's date. */
export function virusTotalVerdict(view: VirusTotalView): string {
  const malicious = view.malicious ?? 0
  const suspicious = view.suspicious ?? 0
  const total = malicious + suspicious + (view.harmless ?? 0) + (view.undetected ?? 0)
  const verdict =
    malicious + suspicious === 0
      ? "No scanner flags it"
      : `${malicious} of ${total} scanners flag it as malicious${suspicious > 0 ? `, ${suspicious} as suspicious` : ""}`
  return view.analysedAt ? `${verdict} (report from ${reportDate(view.analysedAt)})` : verdict
}

export function virusTotalLines(view: VirusTotalView | null): string[] {
  if (!view) return [VIRUSTOTAL_NOT_LOOKED_UP]
  if (!view.configured && view.state !== "DONE") return [VIRUSTOTAL_NOT_SET_UP]
  switch (view.state) {
    case "DONE":
      return [virusTotalVerdict(view)]
    case "NOT_FOUND":
      return [VIRUSTOTAL_NO_REPORT]
    case "PENDING":
      return withFailure(VIRUSTOTAL_LOOKING, view.failure)
    case "FAILED":
      return [view.failure || VIRUSTOTAL_FAILED]
    default:
      return [VIRUSTOTAL_NOT_LOOKED_UP]
  }
}

export const sendToVirusTotalOffered = (view: VirusTotalView | null): boolean => view?.configured === true && view.state === "NOT_FOUND"

export const inspectionPending = (inspection: LinkInspection | undefined): boolean =>
  inspection?.screenshot?.state === "PENDING" || inspection?.virusTotal?.state === "PENDING"

/** What changes when a queued screenshot or lookup finishes, so the review queue can be refreshed then. */
export const inspectionStateKey = (inspection: LinkInspection | undefined): string =>
  inspection
    ? [inspection.screenshot?.state, inspection.screenshot?.takenAt, inspection.virusTotal?.state, inspection.virusTotal?.analysedAt].join("|")
    : ""
