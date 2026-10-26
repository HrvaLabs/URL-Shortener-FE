"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { KeyRound, Plus } from "lucide-react"
import { toast } from "sonner"
import { OPEN_TURN_OFF_EVENT, TWO_STEP_TITLE_ID } from "@/components/two-step-card"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { REQUEST_FAILED, passkeyApi } from "@/lib/api-client"
import { parseServerDateTime } from "@/lib/analytics"
import { useAuth } from "@/lib/auth-context"
import { usePasskeys, useRemovePasskey, useRenamePasskey } from "@/lib/hooks/usePasskeys"
import { useReauthToast } from "@/lib/hooks/useReauthToast"
import { useRefreshTwoStep, useTwoStepStatus } from "@/lib/hooks/useTwoStep"
import { useWebAuthnSupported } from "@/lib/hooks/useWebAuthnSupported"
import type { Passkey, PasskeyKind } from "@/lib/types"
import { formatDate, formatTimeAgo, isLocalAccount } from "@/lib/utils"
import { abortPasskeyRequest, createPasskey, isWebAuthnSupported, passkeyErrorMessage } from "@/lib/webauthn"

const KIND_BADGES: Record<PasskeyKind, { label: string; hint: string; variant: BadgeProps["variant"] }> = {
  SYNCED: {
    label: "Synced passkey",
    hint: "Works on your devices that share this password manager or account",
    variant: "brand",
  },
  DEVICE_BOUND: {
    label: "Device-bound passkey",
    hint: "Only on this device or key",
    variant: "secondary",
  },
  SECOND_STEP_ONLY: {
    label: "Security key (second step only)",
    hint: "Use it after your password; it can't sign you in alone",
    variant: "outline",
  },
  UNKNOWN: {
    label: "Passkey or security key",
    hint: "Try Sign in with a passkey. If it isn't offered, use it after your password.",
    variant: "outline",
  },
}

function errorText(error: unknown): string {
  return error instanceof Error && error.message ? error.message : REQUEST_FAILED
}

export function PasskeysCard() {
  const { user } = useAuth()
  const supported = useWebAuthnSupported()
  const { data: passkeys, isLoading, isFetching, error, refetch } = usePasskeys()
  const { data: twoStep } = useTwoStepStatus()
  const [adding, setAdding] = useState(false)
  const [renaming, setRenaming] = useState<Passkey | null>(null)
  const [removing, setRemoving] = useState<Passkey | null>(null)
  const [removeBusy, setRemoveBusy] = useState(false)
  const removeOpen = useRef(false)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const removePasswordRef = useRef<HTMLInputElement>(null)
  const openedFrom = useRef<HTMLElement | null>(null)
  const focusAfterRemove = useRef(false)
  const openTurnOffAfterClose = useRef(false)

  const isLocal = isLocalAccount(user)
  const onlyTwoStepMethod = !!twoStep?.enabled && !twoStep.totp && twoStep.passkeys <= 1

  const openFrom = (event: React.MouseEvent<HTMLElement>, open: () => void) => {
    openedFrom.current = event.currentTarget
    open()
  }

  const openRemove = (passkey: Passkey) => {
    removeOpen.current = true
    setRemoveBusy(false)
    setRemoving(passkey)
  }

  const closeRemove = () => {
    removeOpen.current = false
    setRemoveBusy(false)
    setRemoving(null)
  }

  const turnOffTwoStepInstead = () => {
    openTurnOffAfterClose.current = true
    closeRemove()
  }

  const restoreFocus = (event: Event) => {
    event.preventDefault()
    if (openTurnOffAfterClose.current) {
      openTurnOffAfterClose.current = false
      openedFrom.current = null
      document.getElementById(TWO_STEP_TITLE_ID)?.focus()
      window.dispatchEvent(new Event(OPEN_TURN_OFF_EVENT))
      return
    }
    const opener = focusAfterRemove.current ? null : openedFrom.current
    focusAfterRemove.current = false
    openedFrom.current = null
    const target = opener?.isConnected ? opener : (addButtonRef.current ?? headingRef.current)
    target?.focus()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle ref={headingRef} tabIndex={-1} className="text-base focus-visible:ring-0 focus-visible:ring-offset-0">
          Passkeys and security keys
        </CardTitle>
        <CardDescription>
          Sign in without a password, or use them as your second step.{" "}
          <Link href="/help/passkeys" className="text-brand-link">How passkeys work</Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error && !passkeys ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-destructive">Failed to load passkeys</p>
            <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()}>Retry</Button>
          </div>
        ) : !passkeys || passkeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Passkeys let you sign in with your fingerprint, face, screen lock or a security key instead of a password. They&apos;re kept on your device or in your password manager and only work on hrva.cc, so they can&apos;t be phished.
          </p>
        ) : (
          <ul className="divide-y">
            {passkeys.map((passkey) => (
              <PasskeyRow
                key={passkey.id}
                passkey={passkey}
                onRename={(event) => openFrom(event, () => setRenaming(passkey))}
                onRemove={(event) => openFrom(event, () => openRemove(passkey))}
              />
            ))}
          </ul>
        )}

        {supported ? (
          <Button ref={addButtonRef} size="sm" className="h-auto min-h-8 gap-1.5 whitespace-normal" onClick={(event) => openFrom(event, () => setAdding(true))}>
            <Plus className="h-4 w-4 shrink-0" />
            Add a passkey or security key
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            This browser can&apos;t use passkeys. You can still rename or remove them here.
          </p>
        )}
      </CardContent>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent onCloseAutoFocus={restoreFocus}>
          <AddPasskeyForm isLocal={isLocal} onDone={() => setAdding(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!renaming} onOpenChange={(open) => { if (!open) setRenaming(null) }}>
        <DialogContent onCloseAutoFocus={restoreFocus}>
          {renaming && <RenamePasskeyForm passkey={renaming} onDone={() => setRenaming(null)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removing} onOpenChange={(open) => { if (!open && !removeBusy) closeRemove() }}>
        <AlertDialogContent
          onOpenAutoFocus={(event) => {
            if (!removePasswordRef.current) return
            event.preventDefault()
            removePasswordRef.current.focus()
          }}
          onCloseAutoFocus={restoreFocus}
          onEscapeKeyDown={(event) => { if (removeBusy) event.preventDefault() }}
        >
          {removing && (
            <RemovePasskeyForm
              passkey={removing}
              isLocal={isLocal}
              onlyTwoStepMethod={onlyTwoStepMethod}
              passwordRef={removePasswordRef}
              busy={removeBusy}
              onBusyChange={setRemoveBusy}
              onTurnOffTwoStep={turnOffTwoStepInstead}
              onRemoved={() => {
                if (!removeOpen.current) return
                focusAfterRemove.current = true
                closeRemove()
              }}
              onDone={closeRemove}
            />
          )}
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function PasskeyRow({
  passkey,
  onRename,
  onRemove,
}: {
  passkey: Passkey
  onRename: (event: React.MouseEvent<HTMLButtonElement>) => void
  onRemove: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  const badge = KIND_BADGES[passkey.kind] ?? KIND_BADGES.UNKNOWN
  return (
    <li className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="flex min-w-0 gap-3">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="min-w-0 text-sm font-medium wrap-anywhere">{passkey.label}</p>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{badge.hint}</p>
          <p className="flex flex-wrap gap-x-1.5 text-xs tabular-nums text-muted-foreground">
            <span>Added {formatDate(parseServerDateTime(passkey.createdAt))}</span>
            <span aria-hidden>·</span>
            <span>
              {passkey.lastUsedAt ? `Last used ${formatTimeAgo(parseServerDateTime(passkey.lastUsedAt))}` : "Never used"}
            </span>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2 pl-7 sm:pl-0">
        <Button variant="outline" size="sm" onClick={onRename} aria-label={`Rename ${passkey.label}`}>
          Rename
        </Button>
        <Button variant="outline" size="sm" onClick={onRemove} aria-label={`Remove ${passkey.label}`}>
          Remove
        </Button>
      </div>
    </li>
  )
}

function AddPasskeyForm({ isLocal, onDone }: { isLocal: boolean; onDone: () => void }) {
  const [label, setLabel] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState<"waiting" | "adding" | null>(null)
  const mounted = useRef(true)
  const submitting = useRef(false)
  const ceremonyInFlight = useRef(false)
  const passwordRef = useRef<HTMLInputElement>(null)
  const refreshTwoStep = useRefreshTwoStep()
  const showError = useReauthToast()

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (ceremonyInFlight.current) abortPasskeyRequest()
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting.current || !isWebAuthnSupported()) return
    submitting.current = true
    setBusy("waiting")
    let ceremony
    try {
      ceremony = await passkeyApi.registrationOptions(isLocal ? password : undefined)
    } catch (error) {
      if (!mounted.current) return
      if (showError(error, errorText(error))) {
        onDone()
        return
      }
      submitting.current = false
      setBusy(null)
      passwordRef.current?.focus()
      passwordRef.current?.select()
      return
    }
    if (!mounted.current) return
    try {
      ceremonyInFlight.current = true
      let credential
      try {
        credential = await createPasskey(ceremony.options)
      } finally {
        ceremonyInFlight.current = false
      }
      if (mounted.current) setBusy("adding")
      await passkeyApi.register(ceremony.ceremonyId, credential, label.trim())
      toast.success("Passkey added. We've emailed you about it.")
      await refreshTwoStep()
      if (mounted.current) onDone()
    } catch (error) {
      if (!mounted.current) return
      const message = passkeyErrorMessage(error, "register")
      if (message) toast.error(message)
      submitting.current = false
      setBusy(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Add a passkey or security key</DialogTitle>
        <DialogDescription>
          Your browser will offer this device, a password manager, your phone or a USB or NFC security key.
        </DialogDescription>
      </DialogHeader>
      <div>
        <Label htmlFor="passkeyLabel">Name</Label>
        <Input
          id="passkeyLabel"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="For example MacBook, iPhone or YubiKey"
          maxLength={64}
          autoComplete="off"
          className="mt-1.5 h-10"
        />
      </div>
      {isLocal && (
        <div>
          <Label htmlFor="passkeyPassword">Current password</Label>
          <Input
            ref={passwordRef}
            id="passkeyPassword"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1.5 h-10"
          />
        </div>
      )}
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button
          type="submit"
          className="h-auto min-h-10 whitespace-normal aria-disabled:pointer-events-none aria-disabled:opacity-50"
          aria-disabled={busy !== null}
          aria-busy={busy !== null}
        >
          {busy === "waiting" ? "Waiting for your passkey…" : busy === "adding" ? "Adding…" : "Continue"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function RenamePasskeyForm({ passkey, onDone }: { passkey: Passkey; onDone: () => void }) {
  const [label, setLabel] = useState(passkey.label)
  const submitting = useRef(false)
  const labelRef = useRef<HTMLInputElement>(null)
  const renamePasskey = useRenamePasskey()
  const trimmed = label.trim()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!trimmed || submitting.current) return
    submitting.current = true
    try {
      await renamePasskey.mutateAsync({ id: passkey.id, label: trimmed })
      toast.success("Name saved")
      onDone()
    } catch (error) {
      toast.error(errorText(error))
      submitting.current = false
      labelRef.current?.focus()
      labelRef.current?.select()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle className="leading-snug wrap-anywhere">Rename {passkey.label}</DialogTitle>
        <DialogDescription className="sr-only">Give this passkey or security key a new name.</DialogDescription>
      </DialogHeader>
      <div>
        <Label htmlFor="renameLabel">Name</Label>
        <Input
          ref={labelRef}
          id="renameLabel"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={64}
          autoComplete="off"
          required
          className="mt-1.5 h-10"
        />
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={renamePasskey.isPending || !trimmed} aria-busy={renamePasskey.isPending}>
          {renamePasskey.isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function RemovePasskeyForm({
  passkey,
  isLocal,
  onlyTwoStepMethod,
  passwordRef,
  busy,
  onBusyChange,
  onTurnOffTwoStep,
  onRemoved,
  onDone,
}: {
  passkey: Passkey
  isLocal: boolean
  onlyTwoStepMethod: boolean
  passwordRef: React.RefObject<HTMLInputElement | null>
  busy: boolean
  onBusyChange: (busy: boolean) => void
  onTurnOffTwoStep: () => void
  onRemoved: () => void
  onDone: () => void
}) {
  const [password, setPassword] = useState("")
  const submitting = useRef(false)
  const focusAfterFailure = useRef(false)
  const removeButtonRef = useRef<HTMLButtonElement>(null)
  const removePasskey = useRemovePasskey()
  const { refreshUser } = useAuth()
  const showError = useReauthToast()

  useEffect(() => {
    if (busy || !focusAfterFailure.current) return
    focusAfterFailure.current = false
    const field = passwordRef.current
    if (field) {
      field.focus()
      field.select()
    } else {
      removeButtonRef.current?.focus()
    }
  }, [busy, passwordRef])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    onBusyChange(true)
    try {
      await removePasskey.mutateAsync({ id: passkey.id, password: isLocal ? password : undefined })
    } catch (error) {
      if (showError(error, errorText(error))) {
        onDone()
        return
      }
      submitting.current = false
      focusAfterFailure.current = true
      onBusyChange(false)
      return
    }
    toast.success(`Removed ${passkey.label}`)
    await refreshUser()
    onRemoved()
  }

  if (onlyTwoStepMethod) {
    return (
      <div className="grid gap-4">
        <AlertDialogHeader>
          <AlertDialogTitle className="wrap-anywhere">Remove {passkey.label}?</AlertDialogTitle>
          <AlertDialogDescription>
            This is your only two-step method. Turn off two-step verification, or add another passkey, security key or
            authenticator app first.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
          <Button type="button" variant="outline" className="h-auto min-h-10 whitespace-normal" onClick={onTurnOffTwoStep}>
            Turn off two-step verification
          </Button>
        </AlertDialogFooter>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <AlertDialogHeader>
        <AlertDialogTitle className="wrap-anywhere">Remove {passkey.label}?</AlertDialogTitle>
        <AlertDialogDescription>
          You won&apos;t be able to sign in with it anymore. Also delete it from your password manager or device.
        </AlertDialogDescription>
      </AlertDialogHeader>
      {isLocal && (
        <div>
          <Label htmlFor="removePassword">Current password</Label>
          <Input
            ref={passwordRef}
            id="removePassword"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1.5 h-10"
          />
        </div>
      )}
      <AlertDialogFooter>
        <AlertDialogCancel type="button" disabled={busy}>Cancel</AlertDialogCancel>
        <Button ref={removeButtonRef} type="submit" variant="destructive" disabled={busy} aria-busy={busy}>
          {busy ? "Removing…" : "Remove"}
        </Button>
      </AlertDialogFooter>
    </form>
  )
}
