import { toast } from "sonner"
import { SESSION_ENDED } from "./api-client"

export const SESSION_ENDED_TOAST_ID = "session-ended"

let installed = false

/** Gives every error toast of the session-ended text the sign-out toast's id, so a page that also toasts the failed call adds no second one. */
export function showSessionEndedOnce() {
  if (installed) return
  installed = true
  const showError = toast.error
  toast.error = (message, data) => showError(message, message === SESSION_ENDED ? { ...data, id: SESSION_ENDED_TOAST_ID } : data)
}
