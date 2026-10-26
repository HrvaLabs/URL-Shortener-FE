"use client"

import { useSyncExternalStore } from "react"
import { isWebAuthnSupported } from "@/lib/webauthn"

const subscribe = () => () => {}

export function useWebAuthnSupported(): boolean {
  return useSyncExternalStore(subscribe, isWebAuthnSupported, () => false)
}
