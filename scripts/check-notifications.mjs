import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import "./resolve-ts-imports.mjs"

process.env.TZ = "UTC"

const notifications = await import("../lib/notifications.ts")

const {
  CHANNEL_EVENT_HINTS,
  CHANNEL_EVENT_LABELS,
  CHANNEL_NAME_MAX,
  CHANNEL_TYPES,
  DEAD_LINK_EMAIL_SETTINGS_HREF,
  DESTINATION_STATUS_LABELS,
  EMAIL_NOTIFICATION_LABELS,
  EMAIL_NOTIFICATION_NOUNS,
  MAX_CHANNELS,
  deliveryLine,
  detectChannelType,
  isConsentedTo,
  unsubscribeTokenType,
} = notifications

const check = (name, run) => {
  try {
    run()
  } catch (error) {
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
    process.exit(1)
  }
}

const NOT_ASCII = /[^\x00-\x7F]/

const stringsIn = (value) => {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.flatMap(stringsIn)
  if (value !== null && typeof value === "object") return Object.entries(value).flatMap(([key, entry]) => [key, ...stringsIn(entry)])
  return []
}

const channel = (overrides = {}) => ({
  id: 4,
  name: "Team alerts",
  type: "DISCORD",
  enabled: true,
  events: ["LINK_DEAD"],
  maskedTarget: "https://discord.com/abcd",
  chatId: null,
  hasAccessToken: false,
  autoDisabledAt: null,
  lastDelivery: null,
  createdAt: "2026-10-01T08:00:00",
  updatedAt: "2026-10-01T08:00:00",
  signingSecret: null,
  ...overrides,
})

const NOW = new Date("2026-10-27T12:00:00Z")

check("limits", () => {
  assert.equal(MAX_CHANNELS, 10)
  assert.equal(CHANNEL_NAME_MAX, 60)
})

check("detectChannelType", () => {
  assert.equal(detectChannelType("https://discord.com/api/webhooks/1/x"), "DISCORD")
  assert.equal(detectChannelType("https://discordapp.com/api/webhooks/1/x"), "DISCORD")
  assert.equal(detectChannelType("https://ptb.discord.com/api/webhooks/1/x"), "DISCORD")
  assert.equal(detectChannelType("https://canary.discord.com/api/webhooks/1/x"), "DISCORD")
  assert.equal(detectChannelType("https://hooks.slack.com/services/T/B/x"), "SLACK")
  assert.equal(detectChannelType("https://api.telegram.org/bot1:x/sendMessage"), "TELEGRAM")
  assert.equal(detectChannelType("https://ntfy.sh/abc"), "NTFY")
  assert.equal(detectChannelType("https://NTFY.SH/abc"), "NTFY")
  assert.equal(detectChannelType("https://discord.com./api/webhooks/1/x"), "DISCORD")
  assert.equal(detectChannelType("https://Hooks.Slack.com./services/T/B/x"), "SLACK")
  assert.equal(detectChannelType("https://discord.com.evil.example/x"), null)
  assert.equal(detectChannelType("https://www.discord.com/api/webhooks/1/x"), null)
  assert.equal(detectChannelType("https://discord.com:8443/api/webhooks/1/x"), "DISCORD")
  assert.equal(detectChannelType("https://evil.example/discord.com"), null)
  assert.equal(detectChannelType("https://example.com/hrva-webhook"), null)
  assert.equal(detectChannelType("not a url"), null)
  assert.equal(detectChannelType(""), null)
})

check("channel types", () => {
  assert.deepEqual(
    CHANNEL_TYPES.map((entry) => entry.type),
    ["DISCORD", "SLACK", "TELEGRAM", "NTFY", "WEBHOOK"],
  )
  assert.deepEqual(CHANNEL_TYPES, [
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
  ])
})

check("channel field labels", () => {
  assert.deepEqual(notifications.CHANNEL_FIELD_LABELS, {
    botToken: "Bot token",
    chatId: "Chat ID",
    accessToken: "Access token (optional)",
  })
})

check("email labels", () => {
  assert.deepEqual(EMAIL_NOTIFICATION_LABELS, {
    DEAD_LINK_EMAIL: "Dead links",
    WEEKLY_SUMMARY_EMAIL: "Weekly summary",
    EXPIRY_REMINDER_EMAIL: "Expiry reminders",
  })
})

check("email nouns", () => {
  assert.deepEqual(EMAIL_NOTIFICATION_NOUNS, {
    DEAD_LINK_EMAIL: "dead link emails",
    WEEKLY_SUMMARY_EMAIL: "weekly summary emails",
    EXPIRY_REMINDER_EMAIL: "expiry reminder emails",
  })
})

check("channel event labels", () => {
  assert.deepEqual(CHANNEL_EVENT_LABELS, {
    LINK_DEAD: "A link stopped working",
    LINK_BACK: "A link works again",
    DAILY_SUMMARY: "Daily click summary",
    WEEKLY_SUMMARY: "Weekly summary",
  })
  assert.deepEqual(Object.keys(CHANNEL_EVENT_LABELS), ["LINK_DEAD", "LINK_BACK", "DAILY_SUMMARY", "WEEKLY_SUMMARY"])
})

check("channel event hints", () => {
  assert.deepEqual(CHANNEL_EVENT_HINTS, {
    LINK_DEAD: "Checked every night. Sent once when a link is marked dead.",
    LINK_BACK: "Sent when a dead link answers again.",
    DAILY_SUMMARY: "Yesterday's clicks on your links, sent after midnight. Skipped when there were none.",
    WEEKLY_SUMMARY: "Last week's clicks, every Monday morning.",
  })
})

check("destination status labels", () => {
  assert.deepEqual(DESTINATION_STATUS_LABELS, {
    404: "The page wasn't found (404).",
    410: "The page was removed (410).",
    nxdomain: "The website's domain doesn't exist.",
    refused: "The website refused the connection.",
    tls: "The website's secure connection failed.",
  })
})

check("deliveryLine for a channel that was never used", () => {
  assert.equal(deliveryLine(channel(), NOW), "No deliveries yet.")
})

check("deliveryLine for a delivered channel", () => {
  const delivered = channel({ lastDelivery: { status: "SENT", at: "2026-10-27T10:00:00", httpStatus: 204, error: null } })
  assert.equal(deliveryLine(delivered, NOW), "Last delivered 2 hours ago.")
  const justNow = channel({ lastDelivery: { status: "SENT", at: "2026-10-27T11:59:40", httpStatus: 204, error: null } })
  assert.equal(deliveryLine(justNow, NOW), "Last delivered just now.")
})

check("deliveryLine for a failed channel", () => {
  const failed = channel({
    lastDelivery: { status: "FAILED", at: "2026-10-26T12:00:00", httpStatus: 404, error: "The channel answered with HTTP 404. Check the URL." },
  })
  assert.equal(deliveryLine(failed, NOW), "Last delivery failed 1 day ago: The channel answered with HTTP 404. Check the URL.")
})

check("deliveryLine for an auto-disabled channel", () => {
  const disabled = channel({
    enabled: false,
    autoDisabledAt: "2026-10-20T03:00:00",
    lastDelivery: { status: "FAILED", at: "2026-10-20T03:00:00", httpStatus: 404, error: "The channel answered with HTTP 404. Check the URL." },
  })
  assert.equal(deliveryLine(disabled, NOW), "Turned off on Oct 20, 2026 after failing for 10 days. Fix the channel, then turn it on.")
})

check("unsubscribeTokenType reads the email type from the token", () => {
  const token = (payload) => `${Buffer.from(payload).toString("base64url")}.c2lnbmF0dXJl`
  assert.equal(unsubscribeTokenType(token("v1.2.WEEKLY_SUMMARY_EMAIL")), "WEEKLY_SUMMARY_EMAIL")
  assert.equal(unsubscribeTokenType(token("v1.7.DEAD_LINK_EMAIL")), "DEAD_LINK_EMAIL")
  assert.equal(unsubscribeTokenType(token("v1.42.EXPIRY_REMINDER_EMAIL")), "EXPIRY_REMINDER_EMAIL")
  assert.equal(unsubscribeTokenType(token("v1.2.LINK_DEAD")), null)
  assert.equal(unsubscribeTokenType(token("v2.2.WEEKLY_SUMMARY_EMAIL")), null)
  assert.equal(unsubscribeTokenType(token("v1.x.WEEKLY_SUMMARY_EMAIL")), null)
  assert.equal(unsubscribeTokenType(token("v1.2.CONSTRUCTOR")), null)
  assert.equal(unsubscribeTokenType("garbage"), null)
  assert.equal(unsubscribeTokenType("@@@.x"), null)
  assert.equal(unsubscribeTokenType(""), null)
})

check("isConsentedTo reads one email type's switch", () => {
  const consents = [
    { type: "DEAD_LINK_EMAIL", consented: false, grantedAt: null, description: "" },
    { type: "WEEKLY_SUMMARY_EMAIL", consented: true, grantedAt: "2026-10-20T03:00:00", description: "" },
  ]
  assert.equal(isConsentedTo(consents, "DEAD_LINK_EMAIL"), false)
  assert.equal(isConsentedTo(consents, "WEEKLY_SUMMARY_EMAIL"), true)
  assert.equal(isConsentedTo(consents, "EXPIRY_REMINDER_EMAIL"), false)
  assert.equal(isConsentedTo(undefined, "DEAD_LINK_EMAIL"), false)
  assert.equal(DEAD_LINK_EMAIL_SETTINGS_HREF, "/dashboard/settings#notifications")
})

check("strings are ASCII", () => {
  const source = readFileSync(new URL("../lib/notifications.ts", import.meta.url), "utf8")
  const sourceLine = source.split("\n").findIndex((line) => NOT_ASCII.test(line))
  assert.equal(sourceLine, -1, `lib/notifications.ts line ${sourceLine + 1} has a character above U+007F`)
  const failed = channel({ lastDelivery: { status: "FAILED", at: "2026-10-27T10:00:00", httpStatus: 500, error: "Couldn't reach the channel." } })
  const disabled = channel({ autoDisabledAt: "2026-10-20T03:00:00" })
  const values = [...stringsIn(Object.values(notifications)), deliveryLine(channel(), NOW), deliveryLine(failed, NOW), deliveryLine(disabled, NOW)]
  for (const value of values) assert.ok(!NOT_ASCII.test(value), `not ASCII: ${JSON.stringify(value)}`)
})

console.log("ok")
