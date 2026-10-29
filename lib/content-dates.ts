export const CONTENT_UPDATED = {
  "/": "2026-10-29",
  "/help": "2026-10-29",
  "/help/utm": "2026-10-26",
  "/help/passkeys": "2026-10-26",
  "/help/stats": "2026-10-27",
  "/help/link-in-bio": "2026-10-27",
  "/help/notifications": "2026-10-29",
  "/mcp": "2026-10-29",
  "/report": "2026-10-27",
  "/validate": "2026-10-21",
  "/privacy": "2026-10-29",
  "/terms": "2026-10-27",
  "/about": "2026-10-29",
  "/privacy-first-url-shortener": "2026-10-29",
  "/developers": "2026-10-29",
} as const

export type DatedPath = keyof typeof CONTENT_UPDATED

export const formatContentDate = (isoDay: string): string =>
  new Date(`${isoDay}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
