"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { parseServerDateTime } from "@/lib/analytics"
import { ApiError, REQUEST_FAILED } from "@/lib/api-client"
import { useRemovePassword, useTurnOffSignInMethod, useTurnOnSignInMethod } from "@/lib/hooks/useSignInMethods"
import { useMe } from "@/lib/hooks/useUsers"
import { isSwitchable, signInMethodLabels } from "@/lib/sign-in-methods"
import type { SignInMethod, SignInMethodUse } from "@/lib/types"
import { cn, formatDate, formatDateTime } from "@/lib/utils"

type ChangeKind = "turn-off" | "turn-on" | "remove-password"

interface Change {
  kind: ChangeKind
  method: SignInMethod
}

const wrap = "[overflow-wrap:anywhere]"

function dialogText(change: Change): { title: string; description: string; confirm: string; busy: string; success: string } {
  const name = signInMethodLabels[change.method]
  if (change.kind === "turn-off") {
    return {
      title: `Turn off ${name} sign-in?`,
      description: `Signing in with ${name} will be refused for this account until you turn it back on here. To do that, sign in another way first. We'll email you about the change.`,
      confirm: "Turn off",
      busy: "Turning off...",
      success: `${name} sign-in turned off`,
    }
  }
  if (change.kind === "turn-on") {
    return {
      title: `Turn ${name} sign-in back on?`,
      description: `Signing in with ${name} will work again. You can turn it off again here. We'll email you about the change.`,
      confirm: "Turn back on",
      busy: "Turning on...",
      success: `${name} sign-in turned back on`,
    }
  }
  return {
    title: "Remove your password?",
    description: "You won't be able to sign in with your email and password anymore. To get a password again, use Forgot password on the sign-in page and set a new one. We'll email you about the change.",
    confirm: "Remove password",
    busy: "Removing...",
    success: "Password removed",
  }
}

export function SignInMethodsCard() {
  const { data: me, isLoading, error, refetch, isFetching } = useMe()
  const recorded = me?.signInMethods ?? []
  const passwordWithoutRow = me?.passwordSet === true && !recorded.some((use) => use.method === "PASSWORD")
  const methods = passwordWithoutRow ? [{ method: "PASSWORD" as const, firstUsedAt: "", lastUsedAt: "", turnedOffAt: null }, ...recorded] : recorded
  const [change, setChange] = useState<Change | null>(null)
  const [busy, setBusy] = useState(false)
  const buttons = useRef<Partial<Record<SignInMethod, HTMLButtonElement | null>>>({})
  const openedFrom = useRef<SignInMethod | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const open = (next: Change) => {
    openedFrom.current = next.method
    setBusy(false)
    setChange(next)
  }

  const close = () => {
    setBusy(false)
    setChange(null)
  }

  const restoreFocus = (event: Event) => {
    event.preventDefault()
    const opener = openedFrom.current ? buttons.current[openedFrom.current] : null
    openedFrom.current = null
    const target = opener?.isConnected ? opener : headingRef.current
    target?.focus()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle ref={headingRef} tabIndex={-1} className="text-base focus-visible:ring-0 focus-visible:ring-offset-0">
          Sign-in methods
        </CardTitle>
        <CardDescription>Every way you&apos;ve signed in to this account</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : error && !me ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-destructive">Failed to load sign-in methods</p>
            <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()}>Retry</Button>
          </div>
        ) : methods.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sign-ins recorded yet.</p>
        ) : (
          <ul className="divide-y">
            {methods.map((use) => (
              <MethodRow
                key={use.method}
                use={use}
                passwordSet={me?.passwordSet}
                buttonRef={(node) => { buttons.current[use.method] = node }}
                onChange={open}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <AlertDialog open={!!change} onOpenChange={(next) => { if (!next && !busy) close() }}>
        <AlertDialogContent
          onOpenAutoFocus={(event) => {
            if (!passwordRef.current) return
            event.preventDefault()
            passwordRef.current.focus()
          }}
          onCloseAutoFocus={restoreFocus}
          onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }}
        >
          {change && (
            <ChangeForm
              key={`${change.kind}-${change.method}`}
              change={change}
              busy={busy}
              onBusyChange={setBusy}
              passwordRef={passwordRef}
              onDone={close}
            />
          )}
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function MethodRow({
  use,
  passwordSet,
  buttonRef,
  onChange,
}: {
  use: SignInMethodUse
  passwordSet: boolean | undefined
  buttonRef: (node: HTMLButtonElement | null) => void
  onChange: (change: Change) => void
}) {
  const name = signInMethodLabels[use.method] ?? use.method
  const turnedOffAt = use.turnedOffAt
  const off = !!turnedOffAt
  const noPassword = use.method === "PASSWORD" && passwordSet === false

  return (
    <li className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 space-y-0.5">
        <p className={cn("text-sm font-medium", wrap)}>{name}</p>
        {use.lastUsedAt && (
          <p className="text-xs tabular-nums text-muted-foreground">Last used {formatDateTime(parseServerDateTime(use.lastUsedAt))}</p>
        )}
        {turnedOffAt && (
          <p className="text-xs tabular-nums text-muted-foreground">Turned off {formatDate(parseServerDateTime(turnedOffAt))}</p>
        )}
        {noPassword && (
          <p className="text-xs text-muted-foreground">
            No password set. Use <Link href="/reset-password" className="text-brand-link">Forgot password</Link> to set one.
          </p>
        )}
      </div>
      {isSwitchable(use.method) && (
        <Button
          ref={buttonRef}
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 self-start"
          aria-label={`${off ? "Turn back on" : "Turn off"} ${name} sign-in`}
          onClick={() => onChange({ kind: off ? "turn-on" : "turn-off", method: use.method })}
        >
          {off ? "Turn back on" : "Turn off"}
        </Button>
      )}
      {use.method === "PASSWORD" && passwordSet === true && (
        <Button
          ref={buttonRef}
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 self-start"
          onClick={() => onChange({ kind: "remove-password", method: "PASSWORD" })}
        >
          Remove password
        </Button>
      )}
    </li>
  )
}

function errorText(error: unknown): string {
  return error instanceof Error && error.message ? error.message : REQUEST_FAILED
}

function ChangeForm({
  change,
  busy,
  onBusyChange,
  passwordRef,
  onDone,
}: {
  change: Change
  busy: boolean
  onBusyChange: (busy: boolean) => void
  passwordRef: React.RefObject<HTMLInputElement | null>
  onDone: () => void
}) {
  const [password, setPassword] = useState("")
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)
  const turnOff = useTurnOffSignInMethod()
  const turnOn = useTurnOnSignInMethod()
  const removePassword = useRemovePassword()
  const text = dialogText(change)
  const needsPassword = change.kind === "remove-password"

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting.current) return
    if (needsPassword && !password) {
      setFieldError("Enter your current password.")
      passwordRef.current?.focus()
      return
    }
    submitting.current = true
    setError(null)
    setFieldError(null)
    onBusyChange(true)
    try {
      if (change.kind === "turn-off") await turnOff.mutateAsync(change.method)
      else if (change.kind === "turn-on") await turnOn.mutateAsync(change.method)
      else await removePassword.mutateAsync(password)
    } catch (err) {
      submitting.current = false
      onBusyChange(false)
      const field = err instanceof ApiError ? err.fields.currentPassword : undefined
      if (needsPassword && field) {
        setFieldError(field)
        passwordRef.current?.focus()
        passwordRef.current?.select()
      } else {
        setError(errorText(err))
      }
      return
    }
    toast.success(text.success)
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <AlertDialogHeader>
        <AlertDialogTitle className={wrap}>{text.title}</AlertDialogTitle>
        <AlertDialogDescription>{text.description}</AlertDialogDescription>
      </AlertDialogHeader>
      {needsPassword && (
        <div>
          <Label htmlFor="removePasswordCurrent">Current password</Label>
          <Input
            ref={passwordRef}
            id="removePasswordCurrent"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldError(null) }}
            readOnly={busy}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? "removePasswordCurrentError" : undefined}
            className="mt-1.5 h-10"
          />
          {fieldError && (
            <p id="removePasswordCurrentError" role="alert" className={cn("mt-1.5 text-sm text-destructive", wrap)}>
              {fieldError}
            </p>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className={cn("text-sm text-destructive", wrap)}>{error}</p>
      )}
      <AlertDialogFooter className="gap-2 sm:gap-0">
        <AlertDialogCancel type="button" disabled={busy}>Cancel</AlertDialogCancel>
        <Button
          type="submit"
          variant={change.kind === "turn-on" ? "default" : "destructive"}
          className="h-auto min-h-10 whitespace-normal aria-disabled:pointer-events-none aria-disabled:opacity-50"
          aria-disabled={busy}
          aria-busy={busy}
        >
          {busy ? text.busy : text.confirm}
        </Button>
      </AlertDialogFooter>
    </form>
  )
}
