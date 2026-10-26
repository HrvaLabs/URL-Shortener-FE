"use client"

import { useFocusAfterPageRetry } from "@/lib/hooks/useFocusAfterRetry"

export function BioRetryFocus({ targetId, handle }: { targetId: string; handle: string }) {
  useFocusAfterPageRetry(targetId, handle)
  return null
}
