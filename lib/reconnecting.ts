import { useSyncExternalStore } from "react"
import type { Mutation, MutationCache, MutationCacheNotifyEvent, Query, QueryCacheNotifyEvent } from "@tanstack/react-query"
import { isRestartError } from "./api-client"

export const RECONNECTING_TEXT = `Reconnecting${String.fromCodePoint(0x2026)}`

const retrying = new Set<string>()

const listeners = new Set<() => void>()

const notify = () => {
  for (const listener of listeners) listener()
}

export const startRetrying = (key: string): void => {
  if (retrying.has(key)) return
  retrying.add(key)
  notify()
}

export const stopRetrying = (key: string): void => {
  if (retrying.delete(key)) notify()
}

export const isReconnecting = (): boolean => retrying.size > 0

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

export const useReconnecting = (): boolean => useSyncExternalStore(subscribeReconnecting, isReconnecting, () => false)
