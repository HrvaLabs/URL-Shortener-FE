"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts"
import { axisTick, compactNumber, dailyTicks, formatTick } from "@/components/analytics/clicks-chart"
import { analyticsDay, rangeLabels } from "@/lib/analytics"
import type { AnalyticsRange, BioViewDay } from "@/lib/types"
import { formatDate, plural } from "@/lib/utils"

interface BioViewsChartProps {
  daily: BioViewDay[]
  days: AnalyticsRange
}

const barFill = "hsl(var(--brand))"

export function BioViewsChart({ daily, days }: BioViewsChartProps) {
  const ticks = dailyTicks(daily.map((day) => day.date), days)
  const views = daily.reduce((sum, day) => sum + day.views, 0)
  const summary = `Views per day for the last ${rangeLabels[days]}: ${plural(views, "view")}`

  return (
    <div className="min-w-0 rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="border-b px-5 py-3.5">
        <h2 className="text-sm font-semibold">Views per day</h2>
      </div>
      <div role="img" aria-label={summary} className="h-64 min-w-0 px-2 pb-3 pt-5 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={daily} margin={{ top: 4, right: 20, left: 0, bottom: 0 }} barCategoryGap="20%">
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={formatTick}
              interval={0}
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              allowDecimals={false}
              tickFormatter={(value: number) => compactNumber.format(value)}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip content={(props) => <ViewsTooltip {...props} />} cursor={{ fill: "hsl(var(--muted) / 0.6)" }} />
            <Bar dataKey="views" name="Views" fill={barFill} maxBarSize={28} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul aria-label="Views per day" className="sr-only">
        {daily.map((day) => (
          <li key={day.date}>{`${formatDate(analyticsDay(day.date))}: ${plural(day.views, "view")}`}</li>
        ))}
      </ul>
    </div>
  )
}

function ViewsTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const day = payload[0].payload as BioViewDay

  return (
    <div className="min-w-32 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-[0_4px_12px_-2px_rgb(0_0_0/0.2)]">
      <p className="mb-1.5 text-muted-foreground">{formatDate(analyticsDay(day.date))}</p>
      <p className="flex items-center gap-2">
        <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: barFill }} />
        <span className="font-semibold tabular-nums">{day.views.toLocaleString()}</span>
        <span className="text-muted-foreground">{day.views === 1 ? "View" : "Views"}</span>
      </p>
    </div>
  )
}
