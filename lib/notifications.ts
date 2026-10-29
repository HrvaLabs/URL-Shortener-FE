import type { ChannelEvent, ChannelType, DestinationStatus, EmailNotificationType, NotificationChannel } from "./types"

export const MAX_CHANNELS = 10

export const CHANNEL_NAME_MAX = 60

export const EMAIL_NOTIFICATION_LABELS: Record<EmailNotificationType, string> = {
  DEAD_LINK_EMAIL: "Dead links",
  WEEKLY_SUMMARY_EMAIL: "Weekly summary",
  EXPIRY_REMINDER_EMAIL: "Expiry reminders",
}

export const CHANNEL_EVENT_LABELS: Record<ChannelEvent, string> = {
  LINK_DEAD: "A link stopped working",
  LINK_BACK: "A link works again",
  DAILY_SUMMARY: "Daily click summary",
  WEEKLY_SUMMARY: "Weekly summary",
}

export const CHANNEL_EVENT_HINTS: Record<ChannelEvent, string> = {
  LINK_DEAD: "Checked every night. Sent once when a link is marked dead.",
  LINK_BACK: "Sent when a dead link answers again.",
  DAILY_SUMMARY: "Yesterday's clicks on your links, sent after midnight. Skipped when there were none.",
  WEEKLY_SUMMARY: "Last week's clicks, every Monday morning.",
}

export type ChannelField = "target" | "botToken" | "chatId" | "accessToken"

export interface ChannelTypeOption {
  type: ChannelType
  label: string
  fields: ChannelField[]
  targetLabel?: string
  targetPlaceholder?: string
  helpAnchor: string
}

export const CHANNEL_TYPES: ChannelTypeOption[] = [
  {
    type: "DISCORD",
    label: "Discord",
    fields: ["target"],
    targetLabel: "Webhook URL",
    targetPlaceholder: "https://discord.com/api/webhooks/...",
    helpAnchor: "#discord",
  },
  {
    type: "SLACK",
    label: "Slack",
    fields: ["target"],
    targetLabel: "Webhook URL",
    targetPlaceholder: "https://hooks.slack.com/services/...",
    helpAnchor: "#slack",
  },
  {
    type: "TELEGRAM",
    label: "Telegram",
    fields: ["botToken", "chatId"],
    helpAnchor: "#telegram",
  },
  {
    type: "NTFY",
    label: "ntfy",
    fields: ["target", "accessToken"],
    targetLabel: "Topic URL",
    targetPlaceholder: "https://ntfy.sh/your-topic",
    helpAnchor: "#ntfy",
  },
  {
    type: "WEBHOOK",
    label: "Webhook (signed JSON)",
    fields: ["target"],
    targetLabel: "URL",
    targetPlaceholder: "https://example.com/hrva-webhook",
    helpAnchor: "#webhook",
  },
]

export const CHANNEL_FIELD_LABELS: Record<Exclude<ChannelField, "target">, string> = {
  botToken: "Bot token",
  chatId: "Chat ID",
  accessToken: "Access token (optional)",
}

const DETECTED_HOSTS: [ChannelType, string[]][] = [
  ["DISCORD", ["discord.com", "discordapp.com", "ptb.discord.com", "canary.discord.com"]],
  ["SLACK", ["hooks.slack.com"]],
  ["TELEGRAM", ["api.telegram.org"]],
  ["NTFY", ["ntfy.sh"]],
]

export const detectChannelType = (url: string): ChannelType | null => {
  let host: string
  try {
    host = new URL(url.trim()).hostname.toLowerCase()
  } catch {
    return null
  }
  return DETECTED_HOSTS.find(([, hosts]) => hosts.includes(host))?.[0] ?? null
}

export const DESTINATION_STATUS_LABELS: Record<DestinationStatus, string> = {
  404: "The page wasn't found (404).",
  410: "The page was removed (410).",
  nxdomain: "The website's domain doesn't exist.",
  refused: "The website refused the connection.",
  tls: "The website's secure connection failed.",
}

const DATE_TIME_WITHOUT_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/

const serverDateTime = (value: string): Date => new Date(DATE_TIME_WITHOUT_OFFSET.test(value) ? `${value}Z` : value)

const RELATIVE_TIME = new Intl.RelativeTimeFormat("en")

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
]

const timeAgo = (date: Date, now: Date): string => {
  const seconds = Math.max(0, (now.getTime() - date.getTime()) / 1000)
  const unit = RELATIVE_UNITS.find(([, unitSeconds]) => seconds >= unitSeconds)
  return unit ? RELATIVE_TIME.format(-Math.floor(seconds / unit[1]), unit[0]) : "just now"
}

const CALENDAR_DATE = new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" })

export const deliveryLine = (channel: NotificationChannel, now: Date): string => {
  if (channel.autoDisabledAt) {
    return `Turned off on ${CALENDAR_DATE.format(serverDateTime(channel.autoDisabledAt))} after failing for 10 days. Fix the channel, then turn it on.`
  }
  const delivery = channel.lastDelivery
  if (!delivery) return "No deliveries yet."
  const when = timeAgo(serverDateTime(delivery.at), now)
  if (delivery.status === "SENT") return `Last delivered ${when}.`
  return delivery.error ? `Last delivery failed ${when}: ${delivery.error}` : `Last delivery failed ${when}.`
}
