"use client"

import Link from "next/link"
import { usePublicSettings } from "@/lib/hooks/useSettings"
import { ANONYMOUS_PAUSED, signupsPaused } from "@/lib/moderation"
import { cn } from "@/lib/utils"

interface AnonymousNoticeProps {
  id?: string
  className?: string
}

const linkClass = "font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"

export function AnonymousNotice({ id, className }: AnonymousNoticeProps) {
  const { data: publicSettings } = usePublicSettings()
  const canSignUp = !signupsPaused(publicSettings)
  return (
    <div id={id} role="status" className={cn("rounded-xl border bg-muted/40 p-4 text-left text-sm leading-relaxed [overflow-wrap:anywhere]", className)}>
      <p className="font-medium text-foreground">{ANONYMOUS_PAUSED}</p>
      <p className="mt-1 text-muted-foreground">
        <Link href="/login" className={linkClass}>Sign in</Link> to make a link.{" "}
        {canSignUp && (
          <>
            <Link href="/register" className={linkClass}>Create an account</Link> if you don&apos;t have one.{" "}
          </>
        )}
        <Link href="/help/links-without-an-account#paused" className={linkClass}>About links without an account</Link>.
      </p>
    </div>
  )
}
