"use client"

import { useId } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type BarShapeProps, type TooltipContentProps } from "recharts"
import { axisTick, compactNumber, inProgressLabels } from "@/components/analytics/clicks-chart"
import { bucketRows, bucketSizeFor, bucketTicks, type BucketMeta } from "@/lib/admin-stats"
import { rangeLabels } from "@/lib/analytics"
import type { AnalyticsRange, StackedSeries } from "@/lib/types"

export type StackStep = 100 | 55 | 40 | 25

export type StackFill = { step: StackStep; hatch?: boolean } | { tone: "destructive" }

export interface StackDetail {
  series: StackedSeries
  labels: Record<string, string>
}

interface StackedDailyChartProps {
  title: string
  series: StackedSeries
  labels: Record<string, string>
  days: AnalyticsRange
  hint?: string
  fills?: Record<string, StackFill>
  detail?: StackDetail
}

interface DetailEntry {
  key: string
  field: string
  label: string
  fill: StackFill | null
}

interface Segment {
  key: string
  field: string
  label: string
  fill: StackFill | null
}

type Row = Record<string, string | number> & { date: string }

type BucketRow = Row & BucketMeta

const UNKNOWN_KEY = "unknown"

const STEPS: StackStep[] = [100, 55, 40, 25]

const defaultSteps: StackStep[] = [100, 55, 25]

const mutedColor = "hsl(var(--muted-foreground) / 0.75)"

const destructiveColor = "hsl(var(--destructive))"

const edgeColor = "var(--stack-edge)"

const edgeRoom = 5

const hatchSize = 6

const partialOpacity = 0.45

const stepVariables =
  "[--stack-55:55%] [--stack-40:40%] [--stack-25:25%] [--stack-toward:var(--card)] [--stack-edge:hsl(var(--brand))] dark:[--stack-55:60%] dark:[--stack-40:42%] dark:[--stack-25:20%] dark:[--stack-toward:var(--foreground)] dark:[--stack-edge:transparent]"

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

function stepColor(step: StackStep): string {
  return step === 100 ? "hsl(var(--brand))" : `color-mix(in oklab, hsl(var(--brand)) var(--stack-${step}), hsl(var(--stack-toward)))`
}

function solidColor(fill: StackFill | null): string {
  if (!fill) return mutedColor
  return "tone" in fill ? destructiveColor : stepColor(fill.step)
}

function hatchId(patternBase: string, step: StackStep): string {
  return `${patternBase}-hatch-${step}`
}

function paint(fill: StackFill | null, patternBase: string): string {
  return fill && "step" in fill && fill.hatch ? `url(#${hatchId(patternBase, fill.step)})` : solidColor(fill)
}

function hasEdge(fill: StackFill | null): boolean {
  return !!fill && "step" in fill && fill.step < 100
}

function useSvgId(): string {
  return useId().replace(/[^\w-]/g, "")
}

export function StackedDailyChart({ title, series, labels, days, hint, fills, detail }: StackedDailyChartProps) {
  const patternBase = useSvgId()
  const segments = segmentsOf(series.keys, labels, fills)
  const details: DetailEntry[] | undefined = detail?.series.keys.map((key, index) => ({
    key,
    field: `d${index}`,
    label: detail.labels[key] ?? key,
    fill: segments.find((segment) => segment.key === key)?.fill ?? null,
  }))
  const detailCounts = new Map(detail?.series.daily.map((day) => [day.date, day.counts]))
  const daily: Row[] = series.daily.map((day) => {
    const row: Row = { date: day.date }
    segments.forEach((segment) => {
      row[segment.field] = day.counts[segment.key] ?? 0
    })
    details?.forEach((entry) => {
      row[entry.field] = detailCounts.get(day.date)?.[entry.key] ?? 0
    })
    return row
  })
  const size = bucketSizeFor(days)
  const rows: BucketRow[] = bucketRows(daily, size)
  const ticks = bucketTicks(rows.map((row) => row.date), size)
  const tickLabels = new Map(rows.map((row) => [row.date, row.tickLabel]))
  const totals = (details ?? segments).map((entry) => `${entry.label} ${daily.reduce((sum, row) => sum + Number(row[entry.field]), 0).toLocaleString()}`)
  const heading = `${title} per ${size}`
  const summary = `${heading} for the last ${rangeLabels[days]}: ${totals.length > 0 ? totals.join(", ") : "none"}. The last ${size} is still in progress.`

  return (
    <section className={`min-w-0 rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] ${stepVariables}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{heading}</h2>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {segments.map((segment) => (
            <li key={segment.key} className="flex items-center gap-1.5">
              <Swatch fill={segment.fill} />
              {segment.label}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <InProgressSwatch />
            Faded: {inProgressLabels[size]}
          </li>
        </ul>
      </div>
      <div role="img" aria-label={summary} className="h-64 min-w-0 px-2 pb-3 pt-5 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 20, left: 0, bottom: 0 }} barCategoryGap="20%">
            <defs>
              {STEPS.map((step) => (
                <HatchPattern key={step} id={hatchId(patternBase, step)} step={step} />
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={(date: string) => tickLabels.get(date) ?? date}
              interval={size === "week" ? "preserveEnd" : 0}
              minTickGap={8}
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
            <Tooltip content={(props) => <StackedTooltip {...props} segments={segments} details={details} />} cursor={{ fill: "hsl(var(--muted) / 0.6)" }} />
            {segments.map((segment) => (
              <Bar
                key={segment.key}
                dataKey={segment.field}
                name={segment.label}
                stackId="day"
                fill={paint(segment.fill, patternBase)}
                shape={hasEdge(segment.fill) ? EdgedSegmentShape : SegmentShape}
                maxBarSize={size === "day" ? 28 : 40}
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
      <rect width={hatchSize} height={hatchSize} style={{ fill: stepColor(step) }} />
      <rect width={1} height={hatchSize} style={{ fill: "hsl(var(--card))" }} />
    </pattern>
  )
}

function segmentGap(height: number): number {
  return height >= 6 ? 2 : height >= 3 ? 1 : 0
}

function isPartial(payload: unknown): boolean {
  return !!(payload as BucketRow | undefined)?.partial
}

function SegmentShape({ x, y, width, height, fill, payload }: BarShapeProps) {
  if (!(width > 0) || !(height > 0)) return null
  const gap = segmentGap(height)
  return <rect x={x} y={y + gap} width={width} height={height - gap} style={{ fill }} opacity={isPartial(payload) ? partialOpacity : undefined} />
}

function EdgedSegmentShape(props: BarShapeProps) {
  const { x, y, width, height, payload } = props
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
    <g opacity={isPartial(payload) ? partialOpacity : undefined}>
      <SegmentShape {...props} payload={undefined} />
      {edges.length > 0 && (
        <path d={edges.join("")} shapeRendering="crispEdges" style={{ fill: "none", stroke: edgeColor, strokeWidth: 1 }} />
      )}
    </g>
  )
}

function StackedTooltip({ active, payload, segments, details }: TooltipContentProps & { segments: Segment[]; details?: DetailEntry[] }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload as BucketRow
  const entries = details ? details.filter((entry) => Number(row[entry.field]) > 0) : segments

  return (
    <div className="min-w-40 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-[0_4px_12px_-2px_rgb(0_0_0/0.2)]">
      <p className="mb-1.5 text-muted-foreground">{row.bucketLabel}</p>
      {entries.length === 0 && <p>None</p>}
      <ul className="space-y-1">
        {entries.map((segment) => (
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

function InProgressSwatch() {
  return (
    <svg aria-hidden="true" width="16" height="10" viewBox="0 0 16 10" className="shrink-0">
      <rect width="7" height="10" rx="2" style={{ fill: "hsl(var(--muted-foreground))" }} />
      <rect x="9" width="7" height="10" rx="2" style={{ fill: "hsl(var(--muted-foreground))" }} opacity={partialOpacity} />
    </svg>
  )
}

function Swatch({ fill }: { fill: StackFill | null }) {
  const patternBase = useSvgId()
  return (
    <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
      {fill && "step" in fill && fill.hatch && (
        <defs>
          <HatchPattern id={hatchId(patternBase, fill.step)} step={fill.step} />
        </defs>
      )}
      <rect width="10" height="10" rx="3" style={{ fill: paint(fill, patternBase) }} />
      {hasEdge(fill) && <rect x="0.5" y="0.5" width="9" height="9" rx="2.5" style={{ fill: "none", stroke: edgeColor, strokeWidth: 1 }} />}
    </svg>
  )
}
