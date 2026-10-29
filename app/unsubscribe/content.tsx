"use client"

import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ApiError, notificationApi } from "@/lib/api-client"
import { EMAIL_NOTIFICATION_NOUNS, unsubscribeTokenType } from "@/lib/notifications"
import type { UnsubscribeResult } from "@/lib/types"

const SETTINGS_HREF = "/dashboard/settings#notifications"

const INVALID_LINK = "This unsubscribe link isn't valid. You can turn emails off in Settings, under Notifications."

const DONE_KEY = "hrva:unsubscribed"

const sentenceCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

const rememberDone = (result: UnsubscribeResult) => {
  try {
    window.sessionStorage.setItem(DONE_KEY, JSON.stringify({ type: result.type, alreadyOff: result.alreadyOff }))
  } catch {
    return
  }
}

const rememberedDone = (): UnsubscribeResult | null => {
  try {
    const stored: unknown = JSON.parse(window.sessionStorage.getItem(DONE_KEY) ?? "null")
    if (stored === null || typeof stored !== "object") return null
    const { type, alreadyOff } = stored as Record<string, unknown>
    if (typeof type !== "string" || !Object.hasOwn(EMAIL_NOTIFICATION_NOUNS, type) || typeof alreadyOff !== "boolean") return null
    return { type: type as UnsubscribeResult["type"], alreadyOff }
  } catch {
    return null
  }
}

const initialState = (token: string): State => {
  if (token) return { kind: "idle" }
  const done = typeof window === "undefined" ? null : rememberedDone()
  return done ? { kind: "done", result: done } : { kind: "invalid", message: INVALID_LINK }
}

type State =
  | { kind: "idle" }
  | { kind: "done"; result: UnsubscribeResult }
  | { kind: "invalid"; message: string }
  | { kind: "failed"; message: string }

export function UnsubscribeContent() {
  const token = useSearchParams().get("token")?.trim() ?? ""
  const [state, setState] = useState<State>(() => initialState(token))
  const [sending, setSending] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const unsubscribe = async () => {
    if (sending) return
    setSending(true)
    let next: State
    try {
      next = { kind: "done", result: await notificationApi.unsubscribe(token) }
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : "Something went wrong. Try again."
      next = error instanceof ApiError && error.status === 400 ? { kind: "invalid", message } : { kind: "failed", message }
    }
    flushSync(() => {
      setState(next)
      setSending(false)
    })
    if (next.kind === "done") {
      rememberDone(next.result)
      window.history.replaceState(null, "", "/unsubscribe")
    }
    if (next.kind === "done" || next.kind === "invalid") headingRef.current?.focus()
  }

  const heading = (text: string) => (
    <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl [overflow-wrap:anywhere] focus-visible:ring-0 focus-visible:ring-offset-0">
      {text}
    </h1>
  )

  const settingsLink = (
    <Link href={SETTINGS_HREF} className="text-brand-link">Settings</Link>
  )

  if (state.kind === "done") {
    const noun = EMAIL_NOTIFICATION_NOUNS[state.result.type] ?? "these emails"
    return (
      <div className="space-y-3">
        {heading(state.result.alreadyOff ? `${sentenceCase(noun)} were already off.` : `Done. You won't get ${noun} any more.`)}
        <p className="text-sm text-muted-foreground">You can turn them back on any time in {settingsLink}.</p>
      </div>
    )
  }

  if (state.kind === "invalid") {
    return (
      <div className="space-y-3">
        {heading("Unsubscribe")}
        <p role="alert" className="text-sm text-destructive [overflow-wrap:anywhere]">{state.message}</p>
        <p className="text-sm text-muted-foreground">Go to {settingsLink}.</p>
      </div>
    )
  }

  const tokenType = unsubscribeTokenType(token)
  const question = tokenType ? `Stop getting ${EMAIL_NOTIFICATION_NOUNS[tokenType]} from hrva.cc?` : "Stop getting this kind of email from hrva.cc?"

  return (
    <div className="space-y-3">
      {heading("Unsubscribe")}
      <p className="text-sm text-muted-foreground">{question}</p>
      {state.kind === "failed" && <p role="alert" className="text-sm text-destructive [overflow-wrap:anywhere]">{state.message}</p>}
      <Button
        type="button"
        onClick={unsubscribe}
        aria-disabled={sending}
        aria-busy={sending}
        className="mt-3 w-full aria-disabled:opacity-50"
      >
        {sending ? "Unsubscribing..." : "Unsubscribe"}
      </Button>
    </div>
  )
}
