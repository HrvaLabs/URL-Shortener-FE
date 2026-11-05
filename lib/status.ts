export type StatusVariant = "success" | "warning" | "destructive" | "secondary"

interface StatusDisplay {
  label: string
  variant: StatusVariant
}

const STATUS_MAP: Record<string, StatusDisplay> = {
  ACTIVE: { label: "Active", variant: "success" },
  LIMIT_REACHED: { label: "Limit reached", variant: "warning" },
  CHECKING: { label: "Being checked", variant: "warning" },
  EXPIRED: { label: "Expired", variant: "secondary" },
  BLOCKED: { label: "Blocked", variant: "destructive" },
  REVOKED: { label: "Revoked", variant: "destructive" },
  DEACTIVATED: { label: "Deactivated", variant: "destructive" },
}

/**
 * Map a backend status string to a label + badge variant.
 * Falls back to the legacy active boolean if status is missing.
 */
export function resolveStatus(status?: string, active?: boolean): StatusDisplay {
  if (status && STATUS_MAP[status]) {
    return STATUS_MAP[status]
  }
  return active ? { label: "Active", variant: "success" } : { label: "Inactive", variant: "destructive" }
}

/** Whether a blocklist source last loaded from one of its fallback URLs; a source may legitimately load from a link its own download names. */
export const servedFromFallback = (source: { lastSuccessUrl: string | null; fallbackUrls: string[] }): boolean =>
  source.lastSuccessUrl != null && source.fallbackUrls.includes(source.lastSuccessUrl)
