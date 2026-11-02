export const OAUTH_VERIFIER_KEY = "oauth-verifier"
export const VERIFIER_LIFETIME_MS = 10 * 60 * 1000

const VERIFIER_BYTES = 32

export interface PreparedChallenge {
  verifier: string
  challenge: string
}

type VerifierSlot = Pick<Storage, "getItem" | "setItem" | "removeItem">

function base64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")
}

export function newVerifier(): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(VERIFIER_BYTES)))
}

export async function challengeOf(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
  return base64Url(new Uint8Array(digest))
}

export async function prepareSignInChallenge(): Promise<PreparedChallenge> {
  const verifier = newVerifier()
  return { verifier, challenge: await challengeOf(verifier) }
}

export function keepSignInVerifier(verifier: string, slot: VerifierSlot = localStorage, now: number = Date.now()): void {
  try {
    slot.setItem(OAUTH_VERIFIER_KEY, JSON.stringify({ verifier, expiresAt: now + VERIFIER_LIFETIME_MS }))
  } catch {
    // Storage can be blocked; the callback then has no verifier and asks to sign in again.
  }
}

export function takeSignInVerifier(slot: VerifierSlot = localStorage, now: number = Date.now()): string | null {
  try {
    const stored: unknown = JSON.parse(slot.getItem(OAUTH_VERIFIER_KEY) ?? "null")
    slot.removeItem(OAUTH_VERIFIER_KEY)
    if (typeof stored !== "object" || stored === null) return null
    const { verifier, expiresAt } = stored as { verifier?: unknown; expiresAt?: unknown }
    return typeof verifier === "string" && typeof expiresAt === "number" && now < expiresAt ? verifier : null
  } catch {
    // Blocked storage or a value that isn't ours: no verifier.
    return null
  }
}
