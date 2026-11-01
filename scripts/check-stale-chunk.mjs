import assert from "node:assert/strict"
import {
  STALE_CHUNK_RELOAD_KEY,
  STALE_CHUNK_RELOAD_WINDOW_MS,
  isOwnStaticUrl,
  isStaleChunkElement,
  isStaleChunkError,
  reloadMarker,
  reloadOnce,
  reloadedRecently,
} from "../lib/stale-chunk.ts"

let failures = 0

const check = (name, run) => {
  try {
    run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

const ORIGIN = "https://app.hrva.cc"

const namedError = (name, message, cause) => {
  const error = new Error(message, cause ? { cause } : undefined)
  error.name = name
  return error
}

const memoryStorage = (initial = {}) => {
  const items = new Map(Object.entries(initial))
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    items,
  }
}

check("own static urls, relative or absolute", () => {
  assert.equal(isOwnStaticUrl("/_next/static/chunks/0a1b.js", ORIGIN), true)
  assert.equal(isOwnStaticUrl("https://app.hrva.cc/_next/static/css/a.css", ORIGIN), true)
  assert.equal(isOwnStaticUrl("https://app.hrva.cc/_next/image?url=x", ORIGIN), false)
  assert.equal(isOwnStaticUrl("https://challenges.cloudflare.com/turnstile/v0/api.js", ORIGIN), false)
  assert.equal(isOwnStaticUrl("https://evil.example/_next/static/chunks/a.js", ORIGIN), false)
  assert.equal(isOwnStaticUrl("", ORIGIN), false)
  assert.equal(isOwnStaticUrl(undefined, ORIGIN), false)
})

check("Turbopack's ChunkLoadError is a stale chunk", () => {
  const error = namedError("ChunkLoadError", "Failed to load chunk /_next/static/chunks/0a1b2c.js from module 4521")
  assert.equal(isStaleChunkError(error, ORIGIN), true)
})

check("webpack, CSS and dynamic import messages are stale chunks", () => {
  assert.equal(isStaleChunkError(new Error("Loading chunk 812 failed."), ORIGIN), true)
  assert.equal(isStaleChunkError(new Error("Loading CSS chunk 77 failed."), ORIGIN), true)
  assert.equal(
    isStaleChunkError(new TypeError("Failed to fetch dynamically imported module: https://app.hrva.cc/_next/static/chunks/a.js"), ORIGIN),
    true,
  )
  assert.equal(isStaleChunkError(new TypeError("error loading dynamically imported module"), ORIGIN), true)
  assert.equal(isStaleChunkError(new TypeError("Importing a module script failed."), ORIGIN), true)
})

check("a stale chunk wrapped as a cause is found", () => {
  const cause = namedError("ChunkLoadError", "Failed to load chunk /_next/static/chunks/x.js from runtime")
  assert.equal(isStaleChunkError(new Error("Render failed", { cause }), ORIGIN), true)
})

check("another site's chunk is not ours", () => {
  assert.equal(
    isStaleChunkError(new TypeError("Failed to fetch dynamically imported module: https://challenges.cloudflare.com/x.js"), ORIGIN),
    false,
  )
  assert.equal(isStaleChunkError(namedError("ChunkLoadError", "Failed to load chunk https://cdn.example/_next/static/a.js"), ORIGIN), false)
})

check("other errors are not stale chunks", () => {
  assert.equal(isStaleChunkError(new Error("Couldn't load these stats"), ORIGIN), false)
  assert.equal(isStaleChunkError(new TypeError("Failed to fetch"), ORIGIN), false)
  assert.equal(isStaleChunkError(null, ORIGIN), false)
  assert.equal(isStaleChunkError("Loading chunk 1 failed", ORIGIN), false)
  assert.equal(isStaleChunkError({ status: 503 }, ORIGIN), false)
})

check("own script and stylesheet elements count, others don't", () => {
  assert.equal(isStaleChunkElement({ tagName: "SCRIPT", src: `${ORIGIN}/_next/static/chunks/a.js` }, ORIGIN), true)
  assert.equal(isStaleChunkElement({ tagName: "LINK", rel: "stylesheet", href: `${ORIGIN}/_next/static/css/a.css` }, ORIGIN), true)
  assert.equal(isStaleChunkElement({ tagName: "LINK", rel: "preload", href: `${ORIGIN}/_next/static/chunks/a.js` }, ORIGIN), false)
  assert.equal(isStaleChunkElement({ tagName: "SCRIPT", src: "https://challenges.cloudflare.com/turnstile/v0/api.js" }, ORIGIN), false)
  assert.equal(isStaleChunkElement({ tagName: "IMG", src: `${ORIGIN}/_next/static/media/a.png` }, ORIGIN), false)
  assert.equal(isStaleChunkElement(null, ORIGIN), false)
})

check("the guard allows one reload per path in the window", () => {
  const now = 1_000_000
  const marker = reloadMarker("/admin/health", now)
  assert.equal(reloadedRecently(null, "/admin/health", now), false)
  assert.equal(reloadedRecently(marker, "/admin/health", now + 1), true)
  assert.equal(reloadedRecently(marker, "/admin/health", now + STALE_CHUNK_RELOAD_WINDOW_MS - 1), true)
  assert.equal(reloadedRecently(marker, "/admin/health", now + STALE_CHUNK_RELOAD_WINDOW_MS), false)
  assert.equal(reloadedRecently(marker, "/admin/dashboard", now + 1), false)
  assert.equal(reloadedRecently(marker, "/admin/health", now - 1), false)
  assert.equal(reloadedRecently("not json", "/admin/health", now), false)
  assert.equal(reloadedRecently(JSON.stringify({ path: "/admin/health" }), "/admin/health", now), false)
})

check("reloadOnce reloads, then refuses a second time on the same path", () => {
  const storage = memoryStorage()
  let reloads = 0
  const attempt = (now, path = "/admin/health") => reloadOnce({ storage: () => storage, path, now, reload: () => (reloads += 1) })
  assert.equal(attempt(5_000), true)
  assert.equal(reloads, 1)
  assert.equal(JSON.parse(storage.items.get(STALE_CHUNK_RELOAD_KEY)).path, "/admin/health")
  assert.equal(attempt(5_000 + 10_000), false)
  assert.equal(reloads, 1)
  assert.equal(attempt(5_000 + 10_000, "/admin/dashboard"), true)
  assert.equal(reloads, 2)
  assert.equal(attempt(5_000 + 10_000 + STALE_CHUNK_RELOAD_WINDOW_MS), true)
  assert.equal(reloads, 3)
})

check("no storage means no reload, so it can never loop", () => {
  let reloads = 0
  const blocked = () => {
    throw new Error("SecurityError")
  }
  const writeBlocked = () => ({
    getItem: () => null,
    setItem: () => {
      throw new Error("QuotaExceededError")
    },
  })
  assert.equal(reloadOnce({ storage: blocked, path: "/", now: 1, reload: () => (reloads += 1) }), false)
  assert.equal(reloadOnce({ storage: writeBlocked, path: "/", now: 1, reload: () => (reloads += 1) }), false)
  assert.equal(reloads, 0)
})

if (failures > 0) {
  console.error(`${failures} check${failures === 1 ? "" : "s"} failed`)
  process.exit(1)
}
console.log("ok")
