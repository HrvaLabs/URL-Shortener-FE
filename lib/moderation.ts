import type { SettingGroup, SettingResponse } from "./types"

export const ANONYMOUS_PAUSED = "Making links without an account is paused."

export const SIGNUPS_PAUSED = "Creating new accounts is paused."

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

function parentIsOff(setting: SettingResponse, byKey: Map<string, SettingResponse>): boolean {
  const seen = new Set<string>()
  let parent = setting.parent ? byKey.get(setting.parent) : undefined
  while (parent && !seen.has(parent.key)) {
    if (parent.type === "SWITCH" && parent.value === false) return true
    seen.add(parent.key)
    parent = parent.parent ? byKey.get(parent.parent) : undefined
  }
  return false
}

export function safetyOffLines(settings: SettingResponse[]): string[] {
  const byKey = new Map(settings.map((setting) => [setting.key, setting]))
  return settings
    .filter((setting) => setting.safety && setting.type === "SWITCH" && setting.value === false && !parentIsOff(setting, byKey))
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
