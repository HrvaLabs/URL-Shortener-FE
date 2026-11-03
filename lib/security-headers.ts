export const CONTENT_SECURITY_POLICY_HEADER = "Content-Security-Policy"

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://hrva.cc",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ")

const isHtml = (response: Response) => response.headers.get("content-type")?.toLowerCase().startsWith("text/html") ?? false

export const withContentSecurityPolicy = (response: Response): Response => {
  if (!isHtml(response) || response.headers.has(CONTENT_SECURITY_POLICY_HEADER)) return response
  const secured = new Response(response.body, response)
  secured.headers.set(CONTENT_SECURITY_POLICY_HEADER, CONTENT_SECURITY_POLICY)
  return secured
}

const CALLBACK_PATH = "/auth/callback"

export const withCallbackHeaders = (request: Request, response: Response): Response => {
  const path = new URL(request.url).pathname.replace(/\/$/, "")
  if (path !== CALLBACK_PATH) return response
  const kept = new Response(response.body, response)
  kept.headers.set("Referrer-Policy", "no-referrer")
  kept.headers.set("Cache-Control", "no-store")
  return kept
}
