import { withScheme } from "./utm"
import { parseServerDateTime, toDateTimeLocalValue } from "./utils"
import type { DestinationChangeChannel, DestinationChangeInfo, DestinationChangeOverride, DestinationChangeStanding, MissingRequirement, UrlResponse, UrlUpdateDto } from "./types"

export const DESTINATION_CHANGES_PER_DAY = 5

export const EXPIRY_IN_PAST = "Expiration date can't be in the past"

export const LOCKED_HEADING = "Why the destination can't change"

export const INFO_FAILED = "Couldn't check whether the destination can change."

export const BLOCKED_OWNER_LINE = "This link is blocked, so it can't be turned back on."

export const BLOCKED_ADMIN_LINE = "This link is blocked, so saving can't turn it back on. Use Activate to unblock it."

export const CHECKING_OWNER_LINE = "This link is being checked. It comes back on its own if it looks fine."

export const TURN_ON_LABEL = "Turn this link back on when I save"

export const SAVE_ANYWAY = "Save anyway"

export type EditableLink = Pick<UrlResponse, "id" | "longUrl" | "visitLimit" | "opens" | "expirationDate" | "active" | "status" | "passwordProtected" | "tags">

export interface EditLinkForm {
  destination: string
  visitLimit: string
  expiry: string
  tags: string
  password: string
  removePassword: boolean
  turnOn: boolean
}

/** The stored expiry as a `datetime-local` value in the viewer's time zone, or "" when there is none. */
export const expiryPrefill = (link: Pick<UrlResponse, "expirationDate">): string =>
  link.expirationDate ? toDateTimeLocalValue(parseServerDateTime(link.expirationDate)) : ""

/** The form a link opens with. Expired and used-up links start with Turn back on ticked: that is what the owner came for. */
export const editLinkPrefill = (link: EditableLink): EditLinkForm => ({
  destination: link.longUrl,
  visitLimit: link.visitLimit > 0 ? String(link.visitLimit) : "",
  expiry: expiryPrefill(link),
  tags: link.tags?.join(", ") ?? "",
  password: "",
  removePassword: false,
  turnOn: link.status === "EXPIRED" || link.status === "LIMIT_REACHED",
})

export const canTurnBackOn = (link: Pick<UrlResponse, "active" | "status">): boolean => !link.active && link.status !== "BLOCKED" && link.status !== "CHECKING"

/** The destination to send: undefined while it is the stored one once the scheme is added, so an unchanged field never counts as a change. */
export const changedDestination = (link: Pick<UrlResponse, "longUrl">, destination: string): string | undefined => {
  const typed = destination.trim()
  if (!typed || withScheme(typed) === withScheme(link.longUrl)) return undefined
  return typed
}

const visitLimitValue = (value: string): number | null => {
  const limit = parseInt(value.trim(), 10)
  return Number.isFinite(limit) && limit > 0 ? limit : null
}

/** The stored expiry when the field still shows it (a `datetime-local` drops the seconds), else the field's instant, or null when cleared. */
const expiryValue = (link: Pick<UrlResponse, "expirationDate">, expiry: string): string | null => {
  if (expiry === expiryPrefill(link)) return link.expirationDate ?? null
  return expiry ? new Date(expiry).toISOString() : null
}

/**
 * The `PUT /urls/{id}` body. The visit limit and expiry are always sent, since the backend replaces them with what it gets.
 * `destination` is what the form would save (after Campaign tracking), sent only when it differs from the stored one.
 */
export function editLinkBody(link: EditableLink, form: EditLinkForm, options: { destination?: string; force?: boolean } = {}): UrlUpdateDto {
  const body: UrlUpdateDto = {
    id: link.id,
    visitLimit: visitLimitValue(form.visitLimit),
    expirationDate: expiryValue(link, form.expiry),
    tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
  }
  const longUrl = changedDestination(link, options.destination ?? form.destination)
  if (longUrl !== undefined) body.longUrl = longUrl
  if (form.removePassword && link.passwordProtected) body.password = ""
  else if (form.password) body.password = form.password
  if (form.turnOn && canTurnBackOn(link)) body.active = true
  if (options.force) body.force = true
  return body
}

/** Why ticking Turn back on can't work with the values in the form, checked before sending; null when it can. */
export function turnOnProblem(link: EditableLink, form: EditLinkForm, now: Date = new Date()): string | null {
  if (!form.turnOn || !canTurnBackOn(link)) return null
  const expiry = expiryValue(link, form.expiry)
  if (expiry && parseServerDateTime(expiry).getTime() <= now.getTime()) return "Set a later expiry date, or clear it, to turn the link back on."
  const limit = visitLimitValue(form.visitLimit)
  const opens = link.opens ?? 0
  if (limit !== null && opens >= limit) return `Set a visit limit above ${opens.toLocaleString("en-US")}, or clear it, to turn the link back on.`
  return null
}

const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" })

const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })

const AVAILABLE_FROM = "Available from "

/** A requirement's text with its date in the reader's time zone ("Available from 1 December 2026"); the backend writes it in UTC. */
export function requirementText(item: MissingRequirement): string {
  if (!item.availableFrom) return item.text
  const at = item.text.lastIndexOf(AVAILABLE_FROM)
  const date = parseServerDateTime(item.availableFrom)
  if (at < 0 || Number.isNaN(date.getTime())) return item.text
  const when = item.code === "DAILY_CHANGES_LEFT" ? `${dayFormat.format(date)} at ${timeFormat.format(date)}` : dayFormat.format(date)
  return `${item.text.slice(0, at + AVAILABLE_FROM.length)}${when}`
}

/** Whether the destination field is read-only: always open for admins, otherwise only once the info says so. */
export const destinationLocked = (admin: boolean, info: DestinationChangeInfo | undefined): boolean => !admin && info?.allowed !== true

export function changesLeftText(info: DestinationChangeInfo | undefined): string | null {
  if (!info?.allowed || info.changesLeft == null) return null
  const left = info.changesLeft
  return `The destination can change ${DESTINATION_CHANGES_PER_DAY} times a day. ${left === 1 ? "1 change" : `${left} changes`} left today.`
}

const isRequirement = (item: unknown): item is MissingRequirement =>
  typeof item === "object" && item !== null && typeof (item as MissingRequirement).text === "string"

const problemOf = (error: unknown): Record<string, unknown> | null => {
  const problem = (error as { problem?: unknown } | null)?.problem
  return typeof problem === "object" && problem !== null ? (problem as Record<string, unknown>) : null
}

/** The `missing` list of a 403 destination refusal, or null for any other error. */
export function missingOf(error: unknown): MissingRequirement[] | null {
  const missing = problemOf(error)?.missing
  return Array.isArray(missing) && missing.length > 0 && missing.every(isRequirement) ? missing : null
}

export interface LinkVerdict {
  outcome: "BLOCK" | "FLAG"
  reasons: string[]
}

/** The link checks' verdict an admin's 409 carries before "Save anyway", or null for any other error. */
export function verdictOf(error: unknown): LinkVerdict | null {
  if ((error as { status?: unknown } | null)?.status !== 409) return null
  const verdict = problemOf(error)?.verdict as { outcome?: unknown; reasons?: unknown } | undefined
  if (!verdict || (verdict.outcome !== "BLOCK" && verdict.outcome !== "FLAG")) return null
  const reasons = Array.isArray(verdict.reasons) ? verdict.reasons.filter((reason): reason is string => typeof reason === "string") : []
  return { outcome: verdict.outcome, reasons }
}

export const verdictHeading = (verdict: LinkVerdict): string =>
  verdict.outcome === "BLOCK" ? "The link checks would block this destination" : "The link checks would send this destination to review"

export type EditErrorField = "destination" | "visitLimit" | "expiry" | "password" | "form"

/** Which field a refused save belongs under, so its text shows next to what has to change. */
export function editErrorField(error: unknown, sentDestination: boolean): EditErrorField {
  const { status, message, fields } = (error ?? {}) as { status?: number; message?: string; fields?: Record<string, string> }
  if (fields?.password) return "password"
  if (fields?.longUrl) return "destination"
  if (message === EXPIRY_IN_PAST) return "expiry"
  if (status === 409 && message?.startsWith("This link has used all its clicks")) return "visitLimit"
  if (sentDestination && (status === 400 || status === 403 || status === 429 || status === 503)) return "destination"
  return "form"
}

export const OVERRIDES: DestinationChangeOverride[] = ["AUTOMATIC", "ALWAYS", "NEVER"]

export const OVERRIDE_LABELS: Record<DestinationChangeOverride, string> = {
  AUTOMATIC: "Automatic",
  ALWAYS: "Always allowed",
  NEVER: "Never allowed",
}

export const OVERRIDE_HINTS: Record<DestinationChangeOverride, string> = {
  AUTOMATIC: "Good standing decides for hrva.cc links. Links on the account's own custom domain follow the domain rules.",
  ALWAYS: "Allowed for hrva.cc links without good standing. Links on a custom domain still follow the domain rules.",
  NEVER: "Not allowed on any link, custom domain links included.",
}

/** One line for the admin users list: whether the account can change its hrva.cc links' destinations, and the override when an admin set one. */
export function standingText(standing: DestinationChangeStanding): string {
  const result = standing.allowed ? "Can change destinations" : "Can't change destinations"
  return standing.override === "AUTOMATIC" ? result : `${result} (${OVERRIDE_LABELS[standing.override]})`
}

export const goodStandingText = (standing: DestinationChangeStanding): string =>
  standing.inGoodStanding ? "In good standing" : "Not in good standing"

export const VIA_LABELS: Record<DestinationChangeChannel, string> = {
  WEB: "Signed in",
  API_KEY: "API key",
}

export const HISTORY_SORTS = [
  { value: "changedAt,desc", label: "Newest first" },
  { value: "changedAt,asc", label: "Oldest first" },
  { value: "changedBy,asc", label: "Changed by, A to Z" },
  { value: "changedBy,desc", label: "Changed by, Z to A" },
  { value: "via,asc", label: "API key first" },
  { value: "via,desc", label: "Signed in first" },
] as const
