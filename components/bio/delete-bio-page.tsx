"use client"

import { useId, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { errorText } from "@/components/bio/handle-field"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ApiError } from "@/lib/api-client"
import { displayShareUrl } from "@/lib/bio"
import { useDeleteBioPage, useRefreshBioPage } from "@/lib/hooks/useBioPage"
import { getShortBaseUrl } from "@/lib/utils"

export function DeleteBioPage({ handle, hidden }: { handle: string | null; hidden: boolean }) {
  const noteId = useId()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const deleted = useRef(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const remove = useDeleteBioPage()
  const refresh = useRefreshBioPage()

  const handleDelete = async () => {
    if (submitting.current) return
    submitting.current = true
    setBusy(true)
    try {
      await remove.mutateAsync()
      deleted.current = true
      toast.success("Bio page deleted")
    } catch (error) {
      toast.error(errorText(error))
      if (error instanceof ApiError && (error.status === 404 || error.status === 409)) {
        await refresh().catch(() => undefined)
        setOpen(false)
      }
      submitting.current = false
      setBusy(false)
    }
  }

  const restoreFocus = (event: Event) => {
    if (deleted.current) {
      event.preventDefault()
      return
    }
    const trigger = triggerRef.current
    if (!trigger?.isConnected || trigger.disabled) {
      event.preventDefault()
      headingRef.current?.focus()
    }
  }

  return (
    <section className="rounded-xl border border-destructive/30 bg-card p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-base font-semibold leading-tight tracking-tight text-destructive focus-visible:ring-0 focus-visible:ring-offset-0"
      >
        Delete bio page
      </h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <AlertDialog open={open} onOpenChange={(next) => { if (next || !busy) setOpen(next) }}>
          <AlertDialogTrigger asChild>
            <Button
              ref={triggerRef}
              type="button"
              variant="outline"
              size="sm"
              disabled={hidden}
              aria-describedby={hidden ? noteId : undefined}
              className="shrink-0 self-start border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:self-auto"
            >
              Delete bio page
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent
            onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }}
            onCloseAutoFocus={restoreFocus}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your bio page?</AlertDialogTitle>
              <AlertDialogDescription className="[overflow-wrap:anywhere]">
                {handle
                  ? `Your page at ${displayShareUrl(handle, getShortBaseUrl())} stops working right away and its view counts are deleted. Your short links stay. @${handle} is kept for 30 days so nobody can pretend to be you, and that includes you: you won't be able to use it again until then.`
                  : "Your page and its view counts are deleted. Your short links stay."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                aria-disabled={busy}
                aria-busy={busy}
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                {busy ? "Deleting…" : "Delete page"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {hidden && (
          <p id={noteId} className="text-sm text-muted-foreground">
            An admin hid this page, so it can&apos;t be deleted here. You can still delete your whole account in{" "}
            <Link href="/dashboard/settings" className="text-brand-link">Settings</Link>.
          </p>
        )}
      </div>
    </section>
  )
}
