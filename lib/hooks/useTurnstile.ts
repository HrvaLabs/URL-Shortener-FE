"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePublicSettings } from "@/lib/hooks/useSettings"
import { HUMAN_CHECK_WAIT_MS, NO_TURNSTILE_TOKEN, TURNSTILE_SCRIPT_URL, nextTurnstileState, type TurnstileEvent } from "@/lib/moderation"

interface TurnstileRenderOptions {
  sitekey: string
  appearance: "always" | "execute" | "interaction-only"
  size: "normal" | "flexible" | "compact"
  theme: "auto" | "light" | "dark"
  callback: (token: string) => void
  "expired-callback": () => void
  "error-callback": () => boolean
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
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile didn't load")))
    script.onerror = () => {
      script.remove()
      scriptLoad = null
      reject(new Error("Turnstile didn't load"))
    }
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
  const [state, setState] = useState(NO_TURNSTILE_TOKEN)
  const stateRef = useRef(NO_TURNSTILE_TOKEN)
  const widgetRef = useRef<{ api: TurnstileApi; id: string } | null>(null)
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
          callback: (token) => apply({ type: "token", token }),
          "expired-callback": () => apply({ type: "expired" }),
          "error-callback": () => {
            apply({ type: "error" })
            return true
          },
        })
        if (id) widgetRef.current = { api, id }
      })
      .catch(() => {})
    return () => {
      cancelled = true
      const widget = widgetRef.current
      widgetRef.current = null
      if (widget) widget.api.remove(widget.id)
      apply({ type: "expired" })
    }
  }, [started, siteKey, container, apply])

  const start = useCallback(() => setStarted(true), [])

  const reset = useCallback(() => {
    apply({ type: "submitted" })
    const widget = widgetRef.current
    if (widget) widget.api.reset(widget.id)
  }, [apply])

  const waitForToken = useCallback((timeoutMs = HUMAN_CHECK_WAIT_MS): Promise<string | null> => {
    const current = stateRef.current.token
    if (current) return Promise.resolve(current)
    return new Promise((resolve) => {
      const done = (token: string | null) => {
        clearTimeout(timer)
        waitersRef.current.delete(done)
        resolve(token)
      }
      const timer = setTimeout(() => done(null), timeoutMs)
      waitersRef.current.add(done)
    })
  }, [])

  return { containerRef: setContainer, token: state.token, active: siteKey !== null, start, reset, waitForToken }
}
