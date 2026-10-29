"use client"

import { useId, useState, type RefObject } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { parseServerDateTime } from "@/lib/analytics"
import { useAuth } from "@/lib/auth-context"
import { useFocusAfterRetry } from "@/lib/hooks/useFocusAfterRetry"
import { useNotificationConsents, useSetConsent } from "@/lib/hooks/useNotifications"
import { EMAIL_NOTIFICATION_LABELS } from "@/lib/notifications"
import type { EmailNotificationType, NotificationConsent } from "@/lib/types"
import { formatDate } from "@/lib/utils"

interface EmailNotificationsProps {
  titleRef: RefObject<HTMLHeadingElement | null>
}

export function EmailNotifications({ titleRef }: EmailNotificationsProps) {
  const { user } = useAuth()
  const { data: consents, error, isFetching, refetch } = useNotificationConsents()
  const setConsent = useSetConsent()
  const [pending, setPending] = useState<EmailNotificationType[]>([])
  const retry = useFocusAfterRetry(titleRef, consents !== undefined)

  const toggle = async (type: EmailNotificationType, consented: boolean) => {
    if (pending.includes(type)) return
    setPending((current) => [...current, type])
    try {
      await setConsent.mutateAsync({ type, consented })
    } catch {
    } finally {
      setPending((current) => current.filter((candidate) => candidate !== type))
    }
  }

  return (
    <section aria-labelledby="notifications-email-heading" className="space-y-3">
      <div>
        <h4 id="notifications-email-heading" className="text-sm font-semibold">Email</h4>
        {user?.email && <p className="mt-0.5 text-sm text-muted-foreground [overflow-wrap:anywhere]">{user.email}</p>}
      </div>
      {consents === undefined ? (
        error ? (
          <div className="flex flex-wrap items-center gap-3">
            <p role="alert" className="text-sm text-destructive">Couldn&apos;t load your notification settings.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-disabled={isFetching}
              onClick={() => { if (!isFetching) retry(refetch) }}
              className="aria-disabled:opacity-50"
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-3" aria-hidden="true">
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} className="h-12 w-full" />
            ))}
          </div>
        )
      ) : (
        <ul className="divide-y rounded-lg border">
          {consents.map((consent) => (
            <ConsentRow
              key={consent.type}
              consent={consent}
              pending={pending.includes(consent.type)}
              onToggle={(consented) => toggle(consent.type, consented)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

interface ConsentRowProps {
  consent: NotificationConsent
  pending: boolean
  onToggle: (consented: boolean) => void
}

function ConsentRow({ consent, pending, onToggle }: ConsentRowProps) {
  const id = useId()
  const descriptionId = `${id}-description`
  const sinceId = `${id}-since`
  const showSince = consent.consented && consent.grantedAt
  return (
    <li className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0 space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">{EMAIL_NOTIFICATION_LABELS[consent.type] ?? consent.type}</Label>
        <p id={descriptionId} className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{consent.description}</p>
        {showSince && (
          <p id={sinceId} className="text-xs tabular-nums text-muted-foreground">
            On since {formatDate(parseServerDateTime(consent.grantedAt as string))}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={consent.consented}
        aria-describedby={showSince ? `${descriptionId} ${sinceId}` : descriptionId}
        aria-disabled={pending}
        aria-busy={pending}
        onCheckedChange={(checked) => { if (!pending) onToggle(checked) }}
        className="mt-0.5 aria-disabled:opacity-60"
      />
    </li>
  )
}
