import type {
  AssertionCredentialJSON,
  CreationOptionsJSON,
  CredentialDescriptorJSON,
  RegistrationCredentialJSON,
  RequestOptionsJSON,
} from "./types"

type PasskeyErrorContext = "sign-in" | "register" | "verify"

const CANCELLED_MESSAGES: Record<PasskeyErrorContext, string> = {
  "sign-in": "Passkey sign-in was cancelled, or no passkey for hrva.cc was found.",
  register: "Adding the passkey was cancelled or timed out.",
  verify: "The passkey check was cancelled or timed out.",
}

let pendingRequest: AbortController | null = null

export function bufferToBase64Url(buffer: ArrayBuffer | ArrayBufferView): string {
  const bytes = ArrayBuffer.isView(buffer)
    ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : new Uint8Array(buffer)
  let binary = ""
  for (let index = 0; index < bytes.length; index++) binary += String.fromCharCode(bytes[index])
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function base64UrlToBuffer(value: string): ArrayBuffer {
  const base64 = value.replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="))
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return bytes.buffer
}

export function isWebAuthnSupported(): boolean {
  return typeof window !== "undefined" && "PublicKeyCredential" in window && !!navigator.credentials
}

export async function isConditionalMediationAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false
  try {
    return (await PublicKeyCredential.isConditionalMediationAvailable?.()) ?? false
  } catch {
    return false
  }
}

function toDescriptor(descriptor: CredentialDescriptorJSON): PublicKeyCredentialDescriptor {
  return {
    type: descriptor.type,
    id: base64UrlToBuffer(descriptor.id),
    transports: descriptor.transports as AuthenticatorTransport[] | undefined,
  }
}

export function toCreationOptions(json: CreationOptionsJSON): PublicKeyCredentialCreationOptions {
  return {
    ...json,
    challenge: base64UrlToBuffer(json.challenge),
    user: { ...json.user, id: base64UrlToBuffer(json.user.id) },
    excludeCredentials: json.excludeCredentials?.map(toDescriptor),
  }
}

export function toRequestOptions(json: RequestOptionsJSON): PublicKeyCredentialRequestOptions {
  return {
    ...json,
    challenge: base64UrlToBuffer(json.challenge),
    allowCredentials: json.allowCredentials?.map(toDescriptor),
  }
}

function startRequest(): AbortController {
  abortPasskeyRequest()
  const controller = new AbortController()
  pendingRequest = controller
  return controller
}

function finishRequest(controller: AbortController) {
  if (pendingRequest === controller) pendingRequest = null
}

export function abortPasskeyRequest(): void {
  pendingRequest?.abort()
  pendingRequest = null
}

function requireCredential(credential: Credential | null): PublicKeyCredential {
  if (!credential) throw new Error("The browser returned no passkey.")
  return credential as PublicKeyCredential
}

function extensionResults(credential: PublicKeyCredential): { credProps?: { rk?: boolean } } {
  const rk = credential.getClientExtensionResults?.()?.credProps?.rk
  return typeof rk === "boolean" ? { credProps: { rk } } : {}
}

function registrationJSON(credential: PublicKeyCredential): RegistrationCredentialJSON {
  const response = credential.response as AuthenticatorAttestationResponse
  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: "public-key",
    authenticatorAttachment: credential.authenticatorAttachment ?? null,
    clientExtensionResults: extensionResults(credential),
    response: {
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      attestationObject: bufferToBase64Url(response.attestationObject),
      transports: response.getTransports?.() ?? [],
    },
  }
}

function assertionJSON(credential: PublicKeyCredential): AssertionCredentialJSON {
  const response = credential.response as AuthenticatorAssertionResponse
  const userHandle = response.userHandle
  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: "public-key",
    authenticatorAttachment: credential.authenticatorAttachment ?? null,
    clientExtensionResults: extensionResults(credential),
    response: {
      authenticatorData: bufferToBase64Url(response.authenticatorData),
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      signature: bufferToBase64Url(response.signature),
      userHandle: userHandle && userHandle.byteLength > 0 ? bufferToBase64Url(userHandle) : null,
    },
  }
}

export async function createPasskey(json: CreationOptionsJSON): Promise<RegistrationCredentialJSON> {
  const controller = startRequest()
  try {
    const credential = await navigator.credentials.create({
      publicKey: toCreationOptions(json),
      signal: controller.signal,
    })
    return registrationJSON(requireCredential(credential))
  } finally {
    finishRequest(controller)
  }
}

export async function getPasskey(
  json: RequestOptionsJSON,
  options: { conditional?: boolean } = {},
): Promise<AssertionCredentialJSON> {
  const controller = startRequest()
  try {
    const credential = await navigator.credentials.get({
      publicKey: toRequestOptions(json),
      signal: controller.signal,
      ...(options.conditional ? { mediation: "conditional" as const } : {}),
    })
    return assertionJSON(requireCredential(credential))
  } finally {
    finishRequest(controller)
  }
}

function errorName(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("name" in error)) return undefined
  return typeof error.name === "string" ? error.name : undefined
}

export function passkeyErrorMessage(error: unknown, context: PasskeyErrorContext): string | null {
  if (error instanceof Error && error.name === "ApiError") return error.message
  switch (errorName(error)) {
    case "AbortError":
      return null
    case "NotAllowedError":
      return CANCELLED_MESSAGES[context]
    case "InvalidStateError":
      return "This passkey or security key is already added to your account."
    case "SecurityError":
      return "Passkeys can't be used on this address."
    default:
      return "Something went wrong with the passkey. Try again."
  }
}
