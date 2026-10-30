"use client"

import Link from "next/link"
import { TriangleAlert } from "lucide-react"
import { useAdminSettings } from "@/lib/hooks/useSettings"
import { safetyOffLines } from "@/lib/moderation"

export function SafetySwitchesOff({ showLink = false }: { showLink?: boolean }) {
  const { data } = useAdminSettings()
  const lines = data ? safetyOffLines(data) : []
  if (lines.length === 0) return null

  return (
    <div role="status" className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
      <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div className="min-w-0 space-y-1">
        {lines.map((line) => (
          <p key={line} className="font-medium [overflow-wrap:anywhere]">
            {line}
          </p>
        ))}
        {showLink && (
          <Link href="/admin/settings" className="inline-block rounded-sm underline underline-offset-2 hover:text-foreground/80">
            Site settings
          </Link>
        )}
      </div>
    </div>
  )
}
