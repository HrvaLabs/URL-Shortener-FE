"use client"

import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { adminApi } from "@/lib/api-client"

export function LoginRateLimits() {
  const { data: attempts, isLoading, refetch } = useQuery<Record<string, number>>({
    queryKey: ["admin", "login-attempts"],
    queryFn: () => adminApi.getLoginAttempts(),
    refetchInterval: 10_000,
  })

  const handleClear = async () => {
    try {
      await adminApi.clearLoginAttempts()
      toast.success("Rate limits cleared")
      refetch()
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to clear")
    }
  }

  const entries = attempts ? Object.entries(attempts) : []

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex min-h-13 items-center justify-between gap-4 border-b px-5 py-2.5">
        <h2 className="text-sm font-semibold">Login rate limits</h2>
        {!isLoading && entries.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClear} className="h-8">
            Clear all
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="p-5">
          <Skeleton className="h-20 w-full" />
        </div>
      ) : entries.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No active rate limits.</p>
      ) : (
        <ul className="divide-y">
          {entries.map(([ip, count]) => (
            <li key={ip} className="flex items-center justify-between gap-4 px-5 py-2.5">
              <span className="min-w-0 font-mono text-[13px] [overflow-wrap:anywhere]">{ip}</span>
              <Badge
                variant={count >= 10 ? "destructive" : count >= 5 ? "warning" : "outline"}
                className="tabular-nums"
              >
                {count} attempt{count !== 1 ? "s" : ""}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
