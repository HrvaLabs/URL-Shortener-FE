"use client"

import { Button } from "@/components/ui/button"

export function SaveBar({ saving, onSave, onDiscard }: { saving: boolean; onSave: () => void; onDiscard: () => void }) {
  return (
    <div
      role="region"
      aria-label="Unsaved changes"
      className="sticky bottom-4 z-30 flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.15)] sm:flex-row sm:items-center sm:justify-between sm:pl-4"
    >
      <p className="text-sm font-medium">You have unsaved changes</p>
      <div className="flex gap-2">
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
    </div>
  )
}
