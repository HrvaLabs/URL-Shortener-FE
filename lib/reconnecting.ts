import { useEffect, useSyncExternalStore } from "react"
import type { Mutation, MutationCache, MutationCacheNotifyEvent, Query, QueryCacheNotifyEvent } from "@tanstack/react-query"
import { RESTART_RETRY_WINDOW_MS, backendRestartingSince, isRestartError, restartTooLong } from "./api-client"

export const RECONNECTING_TEXT = `Reconnecting${String.fromCodePoint(0x2026)}`

export const STILL_TRYING_TEXT = `Can't reach hrva.cc right now. Still trying${String.fromCodePoint(0x2026)}`

export type ReconnectingState = "off" | "reconnecting" | "still-trying"

const retrying = new Set<string>()

const listeners = new Set<() => void>()

let fullPageNotices = 0

const notify = () => {
  for (const listener of listeners) listener()
}

let windowEnd: ReturnType<typeof setTimeout> | null = null

let windowEndFor: number | null = null

/** One timer per outage start, so the text switches at the end of every outage's window, a second one while the same keys retry included. */
export const notifyWhenTheWindowEnds = (): void => {
  const since = backendRestartingSince()
  if (since === windowEndFor) return
  if (windowEnd !== null) clearTimeout(windowEnd)
  windowEnd = null
  windowEndFor = since
  if (since === null) return
  windowEnd = setTimeout(() => {
    windowEnd = null
    notify()
  }, Math.max(0, since + RESTART_RETRY_WINDOW_MS - Date.now()) + 50)
}

/** The outage start the window-end timer is set for; null when none is. */
export const windowEndScheduledFor = (): number | null => (windowEnd === null ? null : windowEndFor)

export const startRetrying = (key: string): void => {
  notifyWhenTheWindowEnds()
  if (retrying.has(key)) return
  retrying.add(key)
  notify()
}

export const stopRetrying = (key: string): void => {
  if (retrying.delete(key)) notify()
}

/** True while something retries through a restart. */
export const isReconnecting = (): boolean => retrying.size > 0

/** "reconnecting" while something retries and the backend has been silent for less than the restart window, "still-trying" after that while pages still retry, else "off". */
export const reconnectingState = (now = Date.now()): ReconnectingState => {
  if (retrying.size === 0 || fullPageNotices > 0) return "off"
  return restartTooLong(now) ? "still-trying" : "reconnecting"
}

/** Registers a full-page notice that already says hrva.cc can't be reached, so the bottom notice stays hidden while it is on screen; call the answer to release it. */
export const showFullPageNotice = (): (() => void) => {
  fullPageNotices += 1
  notify()
  let released = false
  return () => {
    if (released) return
    released = true
    fullPageNotices -= 1
    notify()
  }
}

/** Keeps the bottom notice hidden while this component shows a full-page notice (`active`). */
export const useFullPageNotice = (active = true): void => {
  useEffect(() => (active ? showFullPageNotice() : undefined), [active])
}

export const subscribeReconnecting = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const trackRequest = (key: string, inProgress: boolean, failureReason: unknown): void => {
  if (inProgress && isRestartError(failureReason)) startRetrying(key)
  else stopRetrying(key)
}

export const trackQuery = (event: QueryCacheNotifyEvent): void => {
  const query: Query = event.query
  const key = `query:${query.queryHash}`
  if (event.type === "removed") stopRetrying(key)
  else if (event.type === "updated") trackRequest(key, query.state.fetchStatus === "fetching", query.state.fetchFailureReason)
}

export const trackMutation =
  (cache: MutationCache) =>
  (event: MutationCacheNotifyEvent): void => {
    const mutation: Mutation | undefined = event.mutation
    if (!mutation) return
    const key = `mutation:${mutation.mutationId}`
    if (event.type === "removed") stopRetrying(key)
    else if (event.type === "updated") trackRequest(key, cache.getAll().includes(mutation) && mutation.state.status === "pending", mutation.state.failureReason)
  }

export const useReconnecting = (): ReconnectingState => useSyncExternalStore(subscribeReconnecting, () => reconnectingState(), () => "off")
