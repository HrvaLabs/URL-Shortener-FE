"use client"

import { useQuery } from "@tanstack/react-query"
import { usePagination } from "@/lib/hooks/usePagination"
import { Pagination } from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageMeta } from "@/components/page-meta"
import { formatDateTime } from "@/lib/utils"
import { adminApi } from "@/lib/api-client"
import type { AuditLog, Page } from "@/lib/types"

type BadgeVariant = "default" | "secondary" | "destructive" | "success" | "outline"

const FAILED_SUFFIX = "_FAILED"

const actionColors: Record<string, BadgeVariant> = {
  deactivateUrl: "destructive",
  revokeUrl: "destructive",
  deleteUrl: "destructive",
  deleteUser: "destructive",
  activateUrl: "success",
  updateUrl: "secondary",
  updateUser: "secondary",
  resendEmail: "secondary",
}

function actionColor(action: string): BadgeVariant {
  if (action.endsWith(FAILED_SUFFIX)) return "destructive"
  return actionColors[action] ?? "secondary"
}

function actionLabel(action: string): string {
  const failed = action.endsWith(FAILED_SUFFIX)
  const label = action
    .slice(0, failed ? -FAILED_SUFFIX.length : undefined)
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase())
  return failed ? `${label} (failed)` : label
}

export default function AdminAuditLogPage() {
  const { page, size, setPage, setSize } = usePagination()
  const { data, isLoading, error } = useQuery<Page<AuditLog>>({
    queryKey: ["admin", "audit-log", page, size],
    queryFn: () => adminApi.getAuditLog(page, size),
  })

  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Audit Log" description="Track administrative actions across the system." />
      <div>
        <h1 className="font-display text-2xl">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track administrative actions across the system</p>
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
          <p className="mt-1 text-sm text-muted-foreground">Actions taken by admins will be recorded here.</p>
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
                    <Badge variant={actionColor(entry.action)} className="whitespace-nowrap">
                      {actionLabel(entry.action)}
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
