import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { MutationCache, QueryCache, QueryClient, QueryObserver } from "@tanstack/query-core"
import "./resolve-ts-imports.mjs"

const { startRetrying, stopRetrying, trackRequest, trackQuery, trackMutation, isReconnecting, subscribeReconnecting, RECONNECTING_TEXT } = await import("../lib/reconnecting.ts")
const { ApiError, DATABASE_UNREACHABLE, RESTART_RETRY_WINDOW_MS, noteBackendAnswered, noteBackendFailed } = await import("../lib/api-client.ts")
const { refetchFailedQueries, timeRetriesPerQuery } = await import("../lib/query-client.ts")

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
  for (const key of ["a", "b", "c", "auth:me:0", "auth:me:1"]) stopRetrying(key)
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

check("aDatabaseOutageNeverStartsIt", () => {
  reset()
  trackRequest("a", true, new ApiError(DATABASE_UNREACHABLE, 503, {}, { detail: DATABASE_UNREACHABLE }))
  assert.equal(isReconnecting(), false)
  trackRequest("a", true, new ApiError("Too busy right now.", 503, {}, { detail: "Too busy right now." }))
  assert.equal(isReconnecting(), true, "another 503 is still a restart")
  trackRequest("a", true, new ApiError(DATABASE_UNREACHABLE, 503, {}, { detail: DATABASE_UNREACHABLE }))
  assert.equal(isReconnecting(), false)
})

check("itGoesOffOnceTheBackendHasBeenSilentLongerThanTheWindowEvenWhilePollsRetry", () => {
  reset()
  noteBackendAnswered()
  noteBackendFailed(Date.now() - RESTART_RETRY_WINDOW_MS + 10_000)
  trackRequest("a", true, restart())
  assert.equal(isReconnecting(), true, "within the window")
  assert.equal(isReconnecting(Date.now() + 10_001), false, "past the window, measured from the outage's start")
  noteBackendAnswered()
  assert.equal(isReconnecting(Date.now() + 10_001), true, "a new outage starts a new window")
  reset()
  noteBackendAnswered()
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

const checkAsync = async (name, run) => {
  try {
    await run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

const waitUntil = async (condition, what) => {
  const deadline = Date.now() + 2000
  while (!condition()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`)
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 60))

const realClient = (retry = true) => {
  const queryCache = new QueryCache()
  const mutationCache = new MutationCache()
  queryCache.subscribe(trackQuery)
  mutationCache.subscribe(trackMutation(mutationCache))
  return new QueryClient({
    queryCache,
    mutationCache,
    defaultOptions: { queries: { retry, retryDelay: () => 5, gcTime: Infinity }, mutations: { retry, retryDelay: () => 5 } },
  })
}

const alwaysRestarting = () => Promise.reject(restart())

const observe = (client, queryFn, key = ["list"]) => {
  const observer = new QueryObserver(client, { queryKey: key, queryFn })
  return observer.subscribe(() => {})
}

await checkAsync("aQueryRemovedWhileObservedStaysOffWhenTheObserverLeaves", async () => {
  for (const remove of [(client) => client.removeQueries(), (client) => client.clear()]) {
    reset()
    const client = realClient()
    const unsubscribe = observe(client, alwaysRestarting)
    await waitUntil(isReconnecting, "the notice to come on")
    remove(client)
    assert.equal(isReconnecting(), false, "off after the query was removed")
    unsubscribe()
    await settle()
    assert.equal(isReconnecting(), false, "still off after the observer left")
  }
})

await checkAsync("aQuerySucceedingAfterRestartErrorsTurnsItOff", async () => {
  reset()
  const client = realClient()
  let calls = 0
  const unsubscribe = observe(client, () => (++calls <= 3 ? Promise.reject(restart()) : Promise.resolve("rows")))
  await waitUntil(isReconnecting, "the notice to come on")
  await waitUntil(() => !isReconnecting(), "the notice to go off")
  assert.equal(client.getQueryData(["list"]), "rows")
  unsubscribe()
  await settle()
  assert.equal(isReconnecting(), false)
})

await checkAsync("aQueryThatGivesUpTurnsItOff", async () => {
  reset()
  const client = realClient(2)
  const unsubscribe = observe(client, alwaysRestarting)
  await waitUntil(isReconnecting, "the notice to come on")
  await waitUntil(() => !isReconnecting(), "the notice to go off")
  assert.equal(client.getQueryState(["list"]).status, "error")
  unsubscribe()
  await settle()
  assert.equal(isReconnecting(), false)
})

await checkAsync("aQueryRemovedMidRetryWithNoObserverTurnsItOff", async () => {
  reset()
  const client = realClient()
  client.prefetchQuery({ queryKey: ["list"], queryFn: alwaysRestarting, retry: true, retryDelay: () => 5 })
  await waitUntil(isReconnecting, "the notice to come on")
  client.removeQueries()
  assert.equal(isReconnecting(), false)
  await settle()
  assert.equal(isReconnecting(), false)
})

await checkAsync("aMutationRetriedThroughARestartTurnsItOnAndOffWhenCleared", async () => {
  reset()
  const client = realClient()
  const mutation = client.getMutationCache().build(client, { mutationFn: alwaysRestarting, retry: true, retryDelay: () => 5 })
  mutation.execute(undefined).catch(() => {})
  await waitUntil(isReconnecting, "the notice to come on")
  client.clear()
  assert.equal(isReconnecting(), false)
  await settle()
  assert.equal(isReconnecting(), false)
})

await checkAsync("failedQueriesOnScreenLoadAgainWhenAsked", async () => {
  reset()
  const client = realClient(false)
  let calls = 0
  const unsubscribe = observe(client, () => (++calls === 1 ? Promise.reject(restart()) : Promise.resolve("rows")), ["bio"])
  await waitUntil(() => client.getQueryState(["bio"])?.status === "error", "the query to fail")
  await refetchFailedQueries(client)
  assert.equal(client.getQueryData(["bio"]), "rows")
  assert.equal(calls, 2)
  unsubscribe()
  await settle()
})

await checkAsync("everyQueryGetsItsOwnRetryWindow", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: (count) => count < 1 } } })
  timeRetriesPerQuery(client)
  const one = client.defaultQueryOptions({ queryKey: ["one"] })
  const two = client.defaultQueryOptions({ queryKey: ["two"] })
  assert.equal(typeof one.retry, "function")
  assert.notEqual(one.retry, two.retry, "each query has its own wrapper")
  assert.equal(client.defaultQueryOptions(one), one, "defaulted options stay as they are")
  assert.equal(client.defaultQueryOptions({ queryKey: ["off"], retry: false }).retry, false)
})

const notice = readFileSync(new URL("../components/reconnecting-notice.tsx", import.meta.url), "utf8")
const providers = readFileSync(new URL("../app/providers.tsx", import.meta.url), "utf8")
const authContext = readFileSync(new URL("../lib/auth-context.tsx", import.meta.url), "utf8")

check("theNoticeIsAPoliteStatusThatOverlaysAndDoesNotSpinWhenMotionIsReduced", () => {
  assert.match(notice, /role="status"/)
  assert.match(notice, /aria-live="polite"/)
  assert.match(notice, /fixed/)
  assert.match(notice, /inset-x-0 bottom-4/)
  assert.doesNotMatch(notice, /\btop-\d/)
  assert.match(notice, /motion-safe:animate-spin/)
  assert.doesNotMatch(notice, /(?<!motion-safe:)animate-spin/)
  assert.match(notice, /RECONNECTING_TEXT/)
})

check("providersFeedTheStoreFromBothCachesAndRenderTheNoticeOnce", () => {
  assert.match(providers, /trackQuery/)
  assert.match(providers, /trackMutation/)
  assert.equal(providers.match(/<ReconnectingNotice \/>/g)?.length, 1)
})

check("theSignInRetryLoopReportsUnderItsOwnKeyPerRunAndAlwaysStops", () => {
  assert.match(authContext, /const retryKey = `auth:me:\$\{meRuns\+\+\}`/)
  assert.match(authContext, /startRetrying\(retryKey\)/)
  assert.match(authContext, /finally\s*\{\s*stopRetrying\(retryKey\)/)
  assert.doesNotMatch(authContext, /"auth:me"/)
})

check("overlappingRunsKeepItOnUntilTheLastOneStops", () => {
  reset()
  startRetrying("auth:me:0")
  startRetrying("auth:me:1")
  stopRetrying("auth:me:0")
  assert.equal(isReconnecting(), true)
  stopRetrying("auth:me:1")
  assert.equal(isReconnecting(), false)
})

if (failures > 0) process.exit(1)
console.log("ok")
process.exit(0)
