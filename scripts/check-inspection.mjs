import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import "./resolve-ts-imports.mjs"

const inspection = await import("../lib/inspection.ts")
const { formatDateTime } = await import("../lib/utils.ts")

const {
  NO_SCREENSHOT,
  SCREENSHOT_QUEUED,
  SCREENSHOT_EXPIRED,
  SCREENSHOTS_NOT_SET_UP,
  SCREENSHOT_FAILED,
  SCREENSHOT_DIDNT_LOAD,
  NO_PAGE_TITLE,
  TAKE_AGAIN,
  TAKE_SCREENSHOT,
  VIRUSTOTAL_NOT_LOOKED_UP,
  VIRUSTOTAL_NO_REPORT,
  VIRUSTOTAL_LOOKING,
  VIRUSTOTAL_NOT_SET_UP,
  VIRUSTOTAL_FAILED,
  OPEN_VIRUSTOTAL_REPORT,
  SEND_TO_VIRUSTOTAL,
  SEND_TO_VIRUSTOTAL_TITLE,
  SEND_TO_VIRUSTOTAL_BODY,
  SEND,
  WHERE_IT_GOES,
  NOT_CHECKED_YET,
  screenshotShown,
  screenshotStateLines,
  screenshotCaption,
  screenshotTakenText,
  screenshotAlt,
  takeScreenshotLabel,
  takeScreenshotOffered,
  takeScreenshotWaiting,
  virusTotalLines,
  virusTotalVerdict,
  reportDate,
  sendToVirusTotalOffered,
  inspectionPending,
  inspectionStateKey,
} = inspection

const check = (name, run) => {
  try {
    run()
  } catch (error) {
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
    process.exit(1)
  }
}

const NOT_ASCII = /[^\x00-\x7F]/

const DOT = String.fromCodePoint(0xb7)

const stringsIn = (value) => {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.flatMap(stringsIn)
  if (value !== null && typeof value === "object") return Object.entries(value).flatMap(([key, entry]) => [key, ...stringsIn(entry)])
  return []
}

const screenshot = (overrides = {}) => ({
  state: "DONE",
  requestedAt: "2026-11-03T09:00:00Z",
  takenAt: "2026-11-03T09:01:00Z",
  screenshotUrl: "https://example.com/landing",
  pageTitle: "Example landing",
  pageStatus: 200,
  failure: null,
  configured: true,
  ...overrides,
})

const noScreenshot = (configured = true) => screenshot({ state: null, requestedAt: null, takenAt: null, screenshotUrl: null, pageTitle: null, pageStatus: null, configured })

const virusTotal = (overrides = {}) => ({
  state: "DONE",
  checkedUrl: "https://example.com/landing",
  malicious: 0,
  suspicious: 0,
  harmless: 60,
  undetected: 10,
  analysedAt: "2025-12-07T12:00:00Z",
  checkedAt: "2026-11-03T09:02:00Z",
  submittedAt: null,
  reportUrl: "https://www.virustotal.com/gui/url/abc",
  failure: null,
  configured: true,
  ...overrides,
})

const noVirusTotal = (configured = true) =>
  virusTotal({ state: null, checkedUrl: null, malicious: null, suspicious: null, harmless: null, undetected: null, analysedAt: null, checkedAt: null, reportUrl: null, configured })

check("the copy is exact", () => {
  assert.equal(NO_SCREENSHOT, "No screenshot yet.")
  assert.equal(SCREENSHOT_QUEUED, "Screenshot queued.")
  assert.equal(SCREENSHOT_EXPIRED, "Screenshot removed after 7 days. Take it again to see the page now.")
  assert.equal(SCREENSHOTS_NOT_SET_UP, "Screenshots aren't set up.")
  assert.equal(SCREENSHOT_FAILED, "Taking the screenshot failed. Take it again to retry.")
  assert.equal(SCREENSHOT_DIDNT_LOAD, "The screenshot didn't load.")
  assert.equal(NO_PAGE_TITLE, "No page title")
  assert.equal(TAKE_AGAIN, "Take again")
  assert.equal(TAKE_SCREENSHOT, "Take screenshot")
  assert.equal(VIRUSTOTAL_NOT_LOOKED_UP, "Not looked up on VirusTotal yet.")
  assert.equal(VIRUSTOTAL_NO_REPORT, "VirusTotal has no report for this link.")
  assert.equal(VIRUSTOTAL_LOOKING, "Looking it up on VirusTotal.")
  assert.equal(VIRUSTOTAL_NOT_SET_UP, "VirusTotal isn't set up.")
  assert.equal(VIRUSTOTAL_FAILED, "Looking up the link on VirusTotal failed. Send it to VirusTotal to try again.")
  assert.equal(OPEN_VIRUSTOTAL_REPORT, "Open the report on VirusTotal")
  assert.equal(SEND_TO_VIRUSTOTAL, "Send to VirusTotal")
  assert.equal(SEND_TO_VIRUSTOTAL_TITLE, "Send this link to VirusTotal?")
  assert.equal(SEND_TO_VIRUSTOTAL_BODY, "VirusTotal scans it and shows the link to its paying users. Send it only if it isn't someone's private link.")
  assert.equal(SEND, "Send")
  assert.equal(WHERE_IT_GOES, "Where it goes")
  assert.equal(NOT_CHECKED_YET, "Not checked yet.")
})

check("screenshot state text for each state", () => {
  assert.deepEqual(screenshotStateLines(null), [NO_SCREENSHOT])
  assert.deepEqual(screenshotStateLines(noScreenshot()), [NO_SCREENSHOT])
  assert.deepEqual(screenshotStateLines(screenshot()), [])
  assert.deepEqual(screenshotStateLines(screenshot({ state: "PENDING", takenAt: null })), [SCREENSHOT_QUEUED])
  assert.deepEqual(screenshotStateLines(screenshot({ state: "EXPIRED" })), [SCREENSHOT_EXPIRED])
  assert.deepEqual(screenshotStateLines(screenshot({ state: "FAILED", takenAt: null, failure: "The page didn't load in 30 seconds." })), ["The page didn't load in 30 seconds."])
  assert.deepEqual(screenshotStateLines(screenshot({ state: "FAILED", takenAt: null, failure: null })), [SCREENSHOT_FAILED])
})

check("a queued screenshot shows its failure text under the queued line", () => {
  const dailyLimit = "Today's screenshot time is used up. It's taken after midnight UTC."
  assert.deepEqual(screenshotStateLines(screenshot({ state: "PENDING", takenAt: null, failure: dailyLimit })), [SCREENSHOT_QUEUED, dailyLimit])
  assert.deepEqual(screenshotStateLines(screenshot({ state: "PENDING", failure: "Cloudflare refused the API token." })), [SCREENSHOT_QUEUED, "Cloudflare refused the API token."])
})

check("screenshots that aren't set up say so unless an image is already done", () => {
  assert.deepEqual(screenshotStateLines(noScreenshot(false)), [SCREENSHOTS_NOT_SET_UP])
  assert.deepEqual(screenshotStateLines(screenshot({ state: "PENDING", configured: false })), [SCREENSHOTS_NOT_SET_UP])
  assert.deepEqual(screenshotStateLines(screenshot({ state: "EXPIRED", configured: false })), [SCREENSHOTS_NOT_SET_UP])
  assert.deepEqual(screenshotStateLines(screenshot({ configured: false })), [])
})

check("the image shows whenever one was taken and hasn't expired, a retake in progress included", () => {
  assert.equal(screenshotShown(null), false)
  assert.equal(screenshotShown(noScreenshot()), false)
  assert.equal(screenshotShown(screenshot()), true)
  assert.equal(screenshotShown(screenshot({ state: "PENDING" })), true)
  assert.equal(screenshotShown(screenshot({ state: "PENDING", takenAt: null })), false)
  assert.equal(screenshotShown(screenshot({ state: "EXPIRED" })), false)
  assert.equal(screenshotShown(screenshot({ configured: false })), true)
})

check("the caption names the page title and HTTP status, and when it was taken", () => {
  assert.equal(screenshotCaption(screenshot()), `Example landing ${DOT} 200`)
  assert.equal(screenshotCaption(screenshot({ pageTitle: null, pageStatus: 404 })), `No page title ${DOT} 404`)
  assert.equal(screenshotCaption(screenshot({ pageTitle: "   ", pageStatus: 500 })), `No page title ${DOT} 500`)
  assert.equal(screenshotCaption(screenshot({ pageStatus: null })), "Example landing")
  assert.equal(screenshotTakenText("2026-11-03T09:01:00Z"), `Taken ${formatDateTime("2026-11-03T09:01:00Z")}`)
  assert.equal(screenshotTakenText("2026-11-03T09:01:00"), `Taken ${formatDateTime("2026-11-03T09:01:00Z")}`)
  assert.equal(screenshotAlt("example.com"), "Screenshot of example.com")
  assert.equal(screenshotAlt(null), "Screenshot of the page")
})

check("Take screenshot when there is none, Take again otherwise; offered only when set up, waiting while queued", () => {
  assert.equal(takeScreenshotLabel(null), TAKE_SCREENSHOT)
  assert.equal(takeScreenshotLabel(noScreenshot()), TAKE_SCREENSHOT)
  assert.equal(takeScreenshotLabel(screenshot()), TAKE_AGAIN)
  assert.equal(takeScreenshotLabel(screenshot({ state: "FAILED" })), TAKE_AGAIN)
  assert.equal(takeScreenshotLabel(screenshot({ state: "EXPIRED" })), TAKE_AGAIN)
  assert.equal(takeScreenshotOffered(null), false)
  assert.equal(takeScreenshotOffered(noScreenshot(false)), false)
  assert.equal(takeScreenshotOffered(noScreenshot()), true)
  assert.equal(takeScreenshotWaiting(screenshot({ state: "PENDING" })), true)
  assert.equal(takeScreenshotWaiting(screenshot()), false)
  assert.equal(takeScreenshotWaiting(null), false)
})

check("VirusTotal counts: total is the sum of the four, suspicious only when above 0", () => {
  assert.equal(virusTotalVerdict(virusTotal({ malicious: 3, suspicious: 0, harmless: 60, undetected: 7, analysedAt: null })), "3 of 70 scanners flag it as malicious")
  assert.equal(virusTotalVerdict(virusTotal({ malicious: 3, suspicious: 2, harmless: 60, undetected: 5, analysedAt: null })), "3 of 70 scanners flag it as malicious, 2 as suspicious")
  assert.equal(virusTotalVerdict(virusTotal({ malicious: 0, suspicious: 2, harmless: 60, undetected: 8, analysedAt: null })), "0 of 70 scanners flag it as malicious, 2 as suspicious")
  assert.equal(virusTotalVerdict(virusTotal({ malicious: 1, suspicious: null, harmless: null, undetected: null, analysedAt: null })), "1 of 1 scanners flag it as malicious")
  assert.equal(virusTotalVerdict(virusTotal({ analysedAt: null })), "No scanner flags it")
  assert.equal(virusTotalVerdict(virusTotal({ malicious: null, suspicious: null, harmless: null, undetected: null, analysedAt: null })), "No scanner flags it")
})

check("VirusTotal verdicts add the report date as 7 December 2025", () => {
  assert.equal(reportDate("2025-12-07T12:00:00Z"), "7 December 2025")
  assert.equal(reportDate("2025-12-07T12:00:00"), "7 December 2025")
  assert.equal(virusTotalVerdict(virusTotal()), "No scanner flags it (report from 7 December 2025)")
  assert.equal(virusTotalVerdict(virusTotal({ malicious: 5, suspicious: 1, harmless: 50, undetected: 14 })), "5 of 70 scanners flag it as malicious, 1 as suspicious (report from 7 December 2025)")
  assert.deepEqual(virusTotalLines(virusTotal({ malicious: 5 })), ["5 of 75 scanners flag it as malicious (report from 7 December 2025)"])
})

check("VirusTotal text for each state", () => {
  assert.deepEqual(virusTotalLines(null), [VIRUSTOTAL_NOT_LOOKED_UP])
  assert.deepEqual(virusTotalLines(noVirusTotal()), [VIRUSTOTAL_NOT_LOOKED_UP])
  assert.deepEqual(virusTotalLines(virusTotal({ state: "NOT_FOUND" })), [VIRUSTOTAL_NO_REPORT])
  assert.deepEqual(virusTotalLines(virusTotal({ state: "PENDING" })), [VIRUSTOTAL_LOOKING])
  const dailyLimit = "Today's VirusTotal lookups are used up. They continue after midnight UTC."
  assert.deepEqual(virusTotalLines(virusTotal({ state: "PENDING", failure: dailyLimit })), [VIRUSTOTAL_LOOKING, dailyLimit])
  assert.deepEqual(virusTotalLines(virusTotal({ state: "FAILED", failure: "VirusTotal refused the API key." })), ["VirusTotal refused the API key."])
  assert.deepEqual(virusTotalLines(virusTotal({ state: "FAILED", failure: null })), [VIRUSTOTAL_FAILED])
})

check("VirusTotal that isn't set up says so unless a verdict is already there", () => {
  assert.deepEqual(virusTotalLines(noVirusTotal(false)), [VIRUSTOTAL_NOT_SET_UP])
  assert.deepEqual(virusTotalLines(virusTotal({ state: "NOT_FOUND", configured: false })), [VIRUSTOTAL_NOT_SET_UP])
  assert.deepEqual(virusTotalLines(virusTotal({ state: "PENDING", configured: false })), [VIRUSTOTAL_NOT_SET_UP])
  assert.deepEqual(virusTotalLines(virusTotal({ configured: false })), ["No scanner flags it (report from 7 December 2025)"])
})

check("Send to VirusTotal is offered only for NOT_FOUND when it is set up", () => {
  assert.equal(sendToVirusTotalOffered(virusTotal({ state: "NOT_FOUND" })), true)
  assert.equal(sendToVirusTotalOffered(virusTotal({ state: "NOT_FOUND", configured: false })), false)
  for (const state of [null, "PENDING", "DONE", "FAILED"]) assert.equal(sendToVirusTotalOffered(virusTotal({ state })), false, String(state))
  assert.equal(sendToVirusTotalOffered(null), false)
})

check("the inspection refreshes while either state is PENDING", () => {
  const of = (screenshotView, virusTotalView) => ({ urlId: 1, longUrl: "https://example.com", redirectChain: [], screenshot: screenshotView, virusTotal: virusTotalView })
  assert.equal(inspectionPending(undefined), false)
  assert.equal(inspectionPending(of(screenshot(), virusTotal())), false)
  assert.equal(inspectionPending(of(screenshot({ state: "PENDING" }), virusTotal())), true)
  assert.equal(inspectionPending(of(screenshot(), virusTotal({ state: "PENDING" }))), true)
  assert.equal(inspectionPending(of(null, null)), false)
  assert.notEqual(inspectionStateKey(of(screenshot({ state: "PENDING" }), virusTotal())), inspectionStateKey(of(screenshot(), virusTotal())))
  assert.notEqual(inspectionStateKey(of(screenshot(), virusTotal())), inspectionStateKey(of(screenshot({ takenAt: "2026-11-03T10:00:00Z" }), virusTotal())))
  assert.notEqual(inspectionStateKey(of(screenshot(), virusTotal({ state: "PENDING" }))), inspectionStateKey(of(screenshot(), virusTotal())))
  assert.equal(inspectionStateKey(undefined), "")
})

check("strings are ASCII", () => {
  const source = readFileSync(new URL("../lib/inspection.ts", import.meta.url), "utf8")
  const sourceLine = source.split("\n").findIndex((line) => NOT_ASCII.test(line))
  assert.equal(sourceLine, -1, `lib/inspection.ts line ${sourceLine + 1} has a character above U+007F`)
  for (const value of stringsIn(Object.values(inspection))) {
    if (value.includes(DOT)) continue
    assert.ok(!NOT_ASCII.test(value), `not ASCII: ${JSON.stringify(value)}`)
  }
})

console.log("ok")
