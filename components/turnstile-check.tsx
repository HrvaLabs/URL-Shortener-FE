import Link from "next/link"
import { HUMAN_CHECK_REQUIRED, HUMAN_CHECK_UNCONFIRMED, TICK_THE_BOX, type HumanCheckRefusal } from "@/lib/moderation"
import { cn } from "@/lib/utils"

export const CHECKING_LABEL = `Checking${String.fromCodePoint(0x2026)}`

const SIGN_IN = "sign in"

const [UNCONFIRMED_BEFORE, UNCONFIRMED_AFTER] = HUMAN_CHECK_UNCONFIRMED.split(SIGN_IN)

interface TurnstileCheckProps {
  containerRef: (element: HTMLDivElement | null) => void
  refusal: HumanCheckRefusal | null
  ticking?: boolean
  className?: string
}

export function TurnstileCheck({ containerRef, refusal, ticking = false, className }: TurnstileCheckProps) {
  return (
    <>
      <div ref={containerRef} className={cn("empty:hidden", className)} />
      {ticking && <p role="status" className={cn("text-left text-sm text-muted-foreground [overflow-wrap:anywhere]", className)}>{TICK_THE_BOX}</p>}
      {refusal === "complete" && <p role="alert" className={cn("text-left text-sm text-destructive [overflow-wrap:anywhere]", className)}>{HUMAN_CHECK_REQUIRED}</p>}
      {refusal === "unconfirmed" && (
        <p role="alert" className={cn("text-left text-sm text-destructive [overflow-wrap:anywhere]", className)}>
          {UNCONFIRMED_BEFORE}
          <Link href="/login" className="font-medium underline underline-offset-4">{SIGN_IN}</Link>
          {UNCONFIRMED_AFTER}
        </p>
      )}
    </>
  )
}
