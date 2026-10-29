"use client"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteChannelDialogProps {
  channelName: string | null
  busy: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCloseAutoFocus: (event: Event) => void
}

export function DeleteChannelDialog({ channelName, busy, onOpenChange, onConfirm, onCloseAutoFocus }: DeleteChannelDialogProps) {
  return (
    <AlertDialog open={channelName !== null} onOpenChange={(next) => { if (next || !busy) onOpenChange(next) }}>
      <AlertDialogContent
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="[overflow-wrap:anywhere]">Delete {channelName}?</AlertDialogTitle>
          <AlertDialogDescription>It stops getting notifications at once. This can&apos;t be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={() => { if (!busy) onConfirm() }}
            aria-disabled={busy}
            aria-busy={busy}
            className="aria-disabled:opacity-50"
          >
            {busy ? "Deleting..." : "Delete channel"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
