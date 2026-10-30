import { Check, Circle } from "lucide-react"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { DOMAIN_STATUS_LABELS, DOMAIN_STEP_LABELS } from "@/lib/domains"
import type { CustomDomainStatus, DomainSteps } from "@/lib/types"

const STATUS_VARIANTS: Record<CustomDomainStatus, BadgeProps["variant"]> = {
  PENDING_REVIEW: "secondary",
  APPROVED_PROVISIONING: "brand",
  AWAITING_DNS: "warning",
  ACTIVE: "success",
  REJECTED: "destructive",
  DISABLED: "destructive",
  ERROR: "destructive",
  DELETED: "secondary",
}

const STEPS = Object.keys(DOMAIN_STEP_LABELS) as (keyof DomainSteps)[]

export function DomainStatusBadge({ status }: { status: CustomDomainStatus }) {
  const variant = STATUS_VARIANTS[status]
  return (
    <Badge variant={variant} className={variant === "destructive" ? "dark:bg-destructive/5" : undefined}>
      {DOMAIN_STATUS_LABELS[status]}
    </Badge>
  )
}

export function DomainStepList({ steps }: { steps: DomainSteps }) {
  return (
    <ul aria-label="Setup steps" aria-live="polite" className="space-y-1.5">
      {STEPS.map((step) => (
        <li key={step} className="flex items-center gap-2 text-sm">
          {steps[step] ? (
            <Check className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          ) : (
            <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <span className={steps[step] ? undefined : "text-muted-foreground"}>{DOMAIN_STEP_LABELS[step]}</span>
          <span className="sr-only">{steps[step] ? ", done" : ", not yet"}</span>
        </li>
      ))}
    </ul>
  )
}
