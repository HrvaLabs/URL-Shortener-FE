"use client"

import { LoaderCircle } from "lucide-react"
import { RECONNECTING_TEXT, useReconnecting } from "@/lib/reconnecting"

export function ReconnectingNotice() {
  const reconnecting = useReconnecting()
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4">
      {reconnecting && (
        <div className="flex items-center gap-2 rounded-full border bg-popover px-4 py-2 text-sm font-medium text-popover-foreground shadow-md">
          <LoaderCircle aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" />
          {RECONNECTING_TEXT}
        </div>
      )}
    </div>
  )
}
