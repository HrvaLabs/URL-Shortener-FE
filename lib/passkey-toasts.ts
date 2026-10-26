import { toast } from "sonner"
import { ApiError } from "./api-client"
import { passkeyErrorMessage } from "./webauthn"

export function toastPasskeySignInError(error: unknown, router: { push: (href: string) => void }): void {
  if (error instanceof ApiError && error.status === 403 && error.message.toLowerCase().includes("verify")) {
    toast.error(error.message, {
      action: { label: "Resend", onClick: () => router.push("/verify-email/resend") },
    })
    return
  }
  const message = passkeyErrorMessage(error, "sign-in")
  if (message) toast.error(message)
}
