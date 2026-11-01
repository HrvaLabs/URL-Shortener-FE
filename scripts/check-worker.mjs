import assert from "node:assert/strict"
import "./resolve-ts-imports.mjs"

const { SCANNER_CACHE_CONTROL, STATIC_CACHE_CONTROL, isJunkPath, junkPathResponse } = await import("../lib/junk-paths.ts")
const { CONTENT_SECURITY_POLICY, withCallbackHeaders, withContentSecurityPolicy } = await import("../lib/security-headers.ts")
const { GONE_REASONS, GONE_STATUS, MISSING_STATUS, unavailableStatus, withUnavailableStatus } = await import("../lib/unavailable-status.ts")
const { readFile } = await import("node:fs/promises")

let failures = 0

const check = async (name, run) => {
  try {
    await run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

const intercepted = [
  "/_next/static/chunks/0a1b2c3d.js",
  "/_next/static/css/missing.css",
  "/_next/static/",
  "/admin.php",
  "/o.php",
  "/xmlrpc.php",
  "/shell.PHP",
  "/index.php5",
  "/wp-login.php",
  "/wp-admin/",
  "/wp-content/uploads/a.png",
  "/wp-includes/x",
  "/cgi-bin/luci",
  "/cgi-bin/",
  "/phpmyadmin/index.php",
  "/.env",
  "/.env.local",
  "/.env.production",
  "/aws.env",
  "/.git/config",
  "/.gitignore",
  "/.aws/credentials",
  "/.DS_Store",
  "/app/.env",
  "/backup.sql",
  "/site.zip",
  "/db.bak",
  "/config.yml",
  "/receipts/2026-01.pdf",
  "/default.aspx",
  "/login.jsp",
]

const passed = [
  "/",
  "/login",
  "/register",
  "/dashboard",
  "/dashboard/settings",
  "/admin/settings",
  "/auth/callback",
  "/help",
  "/help/passkeys",
  "/changelog",
  "/offline",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/llms.txt",
  "/favicon.ico",
  "/sw.js",
  "/.well-known/security.txt",
  "/.well-known/assetlinks.json",
  "/.well-known/",
  "/_next/image",
  "/_next/data/build/index.json",
  "/_next/static",
  "/bio/karlo",
  "/bio/karlo/opengraph-image",
  "/bio/some-handle_1",
  "/validate/abc123",
  "/protected/abc123",
  "/reset-password/token-value",
  "/verify-email/token-value",
  "/wpad",
  "/blog/how-hrva-cc-stops-phishing-links",
  "/about",
]

await check("scanner and stale-asset paths are answered before Next", () => {
  for (const path of intercepted) assert.equal(isJunkPath(path), true, path)
})

await check("real routes, the allowlisted files and .well-known pass through", () => {
  for (const path of passed) assert.equal(isJunkPath(path), false, path)
})

await check("the query string and the host do not decide", () => {
  const stale = junkPathResponse(new Request("https://app.hrva.cc/_next/static/chunks/x.js?v=2"))
  assert.equal(stale?.status, 404)
  assert.equal(junkPathResponse(new Request("https://app.hrva.cc/?file=a.php")), null)
  assert.equal(junkPathResponse(new Request("https://app.hrva.cc/login?next=%2F.env")), null)
  assert.equal(junkPathResponse(new Request("https://app.hrva.cc/robots.txt?x=.env")), null)
})

await check("the answer is a tiny plain 404", async () => {
  const response = junkPathResponse(new Request("https://app.hrva.cc/.env"))
  assert.equal(response?.status, 404)
  assert.equal(response?.headers.get("content-type"), "text/plain; charset=utf-8")
  assert.equal(response?.headers.get("cache-control"), "public, max-age=600")
  assert.equal(response?.headers.get("cache-control"), SCANNER_CACHE_CONTROL)
  assert.equal(await response?.text(), "Not found\n")
})

await check("a missing /_next/static file is never cached, a scanner path is cached for 10 minutes", () => {
  const chunk = junkPathResponse(new Request("https://app.hrva.cc/_next/static/chunks/old.js"))
  assert.equal(chunk?.headers.get("cache-control"), "no-store")
  assert.equal(chunk?.headers.get("cache-control"), STATIC_CACHE_CONTROL)
  for (const path of ["/.env", "/admin.php", "/wp-login.php", "/cgi-bin/x"]) {
    assert.equal(junkPathResponse(new Request(`https://app.hrva.cc${path}`))?.headers.get("cache-control"), "public, max-age=600", path)
  }
})

await check("any method gets the 404, HEAD included", () => {
  for (const method of ["GET", "HEAD", "POST"]) {
    assert.equal(junkPathResponse(new Request("https://app.hrva.cc/admin.php", { method }))?.status, 404, method)
  }
})

await check("encoded dots are not decoded, so they fall through to Next", () => {
  assert.equal(isJunkPath("/%2eenv"), false)
  assert.equal(isJunkPath("/admin%2ephp"), false)
})

await check("every HTML answer from the worker carries the content security policy", async () => {
  const page = withContentSecurityPolicy(new Response("<!doctype html>", { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "s-maxage=31536000" } }))
  assert.equal(page.headers.get("content-security-policy"), CONTENT_SECURITY_POLICY)
  assert.equal(page.headers.get("cache-control"), "s-maxage=31536000")
  assert.equal(await page.text(), "<!doctype html>")
})

await check("other answers pass through untouched", () => {
  const data = new Response("{}", { headers: { "Content-Type": "text/x-component" } })
  assert.equal(withContentSecurityPolicy(data), data)
  const stale = junkPathResponse(new Request("https://app.hrva.cc/.env"))
  assert.equal(withContentSecurityPolicy(stale), stale)
})

await check("the policy allows only this site, hrva.cc for the API and Turnstile", () => {
  const directives = Object.fromEntries(CONTENT_SECURITY_POLICY.split("; ").map((directive) => {
    const [name, ...sources] = directive.split(" ")
    return [name, sources.join(" ")]
  }))
  assert.deepEqual(directives, {
    "default-src": "'self'",
    "script-src": "'self' 'unsafe-inline' https://challenges.cloudflare.com",
    "style-src": "'self' 'unsafe-inline'",
    "img-src": "'self' data: https:",
    "connect-src": "'self' https://hrva.cc",
    "frame-src": "https://challenges.cloudflare.com",
    "frame-ancestors": "'none'",
    "base-uri": "'self'",
    "form-action": "'self'",
    "object-src": "'none'",
  })
})

await check("static files get the same policy from public/_headers", async () => {
  const headers = await readFile(new URL("../public/_headers", import.meta.url), "utf8")
  assert.match(headers, new RegExp(`^/\\*\\n  Content-Security-Policy: ${CONTENT_SECURITY_POLICY.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m"))
})

await check("the sign-in callback page is never stored and sends no referrer", async () => {
  for (const url of ["https://app.hrva.cc/auth/callback", "https://app.hrva.cc/auth/callback/", "https://app.hrva.cc/auth/callback?code=x&_rsc=1"]) {
    const page = withCallbackHeaders(new Request(url), new Response("<!doctype html>", { headers: { "Content-Type": "text/html", "Cache-Control": "s-maxage=31536000" } }))
    assert.equal(page.headers.get("referrer-policy"), "no-referrer", url)
    assert.equal(page.headers.get("cache-control"), "no-store", url)
    assert.equal(await page.text(), "<!doctype html>")
  }
  const other = new Response("<!doctype html>", { headers: { "Cache-Control": "s-maxage=31536000" } })
  assert.equal(withCallbackHeaders(new Request("https://app.hrva.cc/auth/callbacks"), other), other)
  assert.equal(withCallbackHeaders(new Request("https://app.hrva.cc/login"), other), other)
})

await check("the static copy of the callback page has the same headers in public/_headers", async () => {
  const headers = await readFile(new URL("../public/_headers", import.meta.url), "utf8")
  assert.match(headers, /^\/auth\/callback\n  Referrer-Policy: no-referrer\n  Cache-Control: no-store$/m)
})

const unavailablePage = () => new Response("<!doctype html>", { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "s-maxage=31536000" } })

await check("/unavailable answers 404 for a missing link and 410 for every other reason, like the backend", async () => {
  assert.equal(MISSING_STATUS, 404)
  assert.equal(GONE_STATUS, 410)
  for (const [query, status] of [["?s=abc&reason=missing", 404], ["", 404], ["?reason=nonsense", 404], ["?reason=", 404], ["?s=abc&reason=blocked", 410], ["?reason=checking&d=go.example.com", 410], ["?reason=expired", 410], ["?reason=limit", 410], ["?reason=inactive", 410], ["?reason=domain", 410]]) {
    for (const path of ["/unavailable", "/unavailable/"]) {
      const answer = withUnavailableStatus(new Request(`https://app.hrva.cc${path}${query}`), unavailablePage())
      assert.equal(answer.status, status, `${path}${query}`)
      assert.equal(answer.headers.get("content-type"), "text/html; charset=utf-8")
      assert.equal(answer.headers.get("cache-control"), "s-maxage=31536000")
      assert.equal(await answer.text(), "<!doctype html>")
    }
  }
})

await check("the status leaves other pages, other statuses and the policy alone", () => {
  const other = unavailablePage()
  assert.equal(withUnavailableStatus(new Request("https://app.hrva.cc/unavailable-link?reason=blocked"), other), other)
  assert.equal(withUnavailableStatus(new Request("https://app.hrva.cc/help?reason=blocked"), other), other)
  const redirect = new Response(null, { status: 308, headers: { Location: "/unavailable" } })
  assert.equal(withUnavailableStatus(new Request("https://app.hrva.cc/unavailable/"), redirect), redirect)
  const data = new Response("1:", { headers: { "Content-Type": "text/x-component" } })
  assert.equal(withUnavailableStatus(new Request("https://app.hrva.cc/unavailable?reason=blocked&_rsc=1"), data), data)
  const answered = withContentSecurityPolicy(withUnavailableStatus(new Request("https://app.hrva.cc/unavailable?reason=blocked"), unavailablePage()))
  assert.equal(answered.status, 410)
  assert.equal(answered.headers.get("content-security-policy"), CONTENT_SECURITY_POLICY)
  assert.equal(withUnavailableStatus(new Request("https://app.hrva.cc/unavailable?reason=blocked", { method: "HEAD" }), new Response(null, { status: 200, headers: { "Content-Type": "text/html" } })).status, 410)
})

await check("every reason the /unavailable page words is 410 here except missing", async () => {
  const page = await readFile(new URL("../app/unavailable/page.tsx", import.meta.url), "utf8")
  const reasons = [...page.matchAll(/^\s+\["([a-z]+)", /gm)].map((match) => match[1])
  assert.deepEqual(new Set(reasons.filter((reason) => reason !== "missing")), GONE_REASONS)
  assert.ok(reasons.includes("missing"))
  for (const reason of reasons) assert.equal(unavailableStatus(reason), reason === "missing" ? 404 : 410, reason)
})

await check("the worker wraps Next's answers with the policy, the unavailable status and the callback headers", async () => {
  const worker = await readFile(new URL("../custom-worker.mjs", import.meta.url), "utf8")
  assert.match(worker, /withContentSecurityPolicy\(withUnavailableStatus\(request, withCallbackHeaders\(request, await nextFetch\(request, env, context\)\)\)\)/)
})

if (failures > 0) {
  console.error(`${failures} check(s) failed`)
  process.exit(1)
}

console.log("ok")
