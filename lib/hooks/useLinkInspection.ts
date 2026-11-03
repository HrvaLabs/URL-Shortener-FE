"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { adminApi, retryUnlessRefused } from "@/lib/api-client"
import { INSPECTION_REFRESH_MS, inspectionPending } from "@/lib/inspection"
import type { LinkInspection, VirusTotalView } from "@/lib/types"

export const REVIEW_QUEUE_KEY = ["admin", "review", "queue"] as const

export const linkInspectionKey = (urlId: number | null) => ["admin", "link-inspection", urlId] as const

const refreshAfterInspecting = (queryClient: QueryClient, urlId: number) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: linkInspectionKey(urlId) }),
    queryClient.invalidateQueries({ queryKey: REVIEW_QUEUE_KEY }),
    queryClient.invalidateQueries({ queryKey: ["admin", "audit-log"] }),
  ])

/** A link's screenshot, VirusTotal verdict and redirect chain, asked again every 10 s while either waits in the queue. */
export function useLinkInspection(urlId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: linkInspectionKey(urlId),
    queryFn: () => adminApi.getLinkInspection(urlId as number),
    enabled: enabled && urlId != null,
    refetchInterval: (query) => (inspectionPending(query.state.data) ? INSPECTION_REFRESH_MS : false),
    retry: retryUnlessRefused,
  })
}

/**
 * The stored screenshot as an object URL, fetched once per `takenAt` and only while `enabled` (a row on screen,
 * an open dialog). The URL is revoked when the image changes and on unmount.
 */
export function useLinkScreenshotUrl(urlId: number, takenAt: string | null, enabled = true) {
  const { data, isError } = useQuery({
    queryKey: ["admin", "link-screenshot", urlId, takenAt],
    queryFn: () => adminApi.getLinkScreenshot(urlId),
    enabled: enabled && takenAt != null,
    staleTime: Infinity,
    retry: retryUnlessRefused,
  })
  const blob = enabled ? data : undefined
  const [shown, setShown] = useState<{ blob: Blob; url: string } | null>(null)

  useEffect(() => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- an object URL has to be revoked, so the effect that revokes it makes it
    setShown({ blob, url })
    return () => URL.revokeObjectURL(url)
  }, [blob])

  return { url: blob && shown?.blob === blob ? shown.url : null, failed: enabled && isError }
}

export function useTakeLinkScreenshot(urlId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => adminApi.takeLinkScreenshot(urlId),
    onSuccess: () => refreshAfterInspecting(queryClient, urlId),
  })
}

export function useSendToVirusTotal(urlId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => adminApi.sendToVirusTotal(urlId),
    onSuccess: (virusTotal: VirusTotalView) => {
      queryClient.setQueryData<LinkInspection>(linkInspectionKey(urlId), (inspection) => (inspection ? { ...inspection, virusTotal } : inspection))
      return refreshAfterInspecting(queryClient, urlId)
    },
  })
}
