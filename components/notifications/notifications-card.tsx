"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChannelList } from "@/components/notifications/channel-list"
import { EmailNotifications } from "@/components/notifications/email-notifications"
import { useNotificationConsents } from "@/lib/hooks/useNotifications"

const CARD_ID = "notifications"

export function NotificationsCard() {
  const cardRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrolled = useRef(false)
  const { isPending } = useNotificationConsents()

  useEffect(() => {
    if (scrolled.current || isPending) return
    scrolled.current = true
    if (window.location.hash !== `#${CARD_ID}`) return
    cardRef.current?.scrollIntoView({ block: "start" })
    if (document.activeElement === document.body || document.activeElement === null) titleRef.current?.focus({ preventScroll: true })
  }, [isPending])

  return (
    <Card ref={cardRef} id={CARD_ID} className="scroll-mt-40 md:scroll-mt-24">
      <CardHeader>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <CardTitle ref={titleRef} tabIndex={-1} className="text-base focus-visible:ring-0 focus-visible:ring-offset-0">
            Notifications
          </CardTitle>
          <Link href="/help/notifications" className="text-sm text-brand-link">How notifications work</Link>
        </div>
        <CardDescription>Everything here is off until you turn it on. You can turn anything off again at any time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <EmailNotifications titleRef={titleRef} />
        <ChannelList titleRef={titleRef} />
      </CardContent>
    </Card>
  )
}
