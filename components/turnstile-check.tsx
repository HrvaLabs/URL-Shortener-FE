import { HUMAN_CHECK_REQUIRED } from "@/lib/moderation"
import { cn } from "@/lib/utils"

export const CHECKING_LABEL = `Checking${String.fromCodePoint(0x2026)}`

interface TurnstileCheckProps {
  containerRef: (element: HTMLDivElement | null) => void
  missing: boolean
  className?: string
}

export function TurnstileCheck({ containerRef, missing, className }: TurnstileCheckProps) {
  return (
    <>
      <div ref={containerRef} className={cn("empty:hidden", className)} />
      {missing && <p role="alert" className={cn("text-left text-sm text-destructive [overflow-wrap:anywhere]", className)}>{HUMAN_CHECK_REQUIRED}</p>}
    </>
  )
}
