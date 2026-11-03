import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import "./resolve-ts-imports.mjs"

const { startRetrying, stopRetrying, trackRequest, isReconnecting, subscribeReconnecting, RECONNECTING_TEXT } = await import("../lib/reconnecting.ts")
const { ApiError } = await import("../lib/api-client.ts")

let failures = 0

const check = (name, run) => {
  try {
    run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

const reset = () => {
  for (const key of ["a", "b", "c"]) stopRetrying(key)
}

const restart = () => new ApiError("Can't reach hrva.cc right now.", 502)
const refused = () => new ApiError("Not found", 404)

check("twoKeysKeepItOnUntilBothStop", () => {
  reset()
  startRetrying("a")
  startRetrying("b")
  assert.equal(isReconnecting(), true)
  stopRetrying("a")
  assert.equal(isReconnecting(), true)
  stopRetrying("b")
  assert.equal(isReconnecting(), false)
})

check("startingTheSameKeyTwiceStillStopsWithOneStop", () => {
  reset()
  startRetrying("a")
  startRetrying("a")
  stopRetrying("a")
  assert.equal(isReconnecting(), false)
})

check("stoppingAnUnknownKeyIsHarmless", () => {
  reset()
  stopRetrying("never-started")
  assert.equal(isReconnecting(), false)
  startRetrying("a")
  stopRetrying("never-started")
  assert.equal(isReconnecting(), true)
  stopRetrying("a")
  assert.equal(isReconnecting(), false)
})

check("aNonRestartErrorNeverStartsIt", () => {
  reset()
  trackRequest("a", true, refused())
  assert.equal(isReconnecting(), false)
  trackRequest("a", true, new Error("boom"))
  assert.equal(isReconnecting(), false)
  trackRequest("a", true, null)
  assert.equal(isReconnecting(), false)
})

check("aRestartErrorStartsItWhileFetchingAndStopsWhenFetchingEnds", () => {
  reset()
  trackRequest("a", true, restart())
  assert.equal(isReconnecting(), true)
  trackRequest("a", false, restart())
  assert.equal(isReconnecting(), false)
})

check("aRestartErrorStartsItForANetworkFailureToo", () => {
  reset()
  trackRequest("a", true, new TypeError("Failed to fetch"))
  assert.equal(isReconnecting(), true)
  trackRequest("a", true, null)
  assert.equal(isReconnecting(), false)
})

check("aRequestThatSwitchesToANonRestartErrorStops", () => {
  reset()
  trackRequest("a", true, restart())
  trackRequest("a", true, refused())
  assert.equal(isReconnecting(), false)
})

check("subscribersHearOnlyRealChanges", () => {
  reset()
  let heard = 0
  const unsubscribe = subscribeReconnecting(() => {
    heard += 1
  })
  startRetrying("a")
  startRetrying("a")
  startRetrying("b")
  stopRetrying("a")
  stopRetrying("b")
  stopRetrying("b")
  unsubscribe()
  startRetrying("a")
  stopRetrying("a")
  assert.equal(heard, 4)
})

check("theTextIsReconnectingWithAnEllipsis", () => {
  assert.equal(RECONNECTING_TEXT, "Reconnecting" + String.fromCodePoint(0x2026))
})

const notice = readFileSync(new URL("../components/reconnecting-notice.tsx", import.meta.url), "utf8")
const providers = readFileSync(new URL("../app/providers.tsx", import.meta.url), "utf8")
const authContext = readFileSync(new URL("../lib/auth-context.tsx", import.meta.url), "utf8")

check("theNoticeIsAPoliteStatusThatOverlaysAndDoesNotSpinWhenMotionIsReduced", () => {
  assert.match(notice, /role="status"/)
  assert.match(notice, /aria-live="polite"/)
  assert.match(notice, /fixed/)
  assert.match(notice, /motion-safe:animate-spin/)
  assert.doesNotMatch(notice, /(?<!motion-safe:)animate-spin/)
  assert.match(notice, /RECONNECTING_TEXT/)
})

check("providersFeedTheStoreFromBothCachesAndRenderTheNoticeOnce", () => {
  assert.match(providers, /trackQuery/)
  assert.match(providers, /trackMutation/)
  assert.equal(providers.match(/<ReconnectingNotice \/>/g)?.length, 1)
})

check("theSignInRetryLoopReportsToTheStoreAndAlwaysStops", () => {
  assert.match(authContext, /startRetrying\(ME_RETRY_KEY\)/)
  assert.match(authContext, /finally\s*\{\s*stopRetrying\(ME_RETRY_KEY\)/)
})

if (failures > 0) process.exit(1)
console.log("ok")
