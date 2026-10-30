import type { SignInMethod } from "@/lib/types"

export const SIGN_IN_METHODS: SignInMethod[] = ["PASSWORD", "PASSKEY", "GOOGLE", "GITHUB"]

export const signInMethodLabels: Record<SignInMethod, string> = {
  PASSWORD: "Email and password",
  PASSKEY: "Passkey",
  GOOGLE: "Google",
  GITHUB: "GitHub",
}
