"use client"

import { useCallback, useRef, type RefObject } from "react"
import { focusTargetAfterRemoving } from "@/lib/utils"

type Fallback = RefObject<HTMLElement | null> | (() => HTMLElement | null)

const FALLBACK = "fallback"

/**
 * Keeps keyboard focus on the table when an action removes a row. `capture` remembers where focus goes
 * (the next row's `data-remove-row` button, else the previous one's, else the fallback) and `setTarget`
 * names the element outright (or `null` for the fallback). The fallback is resolved when focus moves, so a
 * function can pick whatever survived the refetch. A confirm dialog passes `onCloseAutoFocus` so focus moves
 * there instead of back to the vanished trigger (or to `returnTo` when nothing was captured, such as after
 * Cancel), and an action without a dialog calls `restore` once the row is gone (a dialog still open leaves it
 * to `onCloseAutoFocus`).
 */
export function useRowRemovalFocus(fallback: Fallback) {
  const target = useRef<HTMLElement | typeof FALLBACK | null>(null)

  const resolveFallback = useCallback(() => (typeof fallback === "function" ? fallback() : fallback.current), [fallback])

  const capture = useCallback(
    (trigger: HTMLElement | null) => {
      target.current = focusTargetAfterRemoving(trigger, null) ?? FALLBACK
    },
    [],
  )

  const setTarget = useCallback((element: HTMLElement | null) => {
    target.current = element ?? FALLBACK
  }, [])

  const take = useCallback(() => {
    const next = target.current
    target.current = null
    if (next instanceof HTMLElement && next.isConnected) return next
    return resolveFallback()
  }, [resolveFallback])

  const onCloseAutoFocus = useCallback(
    (event: Event, returnTo?: HTMLElement | null) => {
      if (!target.current) {
        if (returnTo?.isConnected) {
          event.preventDefault()
          returnTo.focus()
        }
        return
      }
      event.preventDefault()
      take()?.focus()
    },
    [take],
  )

  const restore = useCallback(() => {
    window.requestAnimationFrame(() => {
      const active = document.activeElement
      if (active?.closest("[role=dialog], [role=alertdialog]")) return
      const lost = !active || active === document.body || !active.isConnected
      const next = take()
      if (lost) next?.focus()
    })
  }, [take])

  return { capture, setTarget, onCloseAutoFocus, restore }
}
