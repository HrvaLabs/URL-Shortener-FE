import Link from "next/link"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

const description =
  "Which emails and chat alerts hrva.cc can send you, how to turn them on and off, what a dead link is, and how to check a webhook's signature."

const socialTitle = `Notifications and webhooks ${String.fromCodePoint(0x2014)} hrva.cc`

export const metadata: Metadata = {
  title: "Notifications and webhooks",
  description,
  alternates: { canonical: "https://app.hrva.cc/help/notifications" },
  openGraph: {
    url: "https://app.hrva.cc/help/notifications",
    title: socialTitle,
    description,
  },
}

const codeBlockClass =
  "mb-5 whitespace-pre-wrap rounded-lg border bg-muted px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground [overflow-wrap:anywhere]"

const exampleHeaders = `Content-Type: application/json
X-Hrva-Event: link.dead
X-Hrva-Delivery: 5b0f8c2e-4d1a-4f7e-9a63-2c8e1d7b9f40
X-Hrva-Signature: sha256=<64 lowercase hex characters>`

const exampleBody = `{
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
                  <strong>Daily click summary</strong>: yesterday&apos;s clicks on your links, sent after
                  midnight, and skipped when there were none.
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
                If that email was already off, the page says <strong>These emails were already off.</strong> You
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
              </p>
              <p>
                The badge goes away by itself on the first night the destination works again. If the page moved,
                edit the link and give it the new destination: that clears the badge at once, and the new
                destination is checked from the next night.
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
                  with, and a channel with none ticked gets nothing.
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
                <strong>Last delivery failed</strong> with the time and the reason. The <strong>On</strong>{" "}
                switch pauses a channel without deleting it. <strong>Edit</strong> changes its name, address and
                events; saved addresses and tokens stay hidden, so the fields say{" "}
                <strong>Saved. Leave empty to keep it.</strong> A channel&apos;s type can&apos;t be changed: to
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
                Messages never ping anyone and show no link previews.
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
              <p>
                This is the body when a link stops working (the other events carry their own fields, such as{" "}
                <code>backOn</code> for <code>link.back</code> and <code>totals</code> for the summaries):
              </p>
              <pre className={codeBlockClass}>{exampleBody}</pre>

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
                  Turn the channel back on with its <strong>On</strong> switch.
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
                  The data export in Settings includes your consent history and your channels, with masked
                  addresses only.
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
    </div>
  )
}
