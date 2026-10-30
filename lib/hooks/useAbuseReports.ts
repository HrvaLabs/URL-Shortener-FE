"use client"

import { useCallback, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { abuseReportApi, ApiError } from "@/lib/api-client"
import { inBatches, markedText } from "@/lib/moderation"
import { plural } from "@/lib/utils"
import type { AbuseReport, AbuseReportSource } from "@/lib/types"

const abuseReportsKey = ["admin", "abuse-reports"]

const sourceKey = (source: AbuseReportSource) => ("urlIds" in source ? `urls-${source.urlIds.join(",")}` : `campaign-${source.campaignId}`)

export function useAbuseReports(source: AbuseReportSource, enabled: boolean) {
  return useQuery({
    queryKey: [...abuseReportsKey, "prepare", sourceKey(source)],
    queryFn: () => abuseReportApi.prepare(source),
    enabled,
    gcTime: 0,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useMarkReported() {
  const queryClient = useQueryClient()
  const claimed = useRef(new Set<string>())
  const [marked, setMarked] = useState<ReadonlySet<string>>(new Set())

  const mark = useCallback(
    async (report: AbuseReport): Promise<boolean> => {
      const todo = report.domains.map((entry) => entry.domain).filter((domain) => !claimed.current.has(domain))
      if (todo.length === 0) return true
      todo.forEach((domain) => claimed.current.add(domain))
      let done = 0
      try {
        for (const batch of inBatches(todo)) {
          await abuseReportApi.markReported(batch, report.registrar, report.to)
          done += batch.length
          setMarked((prev) => new Set([...prev, ...batch]))
        }
        toast.success(markedText(done))
        return true
      } catch (err) {
        todo.slice(done).forEach((domain) => claimed.current.delete(domain))
        const message = err instanceof ApiError && err.message ? err.message : "Failed to mark the domains as reported"
        toast.error(done > 0 ? `${message}. ${plural(done, "domain")} marked before it stopped.` : message)
        return false
      } finally {
        if (done > 0) {
          void queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] })
          void queryClient.invalidateQueries({ queryKey: ["admin", "audit-log"] })
        }
      }
    },
    [queryClient],
  )

  return { marked, mark }
}
