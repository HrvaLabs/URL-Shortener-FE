"use client"

import { useId } from "react"
import { Button } from "@/components/ui/button"

export function SaveBar({
  dirty,
  saving,
  error,
  onSave,
  onDiscard,
}: {
  dirty: boolean
  saving: boolean
  error: string | null
  onSave: () => void
  onDiscard: () => void
}) {
  const statusId = useId()
  return (
    <div
      role="region"
      aria-labelledby={statusId}
      className="sticky bottom-4 z-30 flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.15)] sm:flex-row sm:items-center sm:justify-between sm:pl-4"
    >
      <div className="min-w-0 space-y-1">
        <p id={statusId} role="status" className="text-sm font-medium">
          {dirty ? "You have unsaved changes" : "Saved"}
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive [overflow-wrap:anywhere]">
            {error}
          </p>
        )}
      </div>
      {dirty && (
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={onDiscard}>
            Discard
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            aria-disabled={saving}
            aria-busy={saving}
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </div>
  )
}
