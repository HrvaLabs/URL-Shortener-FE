import Link from "next/link"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HelpBreadcrumbs } from "@/components/json-ld"
import { pageMetadata } from "@/lib/seo"

const description =
  "Which emails and chat alerts hrva.cc can send you, how to turn them on and off, what a dead link is, and how to check a webhook's signature."


export const metadata: Metadata = pageMetadata({ title: "Notifications and webhooks", description, path: "/help/notifications" })

const codeBlockClass =
  "mb-5 whitespace-pre-wrap rounded-lg border bg-muted px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground [overflow-wrap:anywhere]"

const exampleHeaders = `Content-Type: application/json
X-Hrva-Event: link.dead
X-Hrva-Delivery: 5b0f8c2e-4d1a-4f7e-9a63-2c8e1d7b9f40
X-Hrva-Signature: sha256=<64 lowercase hex characters>`

const linkDeadBody = `{
  "event": "link.dead",
  "deliveryId": "5b0f8c2e-4d1a-4f7e-9a63-2c8e1d7b9f40",
  "createdAt": "2026-10-27T01:14:00Z",
  "links": [
    {
      "shortUrl": "https://hrva.cc/abc",
      "destinationHost": "example.com",
      "deadSince": "2026-10-27",
      "lastStatus": "404"
    }
  ]
}`

const linkBackBody = `{
  "event": "link.back",
  "deliveryId": "0c7d3a19-86be-4e52-b1f4-7a2d9e5c3b68",
  "createdAt": "2026-10-29T01:14:00Z",
  "links": [
    {
      "shortUrl": "https://hrva.cc/abc",
      "destinationHost": "example.com",
      "deadSince": "2026-10-27",
      "backOn": "2026-10-29"
    }
  ]
}`

const dailyBody = `{
  "event": "summary.daily",
  "deliveryId": "e41b6f02-9d3c-4a87-8c15-3f0a7b2d6e94",
  "createdAt": "2026-10-30T00:15:00Z",
  "date": "2026-10-29",
  "totals": { "clicks": 142, "uniqueVisitors": 97, "botClicks": 9 },
  "links": [
    {
      "shortUrl": "https://hrva.cc/abc",
      "destinationHost": "example.com",
      "clicks": 88,
      "uniqueVisitors": 61,
      "botClicks": 4
    }
  ],
  "moreLinks": 0
}`

const weeklyBody = `{
  "event": "summary.weekly",
  "deliveryId": "a83f1d70-2b6e-4c95-8e07-5d9c4a1f7b32",
  "createdAt": "2026-11-02T08:00:00Z",
  "from": "2026-10-26",
  "to": "2026-11-01",
  "totals": { "clicks": 910, "clicksWeekBefore": 760, "uniqueVisitors": 604 },
  "topLinks": [
    { "shortUrl": "https://hrva.cc/abc", "destinationHost": "example.com", "clicks": 412 }
  ],
  "deadLinks": [
    {
      "shortUrl": "https://hrva.cc/old",
      "destinationHost": "example.org",
      "deadSince": "2026-10-28",
      "lastStatus": "nxdomain"
    }
  ],
  "endingSoon": [
    {
      "shortUrl": "https://hrva.cc/sale",
      "destinationHost": "example.com",
      "reason": "EXPIRES",
      "expiresOn": "2026-11-04",
      "visitsLeft": null
    },
    {
      "shortUrl": "https://hrva.cc/promo",
      "destinationHost": null,
      "reason": "VISIT_LIMIT",
      "expiresOn": null,
      "visitsLeft": 12
    }
  ],
  "moreDeadLinks": 0,
  "moreEndingSoon": 0
}`

const testBody = `{
  "event": "test",
  "deliveryId": "test-f2c9e8b4-1a75-4d03-b6e8-9c3a0d7f5e21",
  "createdAt": "2026-10-27T12:00:00Z",
  "message": "This is a test from hrva.cc. Your channel works."
}`

const pythonCheck = `import hashlib
import hmac

def signature_is_valid(secret: str, body: bytes, header: str) -> bool:
    expected = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header)

# body is the raw request body, before any JSON parsing
# header is the X-Hrva-Signature header`

const nodeCheck = `const crypto = require("node:crypto")

function signatureIsValid(secret, rawBody, header) {
  const expected = Buffer.from(
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex"),
  )
  const received = Buffer.from(header || "")
  return expected.length === received.length && crypto.timingSafeEqual(expected, received)
}

// rawBody is the request body as a Buffer, before JSON.parse`

export default function NotificationsHelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <p className="text-sm text-muted-foreground">
              <Link href="/help" className="transition-colors hover:text-foreground">Help</Link>
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">Notifications and webhooks</h1>

            <div className="mt-8 rounded-xl border bg-muted/40 p-5">
              <p className="leading-7 text-foreground">
                In short: open <strong>Settings</strong> and find <strong>Notifications</strong>. Turn on the
                emails you want, or add a channel for Discord, Slack, Telegram, ntfy or your own webhook and pick
                what it gets. Everything is off until you turn it on, and you can turn anything off again at any
                time.
              </p>
            </div>

            <div className="prose-custom">
              <h2 id="what-you-can-get">What you can get</h2>
              <p>Three emails, sent to your account&apos;s email address:</p>
              <ul>
                <li>
                  <strong>Dead links</strong>: one email when hrva.cc marks one or more of your links dead.
                </li>
                <li>
                  <strong>Weekly summary</strong>: last week&apos;s clicks, every Monday morning.
                </li>
                <li>
                  <strong>Expiry reminders</strong>: an email a day before one of your links expires.
                </li>
              </ul>
              <p>Four events you can send to a channel:</p>
              <ul>
                <li>
                  <strong>A link stopped working</strong>: checked every night, sent once when a link is marked
                  dead.
                </li>
                <li>
                  <strong>A link works again</strong>: sent when a dead link answers again.
                </li>
                <li>
                  <strong>Daily click summary</strong>: yesterday&apos;s clicks on your links, sent at 08:00
                  Croatian time, and skipped when there were none. A channel message lists up to 20 links, the ones
                  with the most clicks first, then says <strong>and N more</strong>, with N the number left out.
                </li>
                <li>
                  <strong>Weekly summary</strong>: last week&apos;s clicks, every Monday morning.
                </li>
              </ul>
              <p>
                Nothing is on by default, and nothing is sent until you turn it on. Your dashboard shows dead
                links whether or not you turn anything on.
              </p>

              <h2 id="email">Email</h2>
              <ol>
                <li>
                  Sign in and open <Link href="/dashboard/settings#notifications">Settings</Link>. Under{" "}
                  <strong>Notifications</strong>, the <strong>Email</strong> section shows the address the emails
                  go to.
                </li>
                <li>
                  Turn on the switch for each email you want: <strong>Dead links</strong>,{" "}
                  <strong>Weekly summary</strong> or <strong>Expiry reminders</strong>. Each switch says what it
                  sends, and once it&apos;s on, <strong>On since</strong> shows the date you turned it on.
                </li>
              </ol>
              <p>
                The weekly summary has your clicks compared with the week before, your top links, links that
                stopped working that week and links that end soon: they expire within 7 days, or have 10% or
                fewer of their visits left. A week with no clicks and nothing to report sends nothing. The daily
                click summary and <strong>A link works again</strong> aren&apos;t sent by email; add a channel for
                those.
              </p>
              <p>
                Expiry reminders used to be sent to everyone. They&apos;re now off until you turn them on, like
                the other two.
              </p>

              <h2 id="unsubscribe">Unsubscribe</h2>
              <ol>
                <li>Open the link at the bottom of the notification email.</li>
                <li>
                  On the page that opens, select <strong>Unsubscribe</strong>. It says, for example,{" "}
                  <strong>Done. You won&apos;t get weekly summary emails any more.</strong>
                </li>
              </ol>
              <p>
                If that email was already off, the page says so, for example{" "}
                <strong>Weekly summary emails were already off.</strong> You
                don&apos;t need to sign in. Mail apps that show their own unsubscribe button turn the email off in
                one click too. Or turn the switch off in <Link href="/dashboard/settings#notifications">Settings</Link>,
                under <strong>Notifications</strong>.
              </p>
              <p>
                Emails about your account itself, such as address verification, password reset, security notices
                and a link being blocked, aren&apos;t notifications and can&apos;t be turned off.
              </p>

              <h2 id="dead-links">When a link looks dead</h2>
              <p>
                Every night hrva.cc checks where each active link goes. A link is marked dead when its destination
                fails in one of these ways on 3 different nights, with no working answer in between:
              </p>
              <ul>
                <li>the page wasn&apos;t found (404) or was removed (410)</li>
                <li>the website&apos;s domain doesn&apos;t exist</li>
                <li>the website refused the connection</li>
                <li>the website&apos;s secure connection failed</li>
              </ul>
              <p>
                Slow answers, server errors, rate limits and pages behind a login or a bot check never count. They
                don&apos;t move a link towards dead, and they don&apos;t reset the count either.
              </p>
              <p>
                A dead link shows <strong>Destination looks dead</strong> on your <Link href="/dashboard">URLs
                page</Link> and in the link&apos;s analytics, with the date and the reason, for example{" "}
                <strong>The page wasn&apos;t found (404).</strong> The badge shows only while the link is active.
                While dead link emails are off, it also links to Settings with{" "}
                <strong>Get an email when this happens</strong>.
              </p>
              <p>
                The badge goes away by itself on the first night the destination works again. If the page moved,
                shorten its new address and turn the old link off. You can&apos;t change where an existing short
                link points; only an admin can, and that clears the badge at once.
              </p>
              <p>
                Links made without an account are checked too, and only the admin sees their result.
              </p>

              <h2 id="link-checker">The hrva.cc link checker</h2>
              <p>
                If you run a website and found this page in your logs, this is what the checker does:
              </p>
              <ul>
                <li>
                  It sends a HEAD request to each destination. When the answer needs confirming, it sends a small
                  GET that asks for the first 1 KB only.
                </li>
                <li>
                  It runs from hrva.cc&apos;s server in Oracle Cloud, Frankfurt.
                </li>
                <li>
                  It checks each link at most once a night, and sends at most one request every 5 seconds to any
                  one website. It follows up to 5 redirects.
                </li>
                <li>
                  It identifies itself with the User-Agent{" "}
                  <code className="[overflow-wrap:anywhere]">hrva.cc-linkcheck/1.0 (+https://app.hrva.cc/help/notifications#link-checker)</code>.
                </li>
                <li>
                  It sends no cookies and no visitor data. It never opens the short link itself, so a check never
                  counts as a click.
                </li>
              </ul>
              <p>
                Questions or problems with the checker: email <a href="mailto:abuse@hrva.cc">abuse@hrva.cc</a>.
              </p>

              <h2 id="channels">Channels</h2>
              <p>
                A channel sends notifications to a chat app or to your own server. Under{" "}
                <strong>Chat apps and webhooks</strong> in <Link href="/dashboard/settings#notifications">Settings</Link>:
              </p>
              <ol>
                <li>
                  Select <strong>Add channel</strong>.
                </li>
                <li>
                  Choose the <strong>Type</strong>: <strong>Discord</strong>, <strong>Slack</strong>,{" "}
                  <strong>Telegram</strong>, <strong>ntfy</strong> or <strong>Webhook (signed JSON)</strong>.
                </li>
                <li>
                  Give it a <strong>Name</strong> you&apos;ll recognise, such as <code>Team alerts</code>, up to
                  60 characters.
                </li>
                <li>
                  Fill in the type&apos;s fields: <strong>Webhook URL</strong> for Discord and Slack,{" "}
                  <strong>Bot token</strong> and <strong>Chat ID</strong> for Telegram, <strong>Topic URL</strong>{" "}
                  and <strong>Access token (optional)</strong> for ntfy, and <strong>URL</strong> for a webhook.{" "}
                  <strong>How to get this</strong> links to the steps below. If you paste an address that belongs
                  to another type, the form says so, for example <strong>This looks like a Discord URL.</strong>,
                  with <strong>Switch to Discord</strong>.
                </li>
                <li>
                  Under <strong>Send me</strong>, tick the events this channel should get. None is ticked to start
                  with, and while none is, the dialog says the channel won&apos;t get any messages.
                </li>
                <li>
                  Select <strong>Add channel</strong>, then <strong>Send test</strong> on the new channel. It says{" "}
                  <strong>Sent. Check Discord.</strong> (or Slack, Telegram, ntfy or your webhook, for those types),
                  or why the test failed.
                </li>
              </ol>
              <p>
                Each channel shows its address masked, its events and its last delivery:{" "}
                <strong>No deliveries yet.</strong>, <strong>Last delivered</strong> with the time, or{" "}
                <strong>Last delivery failed</strong> with the time and the reason. Its switch pauses the channel
                without deleting it: <strong>On</strong> turns to <strong>Off</strong>. <strong>Edit</strong> changes
                its name, address and events; saved addresses and tokens stay hidden, and under each of those fields it
                says <strong>Saved. Leave empty to keep it.</strong> A channel&apos;s type can&apos;t be changed: to
                change the type, add a new channel. <strong>Delete</strong> removes the channel, and it stops
                getting notifications at once.
              </p>
              <p>
                You can have up to 10 channels.
              </p>

              <h3 id="discord">Discord</h3>
              <ol>
                <li>
                  In Discord, open the settings of the channel the messages should go to (or{" "}
                  <strong>Server Settings</strong>), then <strong>Integrations</strong>, then{" "}
                  <strong>Webhooks</strong>. You need the Manage Webhooks permission.
                </li>
                <li>
                  Select <strong>New Webhook</strong>, check that it posts to the right channel, and select{" "}
                  <strong>Copy Webhook URL</strong>.
                </li>
                <li>
                  In hrva.cc, add a channel with the type <strong>Discord</strong> and paste the address into{" "}
                  <strong>Webhook URL</strong>. It starts with <code className="[overflow-wrap:anywhere]">https://discord.com/api/webhooks/</code>.
                </li>
              </ol>
              <p>
                Messages never ping anyone and show no link previews. Like the other channel types, a Discord
                channel you add shows a destination host that is an IP address, or a name that looks like an email
                address, as it is.
              </p>

              <h3 id="slack">Slack</h3>
              <ol>
                <li>
                  Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer">api.slack.com/apps</a>,
                  select <strong>Create New App</strong>, then <strong>From scratch</strong>, name it (for example{" "}
                  <code>hrva.cc</code>) and pick your workspace.
                </li>
                <li>
                  Open <strong>Incoming Webhooks</strong> and turn on <strong>Activate Incoming Webhooks</strong>.
                </li>
                <li>
                  Select <strong>Add New Webhook</strong>, pick the channel and allow it. Copy the new{" "}
                  <strong>Webhook URL</strong>.
                </li>
                <li>
                  In hrva.cc, add a channel with the type <strong>Slack</strong> and paste the address into{" "}
                  <strong>Webhook URL</strong>. It starts with <code className="[overflow-wrap:anywhere]">https://hooks.slack.com/services/</code>.
                </li>
              </ol>

              <h3 id="telegram">Telegram</h3>
              <ol>
                <li>
                  In Telegram, open <code>@BotFather</code>, send <code>/newbot</code> and choose a name and a
                  username for the bot. BotFather answers with a token like{" "}
                  <code>123456789:AAH4Fq2xYzExample</code>. Paste it into <strong>Bot token</strong>.
                </li>
                <li>
                  Add the bot to the group that should get the messages, or make it an admin of your channel. For
                  messages to yourself, open a chat with the bot and select <strong>Start</strong>.
                </li>
                <li>
                  Fill in <strong>Chat ID</strong>. For a public channel, that&apos;s its name, like{" "}
                  <code>@mychannel</code>. Otherwise, send a message in the chat (in a group, send{" "}
                  <code>/start</code>), then open{" "}
                  <code className="[overflow-wrap:anywhere]">https://api.telegram.org/bot&lt;your token&gt;/getUpdates</code> in your browser and copy
                  the number after <code>&quot;chat&quot;:&#123;&quot;id&quot;:</code>. Group and channel IDs
                  start with a minus sign, like <code>-1001234567890</code>.
                </li>
                <li>
                  In hrva.cc, add a channel with the type <strong>Telegram</strong>.
                </li>
              </ol>
              <p>
                If a test says Telegram refused the bot token, check the token with BotFather.
              </p>

              <h3 id="ntfy">ntfy</h3>
              <ol>
                <li>
                  Pick a topic name that&apos;s hard to guess, such as <code>hrva-7f3k9q2m</code>. Anyone who knows
                  a topic&apos;s name on ntfy.sh can read it.
                </li>
                <li>
                  Subscribe to the topic in the ntfy app on your phone or computer.
                </li>
                <li>
                  In hrva.cc, add a channel with the type <strong>ntfy</strong> and enter the{" "}
                  <strong>Topic URL</strong>, like <code className="[overflow-wrap:anywhere]">https://ntfy.sh/hrva-7f3k9q2m</code>. A topic on your own
                  ntfy server works too, as long as the server has a public https address.
                </li>
                <li>
                  If the topic needs a login, create an access token in ntfy (under <strong>Account</strong>, then{" "}
                  <strong>Access tokens</strong>) and paste it into <strong>Access token (optional)</strong>.
                  Otherwise leave it empty.
                </li>
              </ol>

              <h3 id="webhook">Webhooks (signed JSON)</h3>
              <p>
                A webhook channel sends a JSON <code>POST</code> to your own https address, signed so you can check
                that it came from hrva.cc. Add a channel with the type <strong>Webhook (signed JSON)</strong> and
                enter its <strong>URL</strong>. It must be a public https address, and not a Discord, Slack,
                Telegram or ntfy.sh address: for those, choose that type instead, so messages arrive formatted.
              </p>
              <p>
                After you add it, <strong>Your signing secret</strong> appears at the top of{" "}
                <strong>Chat apps and webhooks</strong>. This is the only time it&apos;s shown: select{" "}
                <strong>Copy secret</strong>, store it where your server can read it, then select{" "}
                <strong>I&apos;ve saved it</strong>.
              </p>
              <p>Every request has these headers:</p>
              <pre className={codeBlockClass}>{exampleHeaders}</pre>
              <ul>
                <li>
                  <code>X-Hrva-Event</code>: <code>link.dead</code>, <code>link.back</code>,{" "}
                  <code>summary.daily</code>, <code>summary.weekly</code>, or <code>test</code> for{" "}
                  <strong>Send test</strong>.
                </li>
                <li>
                  <code>X-Hrva-Delivery</code>: the delivery&apos;s ID, the same as <code>deliveryId</code> in the
                  body.
                </li>
                <li>
                  <code>X-Hrva-Signature</code>: <code>sha256=</code> and the lowercase hex HMAC-SHA256 of the raw
                  body, keyed with your signing secret.
                </li>
              </ul>
              <h3 id="webhook-bodies">What each event sends</h3>
              <p>
                The body is one JSON object. Every event has these three fields, then its own:
              </p>
              <ul>
                <li>
                  <code>event</code> (string): the event, the same as the <code>X-Hrva-Event</code> header.
                </li>
                <li>
                  <code>deliveryId</code> (string): the delivery&apos;s ID, the same as the{" "}
                  <code>X-Hrva-Delivery</code> header.
                </li>
                <li>
                  <code>createdAt</code> (string): when the delivery was created, as a UTC instant to the second
                  ending in <code>Z</code>.
                </li>
              </ul>
              <p>These meanings hold for every event:</p>
              <ul>
                <li>
                  <code>shortUrl</code> (string) is the full short link, starting with https. For a link on your
                  own custom domain, it is on that domain.
                </li>
                <li>
                  <code>destinationHost</code> (string or <code>null</code>) is the host of the link&apos;s
                  destination, such as <code>example.com</code>. It is <code>null</code> when the destination
                  can&apos;t be read.
                </li>
                <li>
                  Dates other than <code>createdAt</code> are calendar days written as <code>YYYY-MM-DD</code>,
                  counted in Europe/Zagreb time, not UTC. They are <code>deadSince</code>, <code>backOn</code>,{" "}
                  <code>date</code>, <code>from</code>, <code>to</code> and <code>expiresOn</code>.
                </li>
              </ul>

              <h3 id="body-link-dead">link.dead</h3>
              <p>Sent when hrva.cc marks one or more of your links dead.</p>
              <pre className={codeBlockClass}>{linkDeadBody}</pre>
              <p>
                <code>links</code> (list) holds the links marked dead. Each item has:
              </p>
              <ul>
                <li>
                  <code>shortUrl</code> (string) and <code>destinationHost</code> (string or <code>null</code>),
                  as above.
                </li>
                <li>
                  <code>deadSince</code> (string): the day the link was marked dead.
                </li>
                <li>
                  <code>lastStatus</code> (string): why it was marked dead. It is one of the values below.
                </li>
              </ul>
              <p id="last-status">
                <code>lastStatus</code> is one of five values. It is on <code>link.dead</code> and on{" "}
                <code>deadLinks</code> in <code>summary.weekly</code>:
              </p>
              <ul>
                <li>
                  <code>&quot;404&quot;</code>: the destination answered that the page wasn&apos;t found.
                </li>
                <li>
                  <code>&quot;410&quot;</code>: the destination answered that the page was removed.
                </li>
                <li>
                  <code>&quot;nxdomain&quot;</code>: the website&apos;s domain doesn&apos;t exist.
                </li>
                <li>
                  <code>&quot;refused&quot;</code>: the website refused the connection.
                </li>
                <li>
                  <code>&quot;tls&quot;</code>: the website&apos;s secure connection failed.
                </li>
              </ul>

              <h3 id="body-link-back">link.back</h3>
              <p>Sent when a dead link answers again.</p>
              <pre className={codeBlockClass}>{linkBackBody}</pre>
              <p>
                <code>links</code> (list) holds the links that work again. Each item has:
              </p>
              <ul>
                <li>
                  <code>shortUrl</code> (string) and <code>destinationHost</code> (string or <code>null</code>),
                  as above.
                </li>
                <li>
                  <code>deadSince</code> (string): the day the link was marked dead.
                </li>
                <li>
                  <code>backOn</code> (string): the day it answered again.
                </li>
              </ul>

              <h3 id="body-summary-daily">summary.daily</h3>
              <p>Sent after midnight, with yesterday&apos;s clicks. A day with no clicks and no bot clicks sends nothing.</p>
              <pre className={codeBlockClass}>{dailyBody}</pre>
              <ul>
                <li>
                  <code>date</code> (string): the day the numbers are for.
                </li>
                <li>
                  <code>totals</code> (object): <code>clicks</code>, <code>uniqueVisitors</code> and{" "}
                  <code>botClicks</code>, all whole numbers for that day over all your links. Bot clicks are
                  counted apart from <code>clicks</code>.
                </li>
                <li>
                  <code>links</code> (list): at most 20 links, the most clicks first, then the most bot clicks.
                  Each has <code>shortUrl</code>, <code>destinationHost</code>, <code>clicks</code>,{" "}
                  <code>uniqueVisitors</code> and <code>botClicks</code> for that day. A link with only bot
                  clicks is included.
                </li>
                <li>
                  <code>moreLinks</code> (number): how many more links had clicks that day and are not in{" "}
                  <code>links</code>. <code>0</code> when all are listed.
                </li>
              </ul>

              <h3 id="body-summary-weekly">summary.weekly</h3>
              <p>
                Sent on Monday morning, with last week&apos;s clicks. A week with no clicks and nothing to report
                sends nothing.
              </p>
              <pre className={codeBlockClass}>{weeklyBody}</pre>
              <ul>
                <li>
                  <code>from</code> and <code>to</code> (string): the first and last day of the week, both
                  included.
                </li>
                <li>
                  <code>totals</code> (object): <code>clicks</code> for the week, <code>clicksWeekBefore</code>{" "}
                  for the week before it, and <code>uniqueVisitors</code>. This is each link&apos;s daily unique
                  visitors added up over the week, so someone who visits on two days counts twice. It is not the
                  number of different visitors in the week.
                </li>
                <li>
                  <code>topLinks</code> (list): at most 5 links, the most clicks first. Each has{" "}
                  <code>shortUrl</code>, <code>destinationHost</code> and <code>clicks</code> for the week.
                </li>
                <li>
                  <code>deadLinks</code> (list): at most 20 links marked dead that week, the earliest first. A dead link
                  you have since turned off isn&apos;t listed. Each has the fields of a{" "}
                  <code>link.dead</code> link: <code>shortUrl</code>, <code>destinationHost</code>,{" "}
                  <code>deadSince</code> and <code>lastStatus</code>.
                </li>
                <li>
                  <code>endingSoon</code> (list): at most 20 active links that expire within 7 days or have 10% or
                  fewer of their visits left, the soonest end date first and the visit-limit links after them. Each has <code>shortUrl</code>, <code>destinationHost</code>,{" "}
                  <code>reason</code>, <code>expiresOn</code> and <code>visitsLeft</code>.
                </li>
                <li>
                  <code>moreDeadLinks</code> and <code>moreEndingSoon</code> (numbers): how many more links
                  belong in <code>deadLinks</code> and <code>endingSoon</code> than are listed. <code>0</code>{" "}
                  when all are listed.
                </li>
              </ul>
              <p id="ending-soon-reason">
                In <code>endingSoon</code>, <code>reason</code> is one of two values, in capitals. The other two
                fields depend on it, and the one that doesn&apos;t apply is <code>null</code>:
              </p>
              <ul>
                <li>
                  <code>&quot;EXPIRES&quot;</code>: the link ends within 7 days. <code>expiresOn</code> is that day
                  and <code>visitsLeft</code> is <code>null</code>.
                </li>
                <li>
                  <code>&quot;VISIT_LIMIT&quot;</code>: the link is nearly out of visits. <code>visitsLeft</code>{" "}
                  is how many are left and <code>expiresOn</code> is <code>null</code>.
                </li>
              </ul>

              <h3 id="body-test">test</h3>
              <p>Sent by <strong>Send test</strong>.</p>
              <pre className={codeBlockClass}>{testBody}</pre>
              <ul>
                <li>
                  <code>message</code> (string): a fixed sentence saying the channel works.
                </li>
                <li>
                  The <code>deliveryId</code> of a test starts with <code>test-</code>, and so does its{" "}
                  <code>X-Hrva-Delivery</code> header.
                </li>
              </ul>
              <p>
                A list with nothing to show is <code>[]</code>. A field that doesn&apos;t apply is{" "}
                <code>null</code>, not left out. A list with a cap holds the first items in the order given
                above, and its <code>more</code> field counts the rest.
              </p>

              <h3 id="check-signature">Check the signature</h3>
              <p>
                Use the raw body, before parsing. Parsing and re-encoding the JSON changes its bytes, and the
                signature no longer matches. Compare in constant time, as both examples do.
              </p>
              <p>Python:</p>
              <pre className={codeBlockClass}>{pythonCheck}</pre>
              <p>Node.js:</p>
              <pre className={codeBlockClass}>{nodeCheck}</pre>
              <p>
                Answer with any 2xx status within 10 seconds. hrva.cc doesn&apos;t follow redirects, so a 3xx
                counts as a failure. A delivery that gets no answer, times out, or gets 408, 429 or a 5xx is tried
                again 1, 10 and 60 minutes later, 4 tries in all; any other answer is not retried. A retry has
                the same <code>X-Hrva-Delivery</code> and <code>createdAt</code>, so you can spot repeats and
                handle each delivery once.
              </p>
              <p>
                If the secret leaks, select <strong>New signing secret</strong> on the channel. The old secret
                stops working at once, and the new one is shown once, like the first.
              </p>

              <h2 id="auto-off">When a channel stops working</h2>
              <p>
                When a delivery fails, the channel shows <strong>Last delivery failed</strong> and the reason,
                even while hrva.cc is still trying it again. A failure that may pass (no answer, a timeout, or a
                408, 429 or 5xx) is tried again 1, 10 and 60 minutes later, so for about an hour, and the line
                changes to <strong>Last delivered</strong> if a try gets through. Only a delivery hrva.cc gives up
                on counts towards the 10 days: one whose last try failed, or one that got any other answer. If
                that happens on 10 different days with no successful delivery in between, the channel turns
                itself off and says{" "}
                <strong>Turned off on</strong> the date{" "}
                <strong>after failing for 10 days. Fix the channel, then turn it on.</strong>
              </p>
              <ol>
                <li>
                  Fix the cause, for example a webhook someone deleted in Discord: create a new one and paste it
                  with <strong>Edit</strong>.
                </li>
                <li>
                  Use <strong>Send test</strong> to check it. Tests don&apos;t count towards the 10 days.
                </li>
                <li>
                  Turn the channel back on with its switch, so it says <strong>On</strong> again.
                </li>
              </ol>

              <h2 id="privacy">Notifications and your privacy</h2>
              <ul>
                <li>
                  Emails and channel messages carry counts, your short links, their destination hosts and dates,
                  never your visitors&apos; IP addresses, browsers or referrers, and never your email address.
                </li>
                <li>
                  Channel addresses, bot tokens, access tokens and signing secrets are encrypted when saved. After
                  that, addresses and bot tokens are shown masked, and access tokens and signing secrets aren&apos;t
                  shown again.
                </li>
                <li>
                  Each time you turn a notification on or off, hrva.cc keeps a record of when and how, as proof of
                  your choice, until you delete your account.
                </li>
                <li>
                  Each delivery to a channel is kept for 30 days, to retry failures and show you the last result.
                </li>
                <li>
                  The data export in Settings includes your consent history and your channels: masked
                  addresses, the Telegram chat ID, and when each channel last delivered or turned off. It never
                  includes tokens or secrets.
                </li>
              </ul>
              <p>
                The <Link href="/privacy">Privacy Policy</Link> has the details.
              </p>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
      <HelpBreadcrumbs name="Notifications and webhooks" path="/help/notifications" />
    </div>
  )
}
