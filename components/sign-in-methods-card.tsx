"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { parseServerDateTime } from "@/lib/analytics"
import { useMe } from "@/lib/hooks/useUsers"
import { signInMethodLabels } from "@/lib/sign-in-methods"
import { formatDateTime } from "@/lib/utils"

export function SignInMethodsCard() {
  const { data: me, isLoading, error, refetch, isFetching } = useMe()
  const methods = me?.signInMethods ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sign-in methods</CardTitle>
        <CardDescription>Every way you&apos;ve signed in to this account</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : error && !me ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-destructive">Failed to load sign-in methods</p>
            <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()}>Retry</Button>
          </div>
        ) : methods.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sign-ins recorded yet.</p>
        ) : (
          <ul className="divide-y">
            {methods.map((use) => (
              <li key={use.method} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-medium">{signInMethodLabels[use.method] ?? use.method}</p>
                <p className="text-xs tabular-nums text-muted-foreground">Last used {formatDateTime(parseServerDateTime(use.lastUsedAt))}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
