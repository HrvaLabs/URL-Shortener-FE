export const UNAVAILABLE_PATH = "/unavailable"

export const MISSING_STATUS = 404

export const GONE_STATUS = 410

export const GONE_REASONS = new Set(["blocked", "checking", "expired", "limit", "inactive", "domain"])

export const unavailableStatus = (reason: string | null): number => (reason !== null && GONE_REASONS.has(reason) ? GONE_STATUS : MISSING_STATUS)

const isHtml = (response: Response) => response.headers.get("content-type")?.toLowerCase().startsWith("text/html") ?? false

export const withUnavailableStatus = (request: Request, response: Response): Response => {
  const url = new URL(request.url)
  if (url.pathname.replace(/\/$/, "") !== UNAVAILABLE_PATH || response.status !== 200 || !isHtml(response)) return response
  return new Response(response.body, { status: unavailableStatus(url.searchParams.get("reason")), headers: response.headers })
}
