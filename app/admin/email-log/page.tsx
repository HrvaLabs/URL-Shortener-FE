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
import type { EmailLog, Page } from "@/lib/types"

const statusColors: Record<string, "default" | "secondary" | "destructive" | "success" | "outline"> = {
  SENT: "success",
  FAILED: "destructive",
  SENDING: "secondary",
}

const statusLabels: Record<string, string> = {
  SENT: "Sent",
  FAILED: "Failed",
  SENDING: "Sending",
}

export default function AdminEmailLogPage() {
  const { page, size, setPage, setSize } = usePagination()
  const { data, isLoading, error } = useQuery<Page<EmailLog>>({
    queryKey: ["admin", "email-log", page, size],
    queryFn: () => adminApi.getEmailLog(page, size),
  })

  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Email Log" description="View email delivery status." />
      <div>
        <h1 className="font-display text-2xl">Email Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">View email delivery status</p>
      </div>

      {isLoading ? (
        <div className="space-y-3 rounded-xl border bg-card p-5">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load email log</p>
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="font-semibold">No emails sent yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Outgoing emails will be listed here with their delivery status.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{formatDateTime(entry.createdAt)}</TableCell>
                  <TableCell className="max-w-[220px] truncate font-medium" title={entry.recipient}>{entry.recipient}</TableCell>
                  <TableCell className="max-w-[260px] truncate" title={entry.subject}>{entry.subject}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[entry.status] ?? "secondary"}>
                      {statusLabels[entry.status] ?? entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden max-w-[240px] truncate text-muted-foreground lg:table-cell" title={entry.errorMessage || undefined}>
                    {entry.errorMessage || "—"}
                  </TableCell>
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
