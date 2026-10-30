import type { PublicSettings, SettingGroup, SettingResponse } from "./types"

export const ANONYMOUS_PAUSED = "Making links without an account is paused."

export const SIGNUPS_PAUSED = "Creating new accounts is paused."

export const ALIASES_PAUSED = "Custom aliases are turned off right now."

export const ANONYMOUS_REFUSED = "Sign in to create short URLs"

export type PublicSwitch = "anonymousLinks" | "customAliases"

export function refusedSwitch(message: string | undefined): PublicSwitch | null {
  if (message === ANONYMOUS_REFUSED) return "anonymousLinks"
  if (message === ALIASES_PAUSED) return "customAliases"
  return null
}

export function noEffectText(parentLabel: string): string {
  return `Has no effect while ${parentLabel} is off.`
}

export function anonymousLinksPaused(settings: PublicSettings | undefined, signedIn: boolean, authLoading: boolean): boolean {
  return !authLoading && !signedIn && settings?.anonymousLinks === false
}

export function signupsPaused(settings: PublicSettings | undefined): boolean {
  return settings?.newSignups === false
}

export function aliasFieldShown(settings: PublicSettings | undefined, domain: string | null): boolean {
  return settings?.customAliases !== false || domain !== null
}

export const SETTING_GROUP_LABELS: Record<SettingGroup, string> = {
  ACCESS: "Access",
  LINKS: "Links",
  SAFETY: "Safety",
  ALERTS: "Alerts",
  DIGEST: "Digest",
  EMAILS: "Emails",
  ABUSE_REPORTS: "Abuse reports",
}

const NONE = "None"

export interface SettingRowView {
  setting: SettingResponse
  indented: boolean
  offParent: string | null
}

export interface SettingGroupView {
  group: SettingGroup
  rows: SettingRowView[]
}

function matchesSearch(setting: SettingResponse, words: string[]): boolean {
  const text = `${setting.label} ${setting.description}`.toLowerCase()
  return words.every((word) => text.includes(word))
}

function offParent(setting: SettingResponse, byKey: Map<string, SettingResponse>): SettingResponse | undefined {
  const seen = new Set<string>()
  let parent = setting.parent ? byKey.get(setting.parent) : undefined
  while (parent && !seen.has(parent.key)) {
    if (parent.type === "SWITCH" && parent.value === false) return parent
    seen.add(parent.key)
    parent = parent.parent ? byKey.get(parent.parent) : undefined
  }
  return undefined
}

export function groupSettings(settings: SettingResponse[], search: string): SettingGroupView[] {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean)
  const byKey = new Map(settings.map((setting) => [setting.key, setting]))
  const shown = settings.filter((setting) => matchesSearch(setting, words))
  return (Object.keys(SETTING_GROUP_LABELS) as SettingGroup[])
    .map((group) => {
      const inGroup = shown.filter((setting) => setting.group === group)
      const keys = new Set(inGroup.map((setting) => setting.key))
      const rows: SettingRowView[] = []
      const add = (setting: SettingResponse, indented: boolean) => {
        rows.push({ setting, indented, offParent: offParent(setting, byKey)?.label ?? null })
        for (const child of inGroup.filter((entry) => entry.parent === setting.key)) add(child, true)
      }
      for (const setting of inGroup.filter((entry) => !entry.parent || !keys.has(entry.parent))) add(setting, false)
      return { group, rows }
    })
    .filter((entry) => entry.rows.length > 0)
}

export function safetyOffLines(settings: SettingResponse[]): string[] {
  const byKey = new Map(settings.map((setting) => [setting.key, setting]))
  return settings
    .filter((setting) => setting.safety && setting.type === "SWITCH" && setting.value === false && !offParent(setting, byKey))
    .map((setting) => `${setting.label} is off.`)
}

function numberText(setting: SettingResponse, value: number): string {
  const number = value.toLocaleString("en-US")
  const unit = setting.unit
  if (!unit) return number
  if (unit === "%") return `${number}%`
  return `${number} ${value === 1 && unit.endsWith("s") ? unit.slice(0, -1) : unit}`
}

export function settingValueText(setting: SettingResponse, value: SettingResponse["value"]): string {
  if (typeof value === "boolean") return value ? "On" : "Off"
  if (typeof value === "number") return numberText(setting, value)
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : NONE
  if (typeof value === "string") return value || NONE
  return setting.noneLabel ?? NONE
}
