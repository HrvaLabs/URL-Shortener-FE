import { cn } from "@/lib/utils"

export function ReviewCountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span className={cn("relative rounded-md bg-warning/10 px-1.5 text-xs font-medium tabular-nums text-warning", className)}>
      {count > 99 ? "99+" : count}
      <span className="sr-only"> waiting</span>
    </span>
  )
}
