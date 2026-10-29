"use client"

import { useId, useState } from "react"
import { toast } from "sonner"
import { HandleField, useHandleForm } from "@/components/bio/handle-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ApiError } from "@/lib/api-client"
import { displayShareUrl } from "@/lib/bio"
import { useChangeBioHandle, useRefreshBioPage } from "@/lib/hooks/useBioPage"
import { getShortBaseUrl } from "@/lib/utils"

function useChangeHandle(onChanged?: () => void) {
  const change = useChangeBioHandle()
  const refresh = useRefreshBioPage()
  return useHandleForm(async (handle) => {
    const page = await change.mutateAsync(handle).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) void refresh()
      throw error
    })
    toast.success(`Handle changed to @${page.handle ?? handle}`)
    onChanged?.()
  })
}

function ChangeHandleForm({
  currentHandle,
  onBusyChange,
  onDone,
}: {
  currentHandle: string
  onBusyChange: (busy: boolean) => void
  onDone: () => void
}) {
  const id = useId()
  const form = useChangeHandle(onDone)
  const unchanged = form.handle === "" || form.handle === currentHandle

  return (
    <form
      onSubmit={(event) => {
        if (unchanged) {
          event.preventDefault()
          return
        }
        onBusyChange(true)
        void form.onSubmit(event).finally(() => onBusyChange(false))
      }}
      noValidate
      className="grid gap-4"
    >
      <DialogHeader>
        <DialogTitle>Change handle</DialogTitle>
        <DialogDescription className="[overflow-wrap:anywhere]">
          Your current link {displayShareUrl(currentHandle, getShortBaseUrl())} stops working within 5 minutes. Nobody else can take @{currentHandle} for 30 days.
        </DialogDescription>
      </DialogHeader>
      <HandleField
        id={`${id}-handle`}
        label="New handle"
        value={form.value}
        onChange={form.onChange}
        currentHandle={currentHandle}
        error={form.error}
        inputRef={form.inputRef}
      />
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" disabled={form.busy} onClick={onDone}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={unchanged}
          aria-disabled={form.busy}
          aria-busy={form.busy}
          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          {form.busy ? "Changing…" : "Change handle"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ChangeHandleDialog({ handle }: { handle: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(next) => { if (next || !busy) setOpen(next) }}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">Change handle</Button>
      </DialogTrigger>
      <DialogContent
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }}
        onInteractOutside={(event) => { if (busy) event.preventDefault() }}
      >
        <ChangeHandleForm currentHandle={handle} onBusyChange={setBusy} onDone={() => { setBusy(false); setOpen(false) }} />
      </DialogContent>
    </Dialog>
  )
}

export function ChooseHandleForm() {
  const id = useId()
  const form = useChangeHandle()

  return (
    <form onSubmit={form.onSubmit} noValidate className="mt-3 space-y-3">
      <HandleField
        id={`${id}-handle`}
        label="New handle"
        value={form.value}
        onChange={form.onChange}
        currentHandle={null}
        error={form.error}
        inputRef={form.inputRef}
      />
      <Button
        type="submit"
        size="sm"
        aria-disabled={form.busy}
        aria-busy={form.busy}
        className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
      >
        {form.busy ? "Saving…" : "Choose handle"}
      </Button>
    </form>
  )
}
