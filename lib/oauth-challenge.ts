export const OAUTH_VERIFIER_KEY = "oauth-verifier"

const VERIFIER_BYTES = 32

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

export async function startSignInChallenge(storage: Pick<Storage, "setItem"> = sessionStorage): Promise<string> {
  const verifier = newVerifier()
  storage.setItem(OAUTH_VERIFIER_KEY, verifier)
  return challengeOf(verifier)
}

export function takeSignInVerifier(storage: Pick<Storage, "getItem" | "removeItem"> = sessionStorage): string | null {
  try {
    const verifier = storage.getItem(OAUTH_VERIFIER_KEY)
    storage.removeItem(OAUTH_VERIFIER_KEY)
    return verifier
  } catch {
    // Storage can be blocked; the callback then has no verifier and asks to sign in again.
    return null
  }
}
