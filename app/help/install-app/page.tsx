import Link from "next/link"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HelpBreadcrumbs } from "@/components/json-ld"
import { pageMetadata } from "@/lib/seo"

const title = "Install hrva.cc as an app"

const description =
  "How to install hrva.cc on Android, iPhone or a computer, share links to it from other Android apps, and what the app does without a connection."

export const metadata: Metadata = pageMetadata({ title, description, path: "/help/install-app" })

export default function InstallAppHelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <p className="text-sm text-muted-foreground">
              <Link href="/help" className="transition-colors hover:text-foreground">Help</Link>
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{title}</h1>

            <div className="mt-8 rounded-xl border bg-muted/40 p-5">
              <p className="leading-7 text-foreground">
                In short: install hrva.cc from your browser and it opens in its own window, with its own
                icon. On Android you can then share a link to hrva.cc from any app and shorten it. Nothing
                is shortened until you tap <strong>Shorten</strong>.
              </p>
            </div>

            <div className="prose-custom">
              <h2 id="android">Install on Android</h2>
              <ol>
                <li>Open app.hrva.cc in Chrome.</li>
                <li>
                  Tap the three-dot menu, then <strong>Add to Home screen</strong>, then{" "}
                  <strong>Install</strong>. Some versions of Chrome show <strong>Install app</strong> in the
                  menu instead.
                </li>
                <li>hrva.cc now sits with your other apps.</li>
              </ol>

              <h2 id="iphone">Install on iPhone or iPad</h2>
              <ol>
                <li>Open app.hrva.cc in Safari.</li>
                <li>Tap <strong>Share</strong>. If you don&apos;t see it, tap the three-dot button first.</li>
                <li>
                  Tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>. If it isn&apos;t near
                  the top of the list, scroll down.
                </li>
              </ol>
              <p>On iOS 16.4 or later, other browsers such as Chrome can add it from their Share menu too.</p>

              <h2 id="computer">Install on a computer</h2>
              <ul>
                <li>
                  In Chrome or Edge, select the install icon at the right end of the address bar, then{" "}
                  <strong>Install</strong>. If there&apos;s no icon, look for Install in the browser&apos;s menu.
                </li>
                <li>
                  In Safari on a Mac (macOS Sonoma or later), choose <strong>File</strong>, then{" "}
                  <strong>Add to Dock</strong>.
                </li>
              </ul>
              <p>hrva.cc then opens in its own window.</p>

              <h2 id="share">Share a link to hrva.cc on Android</h2>
              <p>Once hrva.cc is installed on Android:</p>
              <ol>
                <li>In any app, tap Share on a page, post or link.</li>
                <li>Choose hrva.cc. The first time, you may have to scroll or tap More to find it.</li>
                <li>
                  hrva.cc opens <strong>Shorten a shared link</strong> with the link under{" "}
                  <strong>Shared link</strong> and in the form. It takes the first address starting with{" "}
                  <code>http://</code> or <code>https://</code>, even when the app sends other text with it.
                </li>
                <li>Check the link, then tap <strong>Shorten</strong>.</li>
              </ol>
              <p>
                Nothing is shortened until you tap <strong>Shorten</strong>. When you&apos;re signed in, the
                form also has <strong>Custom alias</strong>, <strong>Visit limit</strong>,{" "}
                <strong>Expires</strong> and <strong>Campaign tracking (UTM)</strong>, and the new link shows
                up in your links.
              </p>
              <p>
                If what was shared has no such address, the form is empty and says{" "}
                <strong>No link found in what was shared.</strong> You can still paste or type a link.
              </p>

              <h2 id="iphone-sharing">iPhones can&apos;t share to web apps</h2>
              <p>
                iOS doesn&apos;t let apps added to the Home Screen appear in the share sheet, so hrva.cc
                can&apos;t be picked there on an iPhone or iPad. Copy the link instead, open hrva.cc, paste
                it into the form and tap <strong>Shorten</strong>.
              </p>

              <h2 id="shortcuts">Shortcuts</h2>
              <p>On Android, touch and hold the hrva.cc icon, or right-click the app icon on a computer, for two shortcuts:</p>
              <ul>
                <li>
                  <strong>New link</strong> opens the shorten form.
                </li>
                <li>
                  <strong>My links</strong> opens <strong>My URLs</strong>, the list of your links. If
                  you&apos;re signed out, you sign in first.
                </li>
              </ul>

              <h2 id="opening">What opens when you start it</h2>
              <p>
                If you&apos;re signed in, the app opens on <strong>My URLs</strong>. If you&apos;re signed
                out, it opens on the home page.
              </p>

              <h2 id="offline">Without a connection</h2>
              <p>
                The app shows <strong>You&apos;re offline. hrva.cc needs a connection to make and open
                links.</strong> with a <strong>Try again</strong> button. It keeps nothing else for offline
                use, so every page comes fresh from hrva.cc.
              </p>

              <h2 id="remove">Remove the app</h2>
              <p>
                Remove it like any other app: touch and hold its icon and choose to remove or uninstall it.
                In Chrome or Edge on a computer, open the app&apos;s menu and choose Uninstall. Your account
                and links stay on hrva.cc.
              </p>

              <h2 id="privacy">The app and your privacy</h2>
              <p>
                Installing changes nothing in your account. Any browser that supports it keeps one page from
                hrva.cc, the offline page, once you visit app.hrva.cc, whether or not you install the app, so
                it can show that page without a connection. What an app shares arrives in the
                address of the page that opens, so it can show up in your browser history. hrva.cc picks
                the link out in your browser and saves nothing until you tap <strong>Shorten</strong>. The{" "}
                <Link href="/privacy">Privacy Policy</Link> describes everything hrva.cc stores.
              </p>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
      <HelpBreadcrumbs name={title} path="/help/install-app" />
    </div>
  )
}
