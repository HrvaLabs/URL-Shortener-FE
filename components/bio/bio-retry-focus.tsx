"use client"

import { useFocusAfterPageRetry } from "@/lib/hooks/useFocusAfterRetry"

export function BioRetryFocus({ targetId }: { targetId: string }) {
  useFocusAfterPageRetry(targetId)
  return null
}
