import type { SignInMethod } from "@/lib/types"

export const SIGN_IN_METHODS: SignInMethod[] = ["PASSWORD", "PASSKEY", "GOOGLE", "GITHUB"]

export const signInMethodLabels: Record<SignInMethod, string> = {
  PASSWORD: "Email and password",
  PASSKEY: "Passkey",
  GOOGLE: "Google",
  GITHUB: "GitHub",
}

export type SwitchableMethod = Extract<SignInMethod, "GOOGLE" | "GITHUB">

export const isSwitchable = (method: SignInMethod): method is SwitchableMethod => method === "GOOGLE" || method === "GITHUB"

export const providerTurnedOffText = (provider: SwitchableMethod | null): string =>
  `${provider ? signInMethodLabels[provider] : "That"} sign-in is turned off for this account. Turn it back on in Settings after signing in another way.`

export const OAUTH_PROVIDER_KEY = "oauth-provider"

export function rememberOAuthProvider(provider: SwitchableMethod): void {
  try {
    sessionStorage.setItem(OAUTH_PROVIDER_KEY, provider)
  } catch {
    // Storage can be blocked; the callback then names no provider.
  }
}

export function readOAuthProvider(): SwitchableMethod | null {
  try {
    const stored = sessionStorage.getItem(OAUTH_PROVIDER_KEY)
    return stored === "GOOGLE" || stored === "GITHUB" ? stored : null
  } catch {
    return null
  }
}

export function forgetOAuthProvider(): void {
  try {
    sessionStorage.removeItem(OAUTH_PROVIDER_KEY)
  } catch {
    // Nothing to forget when storage is blocked.
  }
}
