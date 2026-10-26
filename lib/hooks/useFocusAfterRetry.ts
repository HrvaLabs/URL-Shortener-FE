"use client"

import { useCallback, useLayoutEffect, useRef, type RefObject } from "react"

const PAGE_RETRY_KEY = "hrva-focus-after-retry"

const focusIsLost = () => {
  const active = document.activeElement
  return active === null || active === document.body
}

/**
 * Keeps focus off `body` when a Retry button brings content back. `retry` sets a flag and runs the refetch, and a
 * failed refetch clears it. Once `ready` turns true the flag is consumed, and `target` takes focus if the Retry
 * button took it away by unmounting.
 */
export function useFocusAfterRetry(target: RefObject<HTMLElement | null>, ready: boolean) {
  const wanted = useRef(false)

  useLayoutEffect(() => {
    if (!ready || !wanted.current) return
    wanted.current = false
    if (focusIsLost()) target.current?.focus()
  }, [ready, target])

  return useCallback((refetch: () => Promise<{ isError: boolean }>) => {
    wanted.current = true
    void refetch().then((result) => {
      if (result.isError) wanted.current = false
    })
  }, [])
}

/** For a route error boundary, whose state doesn't survive the retry: remembers the retry for the next page. */
export function markPageRetry() {
  try {
    window.sessionStorage.setItem(PAGE_RETRY_KEY, "1")
  } catch {}
}

export function clearPageRetry() {
  try {
    window.sessionStorage.removeItem(PAGE_RETRY_KEY)
  } catch {}
}

/** Moves focus to the element with `targetId` when the page replaced an error boundary after its retry. */
export function useFocusAfterPageRetry(targetId: string) {
  useLayoutEffect(() => {
    let wanted = false
    try {
      wanted = window.sessionStorage.getItem(PAGE_RETRY_KEY) === "1"
    } catch {}
    if (!wanted) return
    clearPageRetry()
    if (focusIsLost()) document.getElementById(targetId)?.focus()
  }, [targetId])
}
