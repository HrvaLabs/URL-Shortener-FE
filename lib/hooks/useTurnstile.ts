"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePublicSettings } from "@/lib/hooks/useSettings"
import { HUMAN_CHECK_WAIT_MS, NO_TURNSTILE_TOKEN, TURNSTILE_SCRIPT_URL, freshTurnstileToken, nextTurnstileState, turnstileNeedsReload, type TurnstileEvent } from "@/lib/moderation"

interface TurnstileRenderOptions {
  sitekey: string
  appearance: "always" | "execute" | "interaction-only"
  size: "normal" | "flexible" | "compact"
  theme: "auto" | "light" | "dark"
  callback: (token: string) => void
  "expired-callback": () => void
  "error-callback": () => boolean
  "before-interactive-callback": () => void
  "after-interactive-callback": () => void
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string | null | undefined
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptLoad: Promise<TurnstileApi> | null = null

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (scriptLoad) return scriptLoad
  scriptLoad = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = TURNSTILE_SCRIPT_URL
    script.async = true
    const fail = () => {
      script.remove()
      scriptLoad = null
      reject(new Error("Turnstile didn't load"))
    }
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : fail())
    script.onerror = fail
    document.head.appendChild(script)
  })
  return scriptLoad
}

interface UseTurnstileOptions {
  enabled: boolean
  startAtOnce?: boolean
}

export function useTurnstile({ enabled, startAtOnce = false }: UseTurnstileOptions) {
  const { data: publicSettings } = usePublicSettings()
  const siteKey = enabled ? publicSettings?.turnstileSiteKey?.trim() || null : null
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [started, setStarted] = useState(startAtOnce)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [state, setState] = useState(NO_TURNSTILE_TOKEN)
  const stateRef = useRef(NO_TURNSTILE_TOKEN)
  const widgetRef = useRef<{ api: TurnstileApi; id: string } | null>(null)
  const loadFailedRef = useRef(false)
  const waitersRef = useRef(new Set<(token: string | null) => void>())

  const apply = useCallback((event: TurnstileEvent) => {
    const next = nextTurnstileState(stateRef.current, event)
    stateRef.current = next
    setState(next)
    if (next.token) for (const waiter of [...waitersRef.current]) waiter(next.token)
  }, [])

  useEffect(() => {
    if (!started || !siteKey || !container) return
    let cancelled = false
    loadTurnstile()
      .then((api) => {
        if (cancelled) return
        const id = api.render(container, {
          sitekey: siteKey,
          appearance: "interaction-only",
          size: "flexible",
          theme: "auto",
          callback: (token) => apply({ type: "token", token, at: Date.now() }),
          "expired-callback": () => apply({ type: "expired" }),
          "error-callback": () => {
            apply({ type: "error" })
            return true
          },
          "before-interactive-callback": () => apply({ type: "interactive" }),
          "after-interactive-callback": () => apply({ type: "settled" }),
        })
        if (id) widgetRef.current = { api, id }
      })
      .catch(() => {
        if (!cancelled) loadFailedRef.current = true
      })
    return () => {
      cancelled = true
      const widget = widgetRef.current
      widgetRef.current = null
      if (widget) widget.api.remove(widget.id)
      apply({ type: "expired" })
    }
  }, [started, siteKey, container, apply, loadAttempt])

  const start = useCallback(() => {
    setStarted(true)
    if (!turnstileNeedsReload(widgetRef.current !== null, loadFailedRef.current)) return
    loadFailedRef.current = false
    setLoadAttempt((attempt) => attempt + 1)
  }, [])

  const reset = useCallback(() => {
    apply({ type: "submitted" })
    const widget = widgetRef.current
    if (widget) widget.api.reset(widget.id)
  }, [apply])

  const waitForToken = useCallback((timeoutMs = HUMAN_CHECK_WAIT_MS): Promise<string | null> => {
    const fresh = freshTurnstileToken(stateRef.current, Date.now())
    if (fresh) return Promise.resolve(fresh)
    if (stateRef.current.token) reset()
    start()
    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout>
      const done = (token: string | null) => {
        clearTimeout(timer)
        waitersRef.current.delete(done)
        resolve(token)
      }
      const giveUpUnlessTicking = () => {
        if (stateRef.current.interactive) timer = setTimeout(giveUpUnlessTicking, timeoutMs)
        else done(null)
      }
      timer = setTimeout(giveUpUnlessTicking, timeoutMs)
      waitersRef.current.add(done)
    })
  }, [reset, start])

  return { containerRef: setContainer, token: state.token, interactive: state.interactive, active: siteKey !== null, start, reset, waitForToken }
}
