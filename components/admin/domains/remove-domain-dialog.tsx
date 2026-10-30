"use client"

import { RemoveDomainDialog } from "@/components/domains/remove-domain-dialog"
import { ADMIN_LINK_MODE_HINTS } from "@/lib/domains"
import type { AdminDomain, DomainLinkMode } from "@/lib/types"

const OWNER_NOTE = "The owner gets an email saying it was removed."

interface AdminRemoveDomainDialogProps {
  domain: AdminDomain | null
  busy: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (links: DomainLinkMode) => void
  onCloseAutoFocus: (event: Event) => void
}

export function AdminRemoveDomainDialog({ domain, busy, onOpenChange, onConfirm, onCloseAutoFocus }: AdminRemoveDomainDialogProps) {
  return (
    <RemoveDomainDialog
      domain={domain && { id: domain.id, hostname: domain.hostname, links: domain.links, withdraw: false }}
      busy={busy}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      onCloseAutoFocus={onCloseAutoFocus}
      hints={ADMIN_LINK_MODE_HINTS}
      note={domain?.owner ? OWNER_NOTE : undefined}
    />
  )
}
