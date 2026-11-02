import type { ConnectRequestView } from "./types"

export const CLIENT_NAME_NOTE = "The name is chosen by the app and is not checked by hrva.cc."

export const connectDestinationText = (view: ConnectRequestView): string =>
  view.loopback
    ? "After you allow it, hrva.cc sends you back to an app on this device."
    : `After you allow it, hrva.cc sends you to ${view.redirectHost}.`

export const lookalikeWarning = (view: ConnectRequestView): string | null =>
  view.lookalike && !view.loopback
    ? `This app calls itself ${view.clientName}, but it sends you to ${view.redirectHost}, which is not ${view.clientName}'s site. Don't allow it unless you started this connection yourself.`
    : null
