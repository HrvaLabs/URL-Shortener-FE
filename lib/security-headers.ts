export const CONTENT_SECURITY_POLICY_HEADER = "Content-Security-Policy"

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
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
