"use client"

import { useAuth } from "@/lib/auth-context"
import { usePublicSettings } from "@/lib/hooks/useSettings"
import { anonymousLimitLineShown } from "@/lib/moderation"
import { cn } from "@/lib/utils"

export function AnonymousLimitLine({ className }: { className?: string }) {
  const { user, isLoading } = useAuth()
  const { data: publicSettings } = usePublicSettings()
  const line = anonymousLimitLineShown(publicSettings, Boolean(user), isLoading)
  if (!line) return null
  return <p className={cn("text-left text-xs text-muted-foreground [overflow-wrap:anywhere]", className)}>{line}</p>
}
