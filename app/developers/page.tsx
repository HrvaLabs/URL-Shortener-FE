import Link from "next/link"
import type { Metadata } from "next"
import { CodeBlock, InlineCode } from "@/components/code-block"
import { JsonLdScript, SOURCE_REPOSITORIES, pageBreadcrumbs, techArticle } from "@/components/json-ld"
import { StaticPage } from "@/components/static-page"
import { CONTENT_UPDATED } from "@/lib/content-dates"
import { pageMetadata } from "@/lib/seo"

const path = "/developers"
const description =
  "Free URL shortener API: create a key in your hrva.cc dashboard and POST to https://hrva.cc/api/v1/urls. Custom aliases, visit limits, expiry dates and tags, plus an MCP server."

export const metadata: Metadata = pageMetadata({ title: "Free URL shortener API", description, path })

const developersJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    techArticle({
      path,
      headline: "Free URL shortener API: shorten links from your own code",
      description,
      published: "2026-10-29",
      modified: CONTENT_UPDATED[path],
    }),
    pageBreadcrumbs("Developers", path),
  ],
}

const endpoint = "https://hrva.cc/api/v1/urls"

const curlExample = `curl -X POST ${endpoint} \\
  -H "X-Api-Key: $HRVA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"longUrl": "https://example.com/autumn-sale", "shortUrl": "autumn-sale"}'`

const javascriptExample = `const response = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "X-Api-Key": process.env.HRVA_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ longUrl: "https://example.com/autumn-sale", shortUrl: "autumn-sale" }),
})
const link = await response.json()
if (!response.ok) throw new Error(link.detail ?? JSON.stringify(link))
console.log(link.shortLink)`

const pythonExample = `import os
import requests

response = requests.post(
    "${endpoint}",
    headers={"X-Api-Key": os.environ["HRVA_API_KEY"]},
    json={"longUrl": "https://example.com/autumn-sale", "shortUrl": "autumn-sale"},
)
link = response.json()
if not response.ok:
    raise RuntimeError(link.get("detail", response.text))
print(link["shortLink"])`

const responseExample = `{
  "id": 1204,
  "longUrl": "https://example.com/autumn-sale",
  "shortUrl": "autumn-sale",
  "createDate": "2026-10-29T10:00:00Z",
  "expirationDate": null,
  "visits": 0,
  "visitLimit": null,
  "opens": 0,
  "active": true,
  "status": "ACTIVE",
  "tags": [],
  "passwordProtected": false,
  "ownerEmail": "you@example.com",
  "shortLink": "https://hrva.cc/autumn-sale"
}`

const fields = [
  { name: "longUrl", text: "Required. The address to shorten, up to 2,048 characters." },
  { name: "shortUrl", text: "Optional custom alias: up to 32 letters, numbers, hyphens and underscores. Leave it out for a random one." },
  { name: "visitLimit", text: "Optional. The link stops working after this many clicks. Every click counts, also from the same visitor; bots and HEAD requests don't. The answer's opens says how many have counted." },
  { name: "expirationDate", text: "Optional. When the link stops working, as an ISO 8601 date and time with Z or an offset, for example 2026-12-31T23:59:59Z. A value without an offset is read as UTC." },
  { name: "tags", text: "Optional. Up to 10 tags of up to 30 characters each, saved in lowercase." },
  { name: "password", text: "Optional, up to 72 bytes; accented letters count as two. Visitors enter it before they are sent on." },
]

const errors = [
  { status: "400", text: "The link was refused, for example because a safety check blocked the destination; a field is invalid; custom aliases are turned off; or the API key is expired or revoked, or belongs to an inactive account." },
  { status: "401", text: "Nobody is signed in, on an endpoint that needs a signed-in account." },
  { status: "403", text: "You're signed in, but the account isn't allowed to do this." },
  { status: "404", text: "The API key or the link doesn't exist." },
  { status: "409", text: "The custom alias is already taken, or a link that used all its clicks is turned back on before its visit limit is raised." },
  { status: "429", text: "Too many requests in a short time, for example: You've created a lot of links in a short time. Try again in an hour. The Retry-After header says how many seconds are left until the limit resets." },
  { status: "429", text: "The API key made too many requests in the hour. The Retry-After header says how many seconds are left in the hour, and detail says how many minutes." },
  { status: "503", text: "hrva.cc can't check its limits for a moment, so it doesn't make a link without an account or check a link password. Try again after the seconds in Retry-After. Creates with an API key or a signed-in account go on." },
]

const problemExample = `HTTP/1.1 409 Conflict
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "detail": "This short URL is already taken. Try another.",
  "instance": "/api/v1/urls"
}`

const fieldProblemExample = `HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Custom short URL must be 32 characters or fewer",
  "instance": "/api/v1/urls",
  "errors": {
    "shortUrl": "Custom short URL must be 32 characters or fewer"
  }
}`

const shortLinkAnswers = [
  { status: "302", text: "Found: the Location header is the destination." },
  { status: "200", text: "A warning page that shows the destination first, for some links made without an account." },
  { status: "404", text: "There's no link with this name." },
  { status: "410", text: "The link is gone: hrva.cc blocked it, it expired, it reached its visit limit, or its owner turned it off." },
  { status: "503", text: "hrva.cc can't reach its database for a moment. The Retry-After header says how many seconds to wait before trying again." },
]

export default function DevelopersPage() {
  return (
    <StaticPage
      title="A free URL shortener API"
      lead={
        <p>
          The API is free: create a key on your <Link href="/dashboard/api-keys" className="text-brand-link">API keys</Link>{" "}
          page and send it in the <InlineCode>X-Api-Key</InlineCode> header, or as <InlineCode>Authorization: Bearer</InlineCode>. Links made over the API land in your
          dashboard like any other, with the same analytics and safety checks.
        </p>
      }
      after={<JsonLdScript data={developersJsonLd} />}
    >
      <section className="mt-10">
        <h2 className="font-display text-2xl leading-tight">Quickstart</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-foreground/80">
          <li>
            <Link href="/register" className="text-brand-link">Create a free account</Link>, or sign in.
          </li>
          <li>
            Open <Link href="/dashboard/api-keys" className="text-brand-link">API keys</Link>, generate a key and keep it
            secret, for example in an environment variable called <InlineCode>HRVA_API_KEY</InlineCode>. A key looks like{" "}
            <InlineCode>hrva_…</InlineCode> and is shown once, when you create it, so copy it then. hrva.cc stores only a
            hash of it, and the page lists your keys by their first characters.
          </li>
          <li>
            Send a <InlineCode>POST</InlineCode> to <InlineCode wrap>{endpoint}</InlineCode> with the key and a JSON body.
            The key goes in <InlineCode>X-Api-Key: hrva_…</InlineCode> or, for tools that only send bearer tokens, in{" "}
            <InlineCode wrap>Authorization: Bearer hrva_…</InlineCode>. A bearer value that starts with{" "}
            <InlineCode>hrva_</InlineCode> is read as a key, anything else as a sign-in. Send one key; two different ones
            are refused with a <InlineCode>400</InlineCode>.
          </li>
        </ol>
        <CodeBlock label="curl" code={curlExample} copyLabel="curl example" prompt />
        <CodeBlock label="JavaScript (Node 18 or newer)" code={javascriptExample} copyLabel="JavaScript example" />
        <CodeBlock label="Python (requests)" code={pythonExample} copyLabel="Python example" />
      </section>

      <div className="prose-custom">
        <h2 id="request">What you can send</h2>
        <ul>
          {fields.map((field) => (
            <li key={field.name}>
              <code>{field.name}</code>: {field.text}
            </li>
          ))}
        </ul>

        <h2 id="response">What you get back</h2>
        <p>
          A <code>201 Created</code> with the new link. <code>shortLink</code> is the full short link, and the{" "}
          <code>Location</code> header points to the link&apos;s peek URL,{" "}
          <code className="[overflow-wrap:anywhere]">https://hrva.cc/api/v1/urls/&#123;short&#125;/peek</code>.{" "}
          <code>status</code> is <code>ACTIVE</code>, <code>LIMIT_REACHED</code>, <code>EXPIRED</code>, <code>BLOCKED</code> or{" "}
          <code>DEACTIVATED</code>.
        </p>
      </div>
      <CodeBlock label="Response" code={responseExample} copyLabel="response example" mono />

      <div className="prose-custom">
        <h2 id="dates">Dates</h2>
        <p>
          Every date and time the API sends is ISO 8601 in UTC with a <code>Z</code>, like{" "}
          <code>2026-10-30T19:02:13Z</code>. Send yours with <code>Z</code> or an offset; a value without one is read as UTC.
        </p>

        <h2 id="errors">Errors</h2>
        <p>
          Errors use the standard problem details format (<a href="https://www.rfc-editor.org/rfc/rfc9457">RFC 9457</a>),
          with the <code>application/problem+json</code> content type. <code>detail</code> is the message to show,{" "}
          <code>title</code> names the HTTP status, and <code>instance</code> is the path you called. A refused field
          comes in <code>errors</code>, by field name, and <code>detail</code> repeats the first one.
        </p>
        <ul>
          {errors.map((error) => (
            <li key={error.text}>
              <strong>{error.status}</strong>: {error.text}
            </li>
          ))}
        </ul>
      </div>
      <CodeBlock label="An error" code={problemExample} copyLabel="error example" mono />
      <CodeBlock label="A field error" code={fieldProblemExample} copyLabel="field error example" mono />

      <div className="prose-custom">

        <h2 id="limits">Rate limits</h2>
        <p>
          Each API key can make 600 requests an hour by default. Every request sent with the key counts, whatever it asks
          for, and the count starts again after a fixed hour. A key that goes over the limit gets a <code>429</code>.
        </p>
        <p>
          Responses to requests made with a valid API key, allowed or refused, carry three headers, except while the limit
          cannot be checked:
        </p>
        <ul>
          <li>
            <code>RateLimit-Limit</code>: how many requests the key can make in the hour.
          </li>
          <li>
            <code>RateLimit-Remaining</code>: how many it has left.
          </li>
          <li>
            <code>RateLimit-Reset</code>: seconds until the count starts again.
          </li>
        </ul>
        <p>
          A refused request also has a <code>Retry-After</code> header with the seconds left until the limit resets, and a problem details
          body whose <code>detail</code> is{" "}
          <code className="[overflow-wrap:anywhere]">This API key made too many requests. Try again in 12 minutes.</code>.
        </p>
        <p>
          Creating links is also limited per account each hour. Going over that limit is a <code>429</code> as well, with
          the message under Errors. Your <Link href="/dashboard/api-keys">API keys</Link> page shows how many requests each
          key has made, when it was last used and when it expires. A key that is expired or revoked is refused with a{" "}
          <code>detail</code> message. Revoking is final: a revoked or expired key can&apos;t be turned back on or
          given a new expiry (<code>PUT</code> answers <code>409</code>), only deleted, so make a new key instead. Every <code>429</code> has a <code>Retry-After</code> header with the seconds left until the limit resets. Changing your
          password or signing out everywhere doesn&apos;t touch your keys.
        </p>

        <h2 id="short-links">What a short link answers</h2>
        <p>
          <code>https://hrva.cc/&#123;short&#125;</code> (with or without a slash at the end) answers:
        </p>
        <ul>
          {shortLinkAnswers.map((answer) => (
            <li key={answer.status}>
              <strong>{answer.status}</strong>: {answer.text}
            </li>
          ))}
        </ul>
        <p>
          A <code>404</code>, <code>410</code> or <code>503</code> is a small page for people, or a problem details body when you send{" "}
          <code>Accept: application/json</code>. A <code>HEAD</code> request gets the same status and headers as a{" "}
          <code>GET</code> but isn&apos;t counted as a click or a visit, so link checkers and uptime monitors don&apos;t use
          up a visit limit.
        </p>
        <p>
          The short link&apos;s query string is passed on: <code>https://hrva.cc/&#123;short&#125;?ref=mail</code> redirects
          to the destination with <code>ref=mail</code> added after its own parameters and before its fragment. On a name
          clash the destination&apos;s value wins, the <code>qr</code> marker is dropped, and repeated keys and their
          encoding stay as sent. Only the query changes, never the destination&apos;s host.
        </p>

        <h2 id="expiry">When a key expires</h2>
        <p>
          You choose this when you generate a key: 30 days, 90 days, 1 year, a date you pick, or no expiry. The{" "}
          <Link href="/dashboard/api-keys">API keys</Link> page can change it later. To make a key with a request
          instead, send one of these in the body of <code>POST https://hrva.cc/api/v1/api-keys</code>. The answer has the full key
          in <code>key</code> once; later requests return only <code>keyPrefix</code>, the first characters of the key:
        </p>
        <ul>
          <li>
            <code>expiresInDays</code>: a whole number of days from 1 to 3650.
          </li>
          <li>
            <code>neverExpires</code>: <code>true</code> for a key that works until you revoke it.
          </li>
        </ul>
        <p>
          Send neither and the key gets the default expiry, as before. Send both and you get a <code>400</code>:{" "}
          Choose either an expiry in days or no expiry.
        </p>

        <h2 id="more">Two more endpoints that need no key</h2>
        <ul>
          <li>
            <code className="[overflow-wrap:anywhere]">GET https://hrva.cc/api/v1/urls/&#123;short&#125;/peek</code> returns a link&apos;s{" "}
            <code>longUrl</code>, <code>shortUrl</code>, <code>createDate</code> and <code>passwordProtected</code>{" "}
            without counting a visit, the same lookup as <Link href="/validate">Check a link</Link>. For a password-protected
            link, <code>longUrl</code> is <code>null</code>.
          </li>
          <li>
            <code className="[overflow-wrap:anywhere]">GET https://hrva.cc/api/v1/urls/&#123;short&#125;/qr</code> returns a QR code PNG of the short link,
            with an optional <code>size</code>. Its scans count as QR scans in the link&apos;s analytics.
          </li>
        </ul>
        <p>
          Everything else, including the endpoints the web app uses, is in the{" "}
          <a href="https://hrva.cc/swagger-ui/index.html">API reference (Swagger)</a>.
        </p>

        <h2 id="ai">Use it from an AI assistant</h2>
        <p>
          Claude, ChatGPT, Cursor and VS Code can shorten links into your account, list them and read their visits
          through the <Link href="/mcp">hrva.cc MCP server</Link>, with no API key: you sign in once.
        </p>

        <h2 id="status">Status and source</h2>
        <p>
          Uptime and incidents are on the <a href="https://status.hrva.cc/status/url">status page</a>. The{" "}
          <a href={SOURCE_REPOSITORIES[0]}>backend code</a> is on GitHub under the GPL-3.0 licence.
        </p>
      </div>
    </StaticPage>
  )
}
