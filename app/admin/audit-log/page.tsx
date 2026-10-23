"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { usePagination } from "@/lib/hooks/usePagination"
import { Pagination } from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageMeta } from "@/components/page-meta"
import { formatDateTime } from "@/lib/utils"
import { adminApi } from "@/lib/api-client"
import type { AuditAction, AuditLog, Page } from "@/lib/types"

type BadgeVariant = "default" | "secondary" | "destructive" | "success" | "outline"

const actionLabels: Record<AuditAction, string> = {
  RESOLVE_REVIEW: "Resolved review",
  BLOCK_LINK: "Blocked link",
  BLOCK_DOMAIN: "Blocked domain",
  ALLOW_DOMAIN: "Trusted domain",
  REMOVE_DOMAIN_RULE: "Removed domain rule",
  BLOCK_USER: "Blocked user",
  REACTIVATE_USER: "Unblocked user",
  DELETE_LINK: "Deleted flagged link",
  UPDATE_URL: "Updated link",
  REVOKE_URL: "Revoked link",
  ACTIVATE_URL: "Activated link",
  DELETE_URL: "Deleted link",
  UPDATE_USER: "Updated user",
  DELETE_USER: "Deleted user",
  CREATE_SOURCE: "Added blocklist",
  UPDATE_SOURCE: "Edited blocklist",
  DELETE_SOURCE: "Removed blocklist",
  REFRESH_SOURCE: "Refreshed blocklist",
  RESEND_EMAIL: "Resent email",
  CLEAR_LOGIN_ATTEMPTS: "Cleared login limits",
  UNKNOWN: "Unknown action",
}

const actionColors: Record<AuditAction, BadgeVariant> = {
  RESOLVE_REVIEW: "secondary",
  BLOCK_LINK: "destructive",
  BLOCK_DOMAIN: "destructive",
  ALLOW_DOMAIN: "success",
  REMOVE_DOMAIN_RULE: "secondary",
  BLOCK_USER: "destructive",
  REACTIVATE_USER: "success",
  DELETE_LINK: "destructive",
  UPDATE_URL: "secondary",
  REVOKE_URL: "destructive",
  ACTIVATE_URL: "success",
  DELETE_URL: "destructive",
  UPDATE_USER: "secondary",
  DELETE_USER: "destructive",
  CREATE_SOURCE: "secondary",
  UPDATE_SOURCE: "secondary",
  DELETE_SOURCE: "destructive",
  REFRESH_SOURCE: "secondary",
  RESEND_EMAIL: "secondary",
  CLEAR_LOGIN_ATTEMPTS: "secondary",
  UNKNOWN: "outline",
}

const actionOptions = Object.entries(actionLabels) as [AuditAction, string][]

const selectClass = "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0"

const titleCased = (action: string) => action.toLowerCase().replace(/_+/g, " ").trim().replace(/^./, (c) => c.toUpperCase())

const actionColor = ({ action, failed }: AuditLog): BadgeVariant =>
  failed ? "destructive" : (actionColors[action] ?? "secondary")

const actionLabel = ({ action, failed }: AuditLog): string => {
  const label = actionLabels[action] ?? titleCased(action)
  return failed ? `${label} (failed)` : label
}

export default function AdminAuditLogPage() {
  const { page, size, setPage, setSize } = usePagination()
  const [action, setAction] = useState<AuditAction | "">("")
  const { data, isLoading, error } = useQuery<Page<AuditLog>>({
    queryKey: ["admin", "audit-log", page, size, action],
    queryFn: () => adminApi.getAuditLog(page, size, action || undefined),
  })

  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Audit Log" description="Track administrative actions across the system." />
      <div>
        <h1 className="font-display text-2xl">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track administrative actions across the system</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Action
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value as AuditAction | "")
              setPage(0)
            }}
            className={selectClass}
          >
            <option value="">All actions</option>
            {actionOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-3 rounded-xl border bg-card p-5">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load audit log</p>
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="font-semibold">No audit log entries</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {action ? "Nothing recorded for this action yet. Try a different one." : "Actions taken by admins will be recorded here."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden md:table-cell">Target type</TableHead>
                <TableHead className="hidden md:table-cell">Target</TableHead>
                <TableHead className="hidden lg:table-cell">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{formatDateTime(entry.performedAt)}</TableCell>
                  <TableCell className="font-medium">{entry.performedBy}</TableCell>
                  <TableCell>
                    <Badge variant={actionColor(entry)} className="whitespace-nowrap">
                      {actionLabel(entry)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden capitalize text-muted-foreground md:table-cell">{entry.targetType}</TableCell>
                  <TableCell className="hidden max-w-[180px] truncate font-mono text-[13px] md:table-cell" title={entry.targetIdentifier || undefined}>{entry.targetIdentifier || "—"}</TableCell>
                  <TableCell className="hidden max-w-[240px] truncate text-muted-foreground lg:table-cell" title={entry.details || undefined}>{entry.details || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            totalPages={data?.totalPages ?? 0}
            totalElements={data?.totalElements}
            size={size}
            onPageChange={setPage}
            onSizeChange={setSize}
          />
        </div>
      )}
    </div>
  )
}
