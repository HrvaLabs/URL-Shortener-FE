import Link from "next/link"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HelpBreadcrumbs } from "@/components/json-ld"
import { pageMetadata } from "@/lib/seo"

const description =
  "What UTM tags are, how to add them to a hrva.cc link with the builder, and how to remove them."

export const metadata: Metadata = pageMetadata({ title: "Campaign tracking (UTM)", description, path: "/help/utm" })

const exampleUrl = "https://shop.example/sale?utm_source=instagram&utm_medium=social&utm_campaign=autumn-sale"

export default function UtmHelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <p className="text-sm text-muted-foreground">
              <Link href="/help" className="transition-colors hover:text-foreground">Help</Link>
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">Campaign tracking (UTM)</h1>

            <div className="mt-8 rounded-xl border bg-muted/40 p-5">
              <p className="leading-7 text-foreground">
                In short: UTM tags are labels at the end of a link. The analytics tool on the site the
                link opens reads them to tell you where a visitor came from. hrva.cc only keeps them as
                part of the address.
              </p>
            </div>

            <div className="prose-custom">
              <h2>What UTM tags are</h2>
              <p>
                A UTM tag, also called a UTM parameter, is a name and a value added to a link&apos;s address, such as{" "}
                <code>utm_source=instagram</code>. Tools such as Google Analytics, Plausible or Matomo
                read them when someone arrives, so a visit is counted under the right source and
                campaign. For example:
              </p>
              <p>
                <code className="block break-all px-3 py-2 leading-6">{exampleUrl}</code>
              </p>
              <p>
                Someone who opens this link lands on the shop&apos;s sale page, and the shop&apos;s
                analytics records the visit as coming from Instagram, a social post, in the autumn-sale
                campaign.
              </p>

              <h2>Add them with the builder</h2>
              <p>
                When you create a link while signed in, on the home page or with New URL on your
                dashboard, open <strong>Campaign tracking (UTM)</strong>. Fill in what you need:
              </p>
              <ul>
                <li>
                  <strong>Source</strong>: where you share the link, for example <code>instagram</code> or{" "}
                  <code>newsletter</code>. The quick picks above the Source box fill in Source (
                  <strong>X (Twitter)</strong> fills in <code>x</code>), and Medium too when it&apos;s empty
                  or still holds what the last quick pick put there. Press a picked one again to clear it.
                </li>
                <li>
                  <strong>Medium</strong>: the kind of channel, for example <code>social</code> or{" "}
                  <code>email</code>.
                </li>
                <li>
                  <strong>Campaign</strong>: the name of the campaign, for example <code>autumn-sale</code>.
                </li>
                <li>
                  <strong>Term (optional)</strong> and <strong>Content (optional)</strong>: extra detail,
                  such as a keyword, or which button in an email was clicked.
                </li>
              </ul>
              <p>
                A line under the fields says <strong>Use lowercase and dashes, for example autumn-sale.</strong>{" "}
                Most analytics tools count <code>Instagram</code> and <code>instagram</code> as two sources.
                A space in a value is saved as <code>%20</code>.
              </p>
              <p>
                <strong>Your link will open:</strong> shows the full destination with the tags. If you paste
                a long URL that already has tags, the fields switch to its tags so you can change them. If
                you set Medium or Campaign without a Source, it says{" "}
                <strong>Add a Source too. Most analytics tools ignore campaign tags without one.</strong>{" "}
                A link can be up to 2048 characters with its tags; if the tags make it longer, the link
                isn&apos;t saved until you shorten a value or the long URL.
              </p>
              <p>
                Values you used recently are offered as suggestions; they&apos;re kept in your browser
                only. After you shorten a link on the home page, the fields are cleared and the section
                closes. The <strong>What are UTM tags?</strong> link in the section opens this page.
              </p>

              <h2>Who reads them</h2>
              <p>
                The analytics tool on the destination site reads the tags. hrva.cc doesn&apos;t track or
                count them: it saves the destination you see in the preview, tags included, and sends
                visitors there.
                It doesn&apos;t store the tags separately or send them anywhere else. The link&apos;s
                analytics page lists them under <strong>Campaign tags</strong>, so you can see which
                tags a link carries.
              </p>

              <h2>Remove them</h2>
              <ul>
                <li>
                  Open <strong>Campaign tracking (UTM)</strong> and clear the fields: one to remove that
                  tag, or all of them to remove every tag, including tags that were already in the long URL.
                </li>
                <li>
                  Or collapse the section to save the link exactly as you typed it. The values in the
                  fields are then left out, and the collapsed row says so, for example{" "}
                  <strong>off, 3 values not added</strong>. <strong>Turn on</strong> opens it again.
                </li>
              </ul>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
      <HelpBreadcrumbs name="Campaign tracking (UTM)" path="/help/utm" />
    </div>
  )
}
