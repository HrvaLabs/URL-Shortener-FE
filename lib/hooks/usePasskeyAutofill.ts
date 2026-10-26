"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { ApiError, authApi } from "@/lib/api-client"
import type { AssertionCredentialJSON, PasskeyOptions, RequestOptionsJSON, SignedIn } from "@/lib/types"
import {
  abortPasskeyRequest,
  getPasskey,
  isConditionalMediationAvailable,
  passkeyErrorMessage,
} from "@/lib/webauthn"

export const CONDITIONAL_REFRESH_MS = 240_000

export function usePasskeyAutofill({
  enabled,
  rememberMe,
  onSignedIn,
}: {
  enabled: boolean
  rememberMe: boolean
  onSignedIn: (s: SignedIn) => void
}): void {
  const rememberMeRef = useRef(rememberMe)
  const onSignedInRef = useRef(onSignedIn)

  useEffect(() => {
    rememberMeRef.current = rememberMe
    onSignedInRef.current = onSignedIn
  }, [rememberMe, onSignedIn])

  useEffect(() => {
    if (!enabled) return
    let active = true
    let latestRun = 0
    let ceremonyRun = 0
    let refreshTimer: ReturnType<typeof setTimeout> | undefined

    const scheduleRefresh = () => {
      clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => void run(), CONDITIONAL_REFRESH_MS)
    }

    const run = async () => {
      const thisRun = ++latestRun
      const isCurrent = () => active && thisRun === latestRun
      scheduleRefresh()

      let ceremony: PasskeyOptions<RequestOptionsJSON>
      try {
        ceremony = await authApi.passkeyOptions()
      } catch {
        return
      }
      if (!isCurrent()) return

      let credential: AssertionCredentialJSON
      ceremonyRun = thisRun
      try {
        credential = await getPasskey(ceremony.options, { conditional: true })
      } catch {
        return
      } finally {
        if (ceremonyRun === thisRun) ceremonyRun = 0
      }
      if (!active) return
      clearTimeout(refreshTimer)

      try {
        const signedIn = await authApi.passkeySignIn(ceremony.ceremonyId, credential, rememberMeRef.current)
        if (active) onSignedInRef.current(signedIn)
      } catch (error) {
        if (!active) return
        const message = passkeyErrorMessage(error, "sign-in")
        if (message) toast.error(message)
        if (error instanceof ApiError && (error.status === 401 || error.status === 410)) void run()
        else scheduleRefresh()
      }
    }

    void (async () => {
      if ((await isConditionalMediationAvailable()) && active) void run()
    })()

    return () => {
      active = false
      clearTimeout(refreshTimer)
      if (ceremonyRun) abortPasskeyRequest()
    }
  }, [enabled])
}
