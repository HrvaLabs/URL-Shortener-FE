import { HUMAN_CHECK_REQUIRED, TICK_THE_BOX } from "@/lib/moderation"
import { cn } from "@/lib/utils"

export const CHECKING_LABEL = `Checking${String.fromCodePoint(0x2026)}`

interface TurnstileCheckProps {
  containerRef: (element: HTMLDivElement | null) => void
  missing: boolean
  ticking?: boolean
  className?: string
}

export function TurnstileCheck({ containerRef, missing, ticking = false, className }: TurnstileCheckProps) {
  return (
    <>
      <div ref={containerRef} className={cn("empty:hidden", className)} />
      {ticking && <p role="status" className={cn("text-left text-sm text-muted-foreground [overflow-wrap:anywhere]", className)}>{TICK_THE_BOX}</p>}
      {missing && <p role="alert" className={cn("text-left text-sm text-destructive [overflow-wrap:anywhere]", className)}>{HUMAN_CHECK_REQUIRED}</p>}
    </>
  )
}
