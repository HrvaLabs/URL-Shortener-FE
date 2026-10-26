"use client"

import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts"
import { analyticsDay, rangeLabels } from "@/lib/analytics"
import type { AnalyticsDay, AnalyticsRange } from "@/lib/types"
import { formatDate } from "@/lib/utils"

interface ClicksChartProps {
  daily: AnalyticsDay[]
  days: AnalyticsRange
  uniqueVisitorsLabel?: string
  showBots?: boolean
}

interface Series {
  key: "clicks" | "uniqueVisitors" | "botClicks"
  label: string
  stroke: string
  dash: string | undefined
}

const botStroke = "hsl(var(--muted-foreground))"

const chartSeries = (uniqueVisitorsLabel: string, showBots: boolean): Series[] => [
  { key: "clicks", label: "Clicks", stroke: "hsl(var(--brand))", dash: undefined },
  { key: "uniqueVisitors", label: uniqueVisitorsLabel, stroke: "hsl(var(--brand) / 0.5)", dash: "4 3" },
  ...(showBots ? [{ key: "botClicks", label: "Bot clicks", stroke: botStroke, dash: undefined } as const] : []),
]

const tickStep: Record<AnalyticsRange, number> = { 7: 1, 30: 7, 90: 15, 365: 61 }

export const dailyTicks = (dates: string[], days: AnalyticsRange) =>
  dates.filter((_, index) => (dates.length - 1 - index) % tickStep[days] === 0)

export const compactNumber = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })

export const axisTick = { fontSize: 11, fill: "hsl(var(--muted-foreground))" }

export const formatTick = (date: string) => analyticsDay(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })

export function ClicksChart({ daily, days, uniqueVisitorsLabel = "Daily unique visitors", showBots = false }: ClicksChartProps) {
  const series = chartSeries(uniqueVisitorsLabel, showBots)
  const ticks = dailyTicks(daily.map((day) => day.date), days)
  const clicks = daily.reduce((sum, day) => sum + day.clicks, 0)
  const uniqueVisitors = daily.reduce((sum, day) => sum + day.uniqueVisitors, 0)
  const botClicks = daily.reduce((sum, day) => sum + day.botClicks, 0)
  const summary = `Clicks per day for the last ${rangeLabels[days]}: ${clicks.toLocaleString()} clicks, ${uniqueVisitors.toLocaleString()} ${uniqueVisitorsLabel.toLowerCase()}${showBots ? `, ${botClicks.toLocaleString()} bot clicks` : ""}`

  return (
    <div className="min-w-0 rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b px-5 py-3.5">
        <h2 className="text-sm font-semibold">Clicks per day</h2>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {series.map((entry) => (
            <li key={entry.key} className="flex items-center gap-1.5">
              <Swatch series={entry} width={16} />
              {entry.label}
            </li>
          ))}
        </ul>
      </div>
      <div role="img" aria-label={summary} className="h-64 min-w-0 px-2 pb-3 pt-5 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={daily} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
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
            <Tooltip
              content={(props) => <ChartTooltip {...props} series={series} />}
              cursor={{ stroke: "hsl(var(--muted-foreground) / 0.4)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              name="Clicks"
              stroke={series[0].stroke}
              strokeWidth={2}
              fill="hsl(var(--brand))"
              fillOpacity={0.1}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))", fill: series[0].stroke }}
              isAnimationActive={false}
            />
            {showBots && (
              <Line
                type="monotone"
                dataKey="botClicks"
                name="Bot clicks"
                stroke={botStroke}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))", fill: botStroke }}
                isAnimationActive={false}
              />
            )}
            <Line
              type="monotone"
              dataKey="uniqueVisitors"
              name={uniqueVisitorsLabel}
              stroke={series[1].stroke}
              strokeWidth={2}
              strokeDasharray={series[1].dash}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))", fill: "hsl(var(--brand))" }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label, series }: TooltipContentProps & { series: Series[] }) {
  if (!active || !payload?.length) return null
  const day = payload[0].payload as AnalyticsDay

  return (
    <div className="min-w-40 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-[0_4px_12px_-2px_rgb(0_0_0/0.2)]">
      <p className="mb-1.5 text-muted-foreground">{formatDate(analyticsDay(String(label ?? day.date)))}</p>
      <ul className="space-y-1">
        {series.map((entry) => (
          <li key={entry.key} className="flex items-center gap-2">
            <Swatch series={entry} width={12} />
            <span className="font-semibold tabular-nums">{day[entry.key].toLocaleString()}</span>
            <span className="text-muted-foreground">{entry.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Swatch({ series, width }: { series: Series; width: number }) {
  return (
    <svg aria-hidden="true" width={width} height="2" className="shrink-0 overflow-visible">
      <line x1="0" y1="1" x2={width} y2="1" stroke={series.stroke} strokeWidth="2" strokeDasharray={series.dash} strokeLinecap="round" />
    </svg>
  )
}
