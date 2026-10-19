"use client"

import Link from "next/link"
import { useConnectedApps, useDisconnectApp } from "@/lib/hooks/useConnectedApps"
import type { ConnectedApp } from "@/lib/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

const relativeTime = new Intl.RelativeTimeFormat("en")

const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
]

function formatLastUsed(date: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000)
  for (const [unit, unitSeconds] of relativeUnits) {
    if (seconds >= unitSeconds) return relativeTime.format(-Math.floor(seconds / unitSeconds), unit)
  }
  return "just now"
}

export function ConnectedAppsCard() {
  const { data: apps, isLoading, isFetching, error, refetch } = useConnectedApps()
  const disconnectApp = useDisconnectApp()

  const handleDisconnect = async (app: ConnectedApp) => {
    try {
      await disconnectApp.mutateAsync(app.clientId)
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect app")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Connected apps</CardTitle>
        <CardDescription>AI apps you have allowed to use your hrva.cc account.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error && !apps ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-destructive">Failed to load connected apps</p>
            <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()}>Retry</Button>
          </div>
        ) : !apps || apps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No apps connected. Connect one from the <Link href="/mcp" className="text-brand-link">MCP page</Link>.
          </p>
        ) : (
          <ul className="divide-y">
            {apps.map((app) => {
              const disconnecting = disconnectApp.isPending && disconnectApp.variables === app.clientId
              return (
                <li key={app.clientId} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{app.clientName}</p>
                    <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs tabular-nums text-muted-foreground">
                      <span>Connected {formatDate(app.firstConnected)}</span>
                      <span>{app.lastUsed ? `Last used ${formatLastUsed(app.lastUsed)}` : "Not used yet"}</span>
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={disconnectApp.isPending}
                        className="shrink-0"
                        aria-label={`Disconnect ${app.clientName}`}
                      >
                        {disconnecting ? "Disconnecting…" : "Disconnect"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect {app.clientName}?</AlertDialogTitle>
                        <AlertDialogDescription>It will need to sign in again to use hrva.cc.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDisconnect(app)} className={buttonVariants({ variant: "destructive" })}>
                          Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
