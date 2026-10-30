export const JUNK_CACHE_CONTROL = "public, max-age=600"

const ALLOWED_PATHS = new Set(["/robots.txt", "/sitemap.xml", "/manifest.webmanifest", "/llms.txt", "/favicon.ico", "/sw.js"])

const SCANNER_PREFIXES = ["/wp-", "/cgi-bin/", "/phpmyadmin"]

const SCANNER_EXTENSION = /\.(?:php\d?|phtml|asp|aspx|jsp|cgi|env|sql|bak|zip|tar|gz|rar|7z|ini|log|ya?ml|pdf)$/i

export const isJunkPath = (pathname: string): boolean => {
  if (ALLOWED_PATHS.has(pathname) || pathname.startsWith("/.well-known/")) return false
  if (pathname.startsWith("/_next/static/")) return true
  if (SCANNER_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true
  if (pathname.split("/").some((segment) => segment.startsWith("."))) return true
  return SCANNER_EXTENSION.test(pathname)
}

export const junkPathResponse = (request: Request): Response | null => {
  if (!isJunkPath(new URL(request.url).pathname)) return null
  return new Response("Not found\n", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": JUNK_CACHE_CONTROL },
  })
}
