"use client"

import { useId, useRef, useState, type RefObject } from "react"
import { ChevronDown, Flag } from "lucide-react"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BlockDomainsDialog } from "@/components/admin/block-domains-dialog"
import { ReportDomainsDialog } from "@/components/admin/report-domains-dialog"
import { CampaignDetails } from "@/components/admin/campaigns/campaign-details"
import { ApiError } from "@/lib/api-client"
import { parseServerDateTime } from "@/lib/analytics"
import { useAllowCampaign } from "@/lib/hooks/useCampaigns"
import { campaignCountsText, campaignReportsText, campaignStatusLabel } from "@/lib/moderation"
import { cn, formatDate, plural } from "@/lib/utils"
import type { Campaign, CampaignStatus } from "@/lib/types"

type BadgeVariant = "destructive" | "secondary" | "success" | "outline"

const statusVariants: Record<CampaignStatus, BadgeVariant> = {
  HOLDING: "destructive",
  ALERT_ONLY: "secondary",
  ALLOWED: "success",
}

const wrap = "[overflow-wrap:anywhere]"

const dateOf = (value: string) => formatDate(parseServerDateTime(value))

interface CampaignRowProps {
  campaign: Campaign
  expanded: boolean
  onToggle(): void
  fallbackFocusRef: RefObject<HTMLElement | null>
}

export function CampaignRow({ campaign, expanded, onToggle, fallbackFocusRef }: CampaignRowProps) {
  const headingId = useId()
  const panelId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const blockRef = useRef<HTMLButtonElement>(null)
  const reportRef = useRef<HTMLButtonElement>(null)
  const allowRef = useRef<HTMLButtonElement>(null)
  const allowConfirmed = useRef(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const allow = useAllowCampaign()
  const variant: BadgeVariant = campaign.status === "HOLDING" && !campaign.holding ? "outline" : statusVariants[campaign.status]

  const focusToggle = (event: Event) => {
    if (!allowConfirmed.current) return
    allowConfirmed.current = false
    event.preventDefault()
    const target = toggleRef.current?.isConnected ? toggleRef.current : fallbackFocusRef.current
    target?.focus()
  }

  const confirmAllow = () => {
    allowConfirmed.current = true
    allow.mutate(campaign.id, {
      onSuccess: ({ linksAffected }) => toast.success(`${plural(linksAffected, "link")} restored`),
      onError: (err) => {
        toast.error(err instanceof ApiError && err.message ? err.message : "Failed to allow the shape")
        allowRef.current?.focus()
      },
    })
  }

  return (
    <li className="rounded-xl border bg-card p-4 @lg:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <h2 id={headingId} className={cn("min-w-0 flex-1 font-mono text-[13px] font-medium", wrap)}>{campaign.shape}</h2>
        <Badge variant={variant}>{campaignStatusLabel(campaign)}</Badge>
      </div>

      <div className={cn("mt-2 space-y-0.5 text-sm text-muted-foreground tabular-nums", wrap)}>
        <p>First seen {dateOf(campaign.firstSeenAt)}, last seen {dateOf(campaign.lastSeenAt)}</p>
        <p>{campaignCountsText(campaign)}</p>
        <p>{campaignReportsText(campaign)}</p>
        {campaign.holding && campaign.activeUntil && <p>Holds new links with this shape until {dateOf(campaign.activeUntil)}</p>}
        {campaign.status === "ALLOWED" && campaign.allowedBy && (
          <p>Allowed by {campaign.allowedBy}{campaign.allowedAt && ` on ${dateOf(campaign.allowedAt)}`}</p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          ref={toggleRef}
          variant="outline"
          size="sm"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={expanded ? panelId : undefined}
          aria-describedby={headingId}
        >
          {expanded ? "Hide links and domains" : "Show links and domains"}
          <ChevronDown aria-hidden="true" className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
        </Button>
        <Button ref={blockRef} variant="outline" size="sm" onClick={() => setBlockOpen(true)} aria-describedby={headingId}>
          Block all domains
        </Button>
        <Button ref={reportRef} variant="outline" size="sm" className="gap-1.5" onClick={() => setReportOpen(true)} aria-describedby={headingId}>
          <Flag aria-hidden="true" className="h-3.5 w-3.5" />
          Report all
        </Button>
        {campaign.status !== "ALLOWED" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button ref={allowRef} variant="outline" size="sm" disabled={allow.isPending} aria-describedby={headingId}>
                Allow this shape
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onCloseAutoFocus={focusToggle}>
              <AlertDialogHeader>
                <AlertDialogTitle className={wrap}>Allow {campaign.shape}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Its held links come back on unless something else blocks them, and new links with this shape aren&apos;t held.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmAllow}>Allow</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {expanded && <CampaignDetails campaign={campaign} panelId={panelId} />}

      <BlockDomainsDialog
        source={{ campaignId: campaign.id }}
        open={blockOpen}
        onOpenChange={setBlockOpen}
        onBlocked={() => undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          const target = blockRef.current?.isConnected ? blockRef.current : fallbackFocusRef.current
          target?.focus()
        }}
      />
      <ReportDomainsDialog
        source={{ campaignId: campaign.id }}
        open={reportOpen}
        onOpenChange={setReportOpen}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          const target = reportRef.current?.isConnected ? reportRef.current : fallbackFocusRef.current
          target?.focus()
        }}
      />
    </li>
  )
}
