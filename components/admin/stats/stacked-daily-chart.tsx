"use client"

import { useId } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type BarShapeProps, type TooltipContentProps } from "recharts"
import { axisTick, compactNumber, dailyTicks, formatTick } from "@/components/analytics/clicks-chart"
import { analyticsDay, rangeLabels } from "@/lib/analytics"
import type { AnalyticsRange, StackedSeries } from "@/lib/types"
import { formatDate } from "@/lib/utils"

export type StackStep = 100 | 55 | 25

export interface StackFill {
  step: StackStep
  hatch?: boolean
}

interface StackedDailyChartProps {
  title: string
  series: StackedSeries
  labels: Record<string, string>
  days: AnalyticsRange
  hint?: string
  fills?: Record<string, StackFill>
}

interface Segment {
  key: string
  field: string
  label: string
  fill: StackFill | null
}

type Row = Record<string, string | number> & { date: string }

const UNKNOWN_KEY = "unknown"

const defaultSteps: StackStep[] = [100, 55, 25]

const stepColors: Record<StackStep, string> = {
  100: "hsl(var(--brand))",
  55: "color-mix(in oklab, hsl(var(--brand)) var(--stack-mid), hsl(var(--stack-toward)))",
  25: "color-mix(in oklab, hsl(var(--brand)) var(--stack-low), hsl(var(--stack-toward)))",
}

const mutedColor = "hsl(var(--muted-foreground) / 0.5)"

const palestStep: StackStep = 25

const edgeColor = "var(--stack-edge)"

const edgeRoom = 5

const hatchSize = 6

const barGap: Record<AnalyticsRange, string | number> = { 7: "20%", 30: "20%", 90: "10%", 365: 0 }

export function inFillOrder(series: StackedSeries, fills: Record<string, StackFill>): StackedSeries {
  const order = Object.keys(fills)
  const rank = (key: string) => {
    if (key === UNKNOWN_KEY) return order.length + 1
    const index = order.indexOf(key)
    return index === -1 ? order.length : index
  }
  return { ...series, keys: [...series.keys].sort((a, b) => rank(a) - rank(b)) }
}

function segmentsOf(keys: string[], labels: Record<string, string>, fills?: Record<string, StackFill>): Segment[] {
  let position = 0
  return keys.map((key, index) => ({
    key,
    field: `s${index}`,
    label: labels[key] ?? key,
    fill: key === UNKNOWN_KEY ? null : fills ? (fills[key] ?? null) : defaultFill(position++),
  }))
}

function defaultFill(position: number): StackFill | null {
  return position < defaultSteps.length ? { step: defaultSteps[position] } : null
}

function solidColor(fill: StackFill | null): string {
  return fill ? stepColors[fill.step] : mutedColor
}

function hatchId(patternBase: string, step: StackStep): string {
  return `${patternBase}-hatch-${step}`
}

function paint(fill: StackFill | null, patternBase: string): string {
  return fill?.hatch ? `url(#${hatchId(patternBase, fill.step)})` : solidColor(fill)
}

function hasEdge(fill: StackFill | null): boolean {
  return fill?.step === palestStep
}

function useSvgId(): string {
  return useId().replace(/[^\w-]/g, "")
}

export function StackedDailyChart({ title, series, labels, days, hint, fills }: StackedDailyChartProps) {
  const patternBase = useSvgId()
  const segments = segmentsOf(series.keys, labels, fills)
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
    <section className="min-w-0 rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] [--stack-low:25%] [--stack-mid:55%] [--stack-toward:var(--card)] [--stack-edge:hsl(var(--brand))] dark:[--stack-low:20%] dark:[--stack-mid:60%] dark:[--stack-toward:var(--foreground)] dark:[--stack-edge:transparent]">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {segments.map((segment) => (
            <li key={segment.key} className="flex items-center gap-1.5">
              <Swatch fill={segment.fill} />
              {segment.label}
            </li>
          ))}
        </ul>
      </div>
      <div role="img" aria-label={summary} className="h-64 min-w-0 px-2 pb-3 pt-5 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 20, left: 0, bottom: 0 }} barCategoryGap={barGap[days]}>
            <defs>
              {defaultSteps.map((step) => (
                <HatchPattern key={step} id={hatchId(patternBase, step)} step={step} />
              ))}
            </defs>
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
                fill={paint(segment.fill, patternBase)}
                shape={hasEdge(segment.fill) ? EdgedSegmentShape : SegmentShape}
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

function HatchPattern({ id, step }: { id: string; step: StackStep }) {
  return (
    <pattern id={id} width={hatchSize} height={hatchSize} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width={hatchSize} height={hatchSize} style={{ fill: stepColors[step] }} />
      <rect width={1} height={hatchSize} style={{ fill: "hsl(var(--card))" }} />
    </pattern>
  )
}

function segmentGap(height: number): number {
  return height >= 6 ? 2 : height >= 3 ? 1 : 0
}

function SegmentShape({ x, y, width, height, fill }: BarShapeProps) {
  if (!(width > 0) || !(height > 0)) return null
  const gap = segmentGap(height)
  return <rect x={x} y={y + gap} width={width} height={height - gap} style={{ fill }} />
}

function EdgedSegmentShape(props: BarShapeProps) {
  const { x, y, width, height } = props
  if (!(width > 0) || !(height > 0)) return null
  const top = y + segmentGap(height)
  const bottom = y + height
  const sides = width >= edgeRoom
  const ends = bottom - top >= edgeRoom
  const edges = [
    ends && `M${x} ${top + 0.5}H${x + width}M${x} ${bottom - 0.5}H${x + width}`,
    sides && `M${x + 0.5} ${top}V${bottom}M${x + width - 0.5} ${top}V${bottom}`,
  ].filter(Boolean)

  return (
    <g>
      <SegmentShape {...props} />
      {edges.length > 0 && (
        <path d={edges.join("")} shapeRendering="crispEdges" style={{ fill: "none", stroke: edgeColor, strokeWidth: 1 }} />
      )}
    </g>
  )
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
            <Swatch fill={segment.fill} />
            <span className="font-semibold tabular-nums">{Number(row[segment.field]).toLocaleString()}</span>
            <span className="text-muted-foreground">{segment.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Swatch({ fill }: { fill: StackFill | null }) {
  const patternBase = useSvgId()
  return (
    <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
      {fill?.hatch && (
        <defs>
          <HatchPattern id={hatchId(patternBase, fill.step)} step={fill.step} />
        </defs>
      )}
      <rect width="10" height="10" rx="3" style={{ fill: paint(fill, patternBase) }} />
      {hasEdge(fill) && <rect x="0.5" y="0.5" width="9" height="9" rx="2.5" style={{ fill: "none", stroke: edgeColor, strokeWidth: 1 }} />}
    </svg>
  )
}
