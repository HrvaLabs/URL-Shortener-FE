"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChartColumn, CircleAlert, Link2, LoaderCircle, TimerOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { ApiError, connectApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { getBackendOrigin } from "@/lib/utils"

type ConnectState =
  | { kind: "loading" }
  | { kind: "ready"; clientName: string }
  | { kind: "expired" }
  | { kind: "error"; retry: () => void }

type ConnectAction = "approve" | "deny"

function ConnectShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-16 pt-6">
        <Card className="w-full max-w-sm p-8">{children}</Card>
      </main>
    </div>
  )
}

export function ConnectLoading() {
  return (
    <ConnectShell>
      <div className="flex justify-center py-4" role="status" aria-label="Loading">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      </div>
    </ConnectShell>
  )
}

function toBackendUrl(url: string) {
  return url.startsWith("/") ? getBackendOrigin() + url : url
}

export function ConnectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const handle = searchParams.get("request") ?? ""
  const { user, isLoading } = useAuth()
  const signedIn = user !== null
  const [state, setState] = useState<ConnectState>({ kind: "loading" })
  const [pending, setPending] = useState<ConnectAction | null>(null)
  const busy = useRef(false)

  const goToLogin = useCallback(() => {
    router.replace("/login?next=" + encodeURIComponent("/connect?request=" + encodeURIComponent(handle)))
  }, [router, handle])

  const fail = useCallback(
    (error: unknown, retry: () => void) => {
      const status = error instanceof ApiError ? error.status : null
      if (status === 401) goToLogin()
      else if (status === 409 || status === 410) setState({ kind: "expired" })
      else setState({ kind: "error", retry })
    },
    [goToLogin],
  )

  const load = useCallback(() => {
    setState({ kind: "loading" })
    connectApi
      .getRequest(handle)
      .then(({ clientName }) => setState({ kind: "ready", clientName }))
      .catch((error) => fail(error, load))
  }, [handle, fail])

  useEffect(() => {
    if (isLoading) return
    if (!handle) setState({ kind: "expired" })
    else if (!signedIn) goToLogin()
    else load()
  }, [isLoading, signedIn, handle, goToLogin, load])

  const act = (action: ConnectAction, clientName: string) => {
    if (busy.current) return
    busy.current = true
    setPending(action)
    const destination =
      action === "approve"
        ? connectApi.approve(handle).then(({ continueUrl }) => continueUrl)
        : connectApi.deny(handle).then(({ redirectTo }) => redirectTo)
    destination
      .then((url) => window.location.assign(toBackendUrl(url)))
      .catch((error) => {
        busy.current = false
        setPending(null)
        fail(error, () => {
          setState({ kind: "ready", clientName })
          act(action, clientName)
        })
      })
  }

  if (state.kind === "loading") return <ConnectLoading />

  if (state.kind === "expired") {
    return (
      <ConnectShell>
        <div className="text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <TimerOff className="h-5 w-5 text-muted-foreground" />
          </div>
          <h1 className="mt-4 font-display text-2xl">Connect an app</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            This request has expired. Start connecting again from your app.
          </p>
        </div>
      </ConnectShell>
    )
  }

  if (state.kind === "error") {
    return (
      <ConnectShell>
        <div className="text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <CircleAlert className="h-5 w-5 text-destructive" />
          </div>
          <h1 className="mt-4 font-display text-2xl">Connect an app</h1>
          <p className="mt-1.5 text-sm text-muted-foreground" role="alert">
            Something went wrong. Please try again.
          </p>
        </div>
        <Button className="mt-8 w-full" onClick={state.retry}>
          Try again
        </Button>
      </ConnectShell>
    )
  }

  return (
    <ConnectShell>
      <div className="text-center">
        <h1 className="break-words font-display text-2xl">Allow {state.clientName} to use hrva.cc?</h1>
        <p className="mt-1.5 break-words text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user?.email}</span>
        </p>
      </div>
      <ul className="mt-8 divide-y rounded-lg border text-sm">
        <li className="flex items-start gap-3 px-4 py-3">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          Create short links in your account
        </li>
        <li className="flex items-start gap-3 px-4 py-3">
          <ChartColumn className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          Read your links and their visit stats
        </li>
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Links it creates are tagged <span className="rounded-md border px-1.5 py-px">claude</span>.
      </p>
      <div className="mt-8 grid select-none grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="gap-2"
          disabled={pending !== null}
          onClick={() => act("deny", state.clientName)}
        >
          {pending === "deny" && <LoaderCircle className="h-4 w-4 animate-spin" />}
          Cancel
        </Button>
        <Button className="gap-2" disabled={pending !== null} onClick={() => act("approve", state.clientName)}>
          {pending === "approve" && <LoaderCircle className="h-4 w-4 animate-spin" />}
          Allow
        </Button>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        You can disconnect it any time in <span className="whitespace-nowrap">Settings → Connected apps</span>.
      </p>
    </ConnectShell>
  )
}
