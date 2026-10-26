"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ApiError, authApi } from "@/lib/api-client"
import { toastPasskeySignInError } from "@/lib/passkey-toasts"
import type { AssertionCredentialJSON, PasskeyOptions, RequestOptionsJSON, SignedIn } from "@/lib/types"
import {
  abortPasskeyRequest,
  getPasskey,
  isConditionalMediationAvailable,
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
  const router = useRouter()
  const rememberMeRef = useRef(rememberMe)
  const onSignedInRef = useRef(onSignedIn)
  const routerRef = useRef(router)
  const mounted = useRef(true)

  useEffect(() => {
    rememberMeRef.current = rememberMe
    onSignedInRef.current = onSignedIn
    routerRef.current = router
  }, [rememberMe, onSignedIn, router])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    let active = true
    let latestRun = 0
    let ceremonyRun = 0
    let missedWhileHidden = false
    let refreshTimer: ReturnType<typeof setTimeout> | undefined

    const scheduleRefresh = () => {
      clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => void run(), CONDITIONAL_REFRESH_MS)
    }

    const run = async () => {
      if (document.visibilityState !== "visible") {
        missedWhileHidden = true
        clearTimeout(refreshTimer)
        return
      }
      missedWhileHidden = false
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
      if (!isCurrent()) return
      clearTimeout(refreshTimer)

      try {
        const signedIn = await authApi.passkeySignIn(ceremony.ceremonyId, credential, rememberMeRef.current)
        if (mounted.current) onSignedInRef.current(signedIn)
      } catch (error) {
        if (!active) return
        toastPasskeySignInError(error, { push: (href) => routerRef.current.push(href) })
        if (error instanceof ApiError && (error.status === 401 || error.status === 410)) void run()
        else scheduleRefresh()
      }
    }

    const handleVisibilityChange = () => {
      if (active && missedWhileHidden && document.visibilityState === "visible") void run()
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    void (async () => {
      if ((await isConditionalMediationAvailable()) && active) void run()
    })()

    return () => {
      active = false
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      clearTimeout(refreshTimer)
      if (ceremonyRun) abortPasskeyRequest()
    }
  }, [enabled])
}
