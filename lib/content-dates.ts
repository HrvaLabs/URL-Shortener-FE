export const CONTENT_UPDATED = {
  "/": "2026-10-30",
  "/help": "2026-10-30",
  "/help/links-without-an-account": "2026-10-30",
  "/help/utm": "2026-10-29",
  "/help/passkeys": "2026-10-30",
  "/help/stats": "2026-10-29",
  "/help/link-in-bio": "2026-10-27",
  "/help/notifications": "2026-10-29",
  "/help/install-app": "2026-10-29",
  "/help/custom-domains": "2026-10-30",
  "/mcp": "2026-10-29",
  "/report": "2026-10-27",
  "/validate": "2026-10-21",
  "/privacy": "2026-10-30",
  "/terms": "2026-10-30",
  "/about": "2026-10-29",
  "/privacy-first-url-shortener": "2026-10-30",
  "/developers": "2026-10-30",
  "/qr": "2026-10-30",
  "/utm": "2026-10-30",
  "/link-in-bio": "2026-10-29",
} as const

export type DatedPath = keyof typeof CONTENT_UPDATED

export const formatContentDate = (isoDay: string): string =>
  new Date(`${isoDay}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
