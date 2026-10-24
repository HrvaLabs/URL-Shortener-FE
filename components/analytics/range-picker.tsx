"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ANALYTICS_RANGES, parseAnalyticsRange, rangeLabels } from "@/lib/analytics"
import type { AnalyticsRange } from "@/lib/types"

interface RangePickerProps {
  value: AnalyticsRange
  onChange: (days: AnalyticsRange) => void
}

export function RangePicker({ value, onChange }: RangePickerProps) {
  return (
    <Tabs value={String(value)} onValueChange={(next) => onChange(parseAnalyticsRange(next))}>
      <TabsList aria-label="Date range">
        {ANALYTICS_RANGES.map((range) => (
          <TabsTrigger key={range} value={String(range)} className="tabular-nums">
            {rangeLabels[range]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
