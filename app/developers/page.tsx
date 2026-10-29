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
if (!response.ok) throw new Error(link.error ?? JSON.stringify(link))
console.log(\`https://hrva.cc/\${link.shortUrl}\`)`

const pythonExample = `import os
import requests

response = requests.post(
    "${endpoint}",
    headers={"X-Api-Key": os.environ["HRVA_API_KEY"]},
    json={"longUrl": "https://example.com/autumn-sale", "shortUrl": "autumn-sale"},
)
link = response.json()
response.raise_for_status()
print(f"https://hrva.cc/{link['shortUrl']}")`

const responseExample = `{
  "id": 1204,
  "longUrl": "https://example.com/autumn-sale",
  "shortUrl": "autumn-sale",
  "createDate": "2026-10-29T10:00:00",
  "expirationDate": null,
  "visits": 0,
  "visitLimit": null,
  "active": true,
  "status": "ACTIVE",
  "tags": [],
  "passwordProtected": false,
  "ownerEmail": "you@example.com"
}`

const fields = [
  { name: "longUrl", text: "Required. The address to shorten, up to 2,048 characters." },
  { name: "shortUrl", text: "Optional custom alias: up to 32 letters, numbers, hyphens and underscores. Leave it out for a random one." },
  { name: "visitLimit", text: "Optional. The link stops working after this many visits." },
  { name: "expirationDate", text: "Optional. When the link stops working, as an ISO 8601 date and time, for example 2026-12-31T23:59:59." },
  { name: "tags", text: "Optional. Up to 10 tags of up to 30 characters each, saved in lowercase." },
  { name: "password", text: "Optional. Visitors enter it before they are sent on." },
]

const errors = [
  { status: "400", text: "The link was refused, for example because a safety check blocked the destination, or a field is invalid. The body is {\"error\": \"...\"}, or one message per field." },
  { status: "404", text: "The API key doesn't exist." },
  { status: "409", text: "The custom alias is already taken." },
  { status: "429", text: "Too many links in a short time. The body says: You've created a lot of links in a short time. Try again in an hour." },
]

export default function DevelopersPage() {
  return (
    <StaticPage
      title="A free URL shortener API"
      lead={
        <p>
          The API is free: create a key on your <Link href="/dashboard/api-keys" className="text-brand-link">API keys</Link>{" "}
          page and send it in the <InlineCode>X-Api-Key</InlineCode> header. Links made over the API land in your
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
            secret, for example in an environment variable called <InlineCode>HRVA_API_KEY</InlineCode>.
          </li>
          <li>
            Send a <InlineCode>POST</InlineCode> to <InlineCode wrap>{endpoint}</InlineCode> with the key and a JSON body.
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
          A <code>200 OK</code> with the new link. The short link is <code>https://hrva.cc/</code> followed by{" "}
          <code>shortUrl</code>. <code>status</code> is <code>ACTIVE</code>, <code>LIMIT_REACHED</code>,{" "}
          <code>EXPIRED</code>, <code>BLOCKED</code> or <code>DEACTIVATED</code>.
        </p>
      </div>
      <CodeBlock label="Response" code={responseExample} copyLabel="response example" mono />

      <div className="prose-custom">
        <h2 id="errors">Errors</h2>
        <ul>
          {errors.map((error) => (
            <li key={error.status}>
              <strong>{error.status}</strong>: {error.text}
            </li>
          ))}
        </ul>

        <h2 id="limits">Limits</h2>
        <p>
          Creating links is rate-limited per account, and a <code>429</code> tells you to wait. Each API key also has its
          own allowance of calls and an expiry date; your <Link href="/dashboard/api-keys">API keys</Link> page shows how
          many calls a key has used and when it expires. A key that is expired, revoked or out of calls is refused with an{" "}
          <code>error</code> message.
        </p>

        <h2 id="more">Two more endpoints that need no key</h2>
        <ul>
          <li>
            <code className="[overflow-wrap:anywhere]">GET https://hrva.cc/api/v1/urls/&#123;short&#125;/peek</code> returns a link&apos;s{" "}
            <code>longUrl</code> (empty for a password-protected link), <code>shortUrl</code> and{" "}
            <code>createDate</code> without counting a visit, the same lookup as <Link href="/validate">Check a link</Link>.
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
          Uptime and incidents are on the <a href="https://status.hrva.cc/status/url">status page</a>. The API is open
          source: the <a href={SOURCE_REPOSITORIES[0]}>backend code</a> is on GitHub under the GPL-3.0 licence.
        </p>
      </div>
    </StaticPage>
  )
}
