import type { ConnectRequestView } from "./types"

export const CLIENT_NAME_NOTE = "The name is chosen by the app and is not checked by hrva.cc."

export const connectDestinationText = (view: ConnectRequestView): string => {
  if (view.unknownDestination) return "hrva.cc can't show where this app will send you after you allow it."
  if (view.appScheme) return `After you allow it, hrva.cc sends you to an app on this device that opens ${view.appScheme}:// links.`
  if (view.loopback) return "After you allow it, hrva.cc sends you back to an app on this device."
  return `After you allow it, hrva.cc sends you to ${view.redirectHost}.`
}

export const connectWarning = (view: ConnectRequestView): string | null => {
  if (view.unknownDestination) {
    return "hrva.cc can't tell where this app will send you. Don't allow it unless you started this connection yourself."
  }
  return view.lookalike && !view.loopback && view.redirectHost
    ? `This app calls itself ${view.clientName}, but it sends you to ${view.redirectHost}, which is not ${view.clientName}'s site. Don't allow it unless you started this connection yourself.`
    : null
}
