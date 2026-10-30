import assert from "node:assert/strict"
import "./resolve-ts-imports.mjs"

const { SCANNER_CACHE_CONTROL, STATIC_CACHE_CONTROL, isJunkPath, junkPathResponse } = await import("../lib/junk-paths.ts")

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

if (failures > 0) {
  console.error(`${failures} check(s) failed`)
  process.exit(1)
}

console.log("ok")
