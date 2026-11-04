import { SESSION_ENDED } from "./api-client"

export type RefusalAnswer = "sign-out" | "wait"

/** Shown instead of the backend's refusal while a first refusal waits for the next check. */
export const COULDNT_CHECK_SIGN_IN = "hrva.cc couldn't check your sign-in."

/** How often activity renews the sign-in at most. */
export const RENEW_EVERY_MS = 5 * 60 * 1000

/** True when activity should renew the sign-in: never renewed in this tab yet, or the last renewal is 5 minutes old. */
export const dueForRenewal = (lastRenewedAt: number | null, now: number): boolean => lastRenewedAt === null || now - lastRenewedAt >= RENEW_EVERY_MS

const MILLISECONDS_PER_SECOND = 1000

/** True when the stored token's `exp` has passed, or when the token can't be read; the signature isn't checked. */
export function tokenExpired(token: string | null, now: number): boolean {
  const payload = token?.replace(/^Bearer\s+/i, "").split(".")[1]
  if (!payload) return true
  try {
    const claims: unknown = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
    const exp = typeof claims === "object" && claims !== null ? (claims as { exp?: unknown }).exp : undefined
    return typeof exp !== "number" || exp * MILLISECONDS_PER_SECOND <= now
  } catch {
    return true
  }
}

/**
 * What a 401 or 403 from `/users/me` means: a session ended elsewhere, an expired or unreadable token, or a second refusal in a row
 * signs out; a first refusal of a token that hasn't expired waits for the next check.
 */
export function answerToRefusal(token: string | null, now: number, earlierRefusals: number, message: string): RefusalAnswer {
  if (message === SESSION_ENDED || tokenExpired(token, now) || earlierRefusals >= 1) return "sign-out"
  return "wait"
}
