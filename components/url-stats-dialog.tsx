"use client"

import { useQuery } from "@tanstack/react-query"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import { analyticsApi } from "@/lib/api-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/status-badge"

interface UrlStatsDialogProps {
  urlId: number | null
  onClose: () => void
}

export function UrlStatsDialog({ urlId, onClose }: UrlStatsDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "url", urlId],
    queryFn: () => analyticsApi.getUrlAnalytics(urlId as number),
    enabled: urlId != null,
  })

  const chartData = (data?.dailyNewVisitors ?? []).map((d) => ({
    day: d.date.slice(5), // MM-DD
    count: d.count,
  }))

  return (
    <Dialog open={urlId != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className={data ? "font-mono text-base text-brand" : undefined}>
            {data ? `/${data.shortUrl}` : "URL analytics"}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="h-48 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          </div>
        ) : (
          <div className="min-w-0 space-y-5">
            <div className="flex min-w-0 items-center gap-2">
              <StatusBadge status={data.status} className="shrink-0" />
              <span className="truncate text-sm text-muted-foreground" title={data.longUrl}>{data.longUrl}</span>
            </div>

            <dl className="grid grid-cols-3 divide-x rounded-lg border">
              <Stat label="Total visits" value={data.visits} />
              <Stat label="Unique (recent)" value={data.uniqueRecentVisitors} />
              <Stat label="Clicks (recent)" value={data.totalRecentClicks} />
            </dl>

            <div>
              <p className="mb-3 text-sm font-medium">New visitors · last 30 days</p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 12, left: 12, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      interval={6}
                      tickLine={false}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        boxShadow: "0 4px 12px -2px rgb(0 0 0 / 0.12)",
                        padding: "6px 10px",
                      }}
                      labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 2 }}
                      itemStyle={{ color: "hsl(var(--popover-foreground))", padding: 0 }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--brand))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Recent-visitor data is retained for a limited window; total visits is cumulative.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 px-3 py-3 sm:px-4">
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums">{value.toLocaleString()}</dd>
    </div>
  )
}
