import Link from "next/link"
import { analyticsHref, type AnalyticsView } from "@/lib/analytics"
import type { AnalyticsRange } from "@/lib/types"
import { cn } from "@/lib/utils"

const views: { view: AnalyticsView; label: string }[] = [
  { view: "links", label: "Links" },
  { view: "bio", label: "Bio page" },
]

interface AnalyticsViewSwitchProps {
  view: AnalyticsView
  days: AnalyticsRange
}

export function AnalyticsViewSwitch({ view, days }: AnalyticsViewSwitchProps) {
  return (
    <nav aria-label="Analytics views">
      <ul className="inline-flex h-9 items-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground">
        {views.map((entry) => {
          const active = entry.view === view
          return (
            <li key={entry.view}>
              <Link
                href={analyticsHref({ days, view: entry.view })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-7 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium ring-offset-background transition-[color,background-color,box-shadow] duration-150 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  active && "bg-background text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.05)]"
                )}
              >
                {entry.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
