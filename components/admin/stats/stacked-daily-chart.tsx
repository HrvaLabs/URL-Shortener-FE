"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type BarShapeProps, type TooltipContentProps } from "recharts"
import { axisTick, compactNumber, dailyTicks, formatTick } from "@/components/analytics/clicks-chart"
import { analyticsDay, rangeLabels } from "@/lib/analytics"
import type { AnalyticsRange, StackedSeries } from "@/lib/types"
import { formatDate } from "@/lib/utils"

interface StackedDailyChartProps {
  title: string
  series: StackedSeries
  labels: Record<string, string>
  days: AnalyticsRange
  hint?: string
}

interface Segment {
  key: string
  field: string
  label: string
  color: string
}

type Row = Record<string, string | number> & { date: string }

const UNKNOWN_KEY = "unknown"

const mutedColor = "hsl(var(--muted-foreground) / 0.35)"

const brandSteps = [100, 49, 83, 32, 66, 15]

const barGap: Record<AnalyticsRange, string | number> = { 7: "20%", 30: "20%", 90: "10%", 365: 0 }

function segmentsOf(keys: string[], labels: Record<string, string>): Segment[] {
  let step = 0
  return keys.map((key, index) => ({
    key,
    field: `s${index}`,
    label: labels[key] ?? key,
    color:
      key === UNKNOWN_KEY
        ? mutedColor
        : `color-mix(in oklab, hsl(var(--brand)) ${brandSteps[Math.min(step++, brandSteps.length - 1)]}%, hsl(var(--stack-toward)))`,
  }))
}

export function StackedDailyChart({ title, series, labels, days, hint }: StackedDailyChartProps) {
  const segments = segmentsOf(series.keys, labels)
  const rows: Row[] = series.daily.map((day) => {
    const row: Row = { date: day.date }
    segments.forEach((segment) => {
      row[segment.field] = day.counts[segment.key] ?? 0
    })
    return row
  })
  const ticks = dailyTicks(rows.map((row) => row.date), days)
  const totals = segments.map((segment) => `${segment.label} ${rows.reduce((sum, row) => sum + Number(row[segment.field]), 0).toLocaleString()}`)
  const summary = `${title} for the last ${rangeLabels[days]}: ${totals.length > 0 ? totals.join(", ") : "none"}`

  return (
    <section className="min-w-0 rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] [--stack-toward:var(--card)] dark:[--stack-toward:var(--foreground)]">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {segments.map((segment) => (
            <li key={segment.key} className="flex items-center gap-1.5">
              <Swatch color={segment.color} />
              {segment.label}
            </li>
          ))}
        </ul>
      </div>
      <div role="img" aria-label={summary} className="h-64 min-w-0 px-2 pb-3 pt-5 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 20, left: 0, bottom: 0 }} barCategoryGap={barGap[days]}>
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
            <Tooltip content={(props) => <StackedTooltip {...props} segments={segments} />} cursor={{ fill: "hsl(var(--muted) / 0.6)" }} />
            {segments.map((segment) => (
              <Bar
                key={segment.key}
                dataKey={segment.field}
                name={segment.label}
                stackId="day"
                fill={segment.color}
                shape={SegmentShape}
                maxBarSize={28}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function SegmentShape({ x, y, width, height, fill }: BarShapeProps) {
  if (!(width > 0) || !(height > 0)) return null
  const gap = height >= 6 ? 2 : height >= 3 ? 1 : 0
  return <rect x={x} y={y + gap} width={width} height={height - gap} fill={fill} />
}

function StackedTooltip({ active, payload, label, segments }: TooltipContentProps & { segments: Segment[] }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload as Row

  return (
    <div className="min-w-40 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-[0_4px_12px_-2px_rgb(0_0_0/0.2)]">
      <p className="mb-1.5 text-muted-foreground">{formatDate(analyticsDay(String(label ?? row.date)))}</p>
      <ul className="space-y-1">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2">
            <Swatch color={segment.color} />
            <span className="font-semibold tabular-nums">{Number(row[segment.field]).toLocaleString()}</span>
            <span className="text-muted-foreground">{segment.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Swatch({ color }: { color: string }) {
  return <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: color }} />
}
