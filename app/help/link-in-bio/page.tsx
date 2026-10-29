import Link from "next/link"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HelpBreadcrumbs } from "@/components/json-ld"
import { pageMetadata } from "@/lib/seo"

const description =
  "How to make a bio page at hrva.cc/@yourname, add your short links as buttons, share it, read its views, and what it keeps about visitors."

export const metadata: Metadata = pageMetadata({ title: "Bio pages", description, path: "/help/link-in-bio" })

export default function LinkInBioHelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <p className="text-sm text-muted-foreground">
              <Link href="/help" className="transition-colors hover:text-foreground">Help</Link>
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">Bio pages</h1>

            <div className="mt-8 rounded-xl border bg-muted/40 p-5">
              <p className="leading-7 text-foreground">
                In short: open Dashboard → Bio page, pick a handle, add your short links as buttons and
                save. Then put hrva.cc/@yourname in your Instagram, TikTok or any other bio.
              </p>
            </div>

            <div className="prose-custom">
              <h2 id="what-a-bio-page-is">What a bio page is</h2>
              <p>
                A bio page is one page at <code>hrva.cc/@yourname</code> with your name, a short bio, an
                avatar and a button for each link you want to share. It&apos;s made for the single link
                field in an Instagram, TikTok or other profile. Every account can have one.
              </p>
              <p>
                Every button is one of your own short links, so every click goes through hrva.cc like any
                other: it&apos;s checked, it counts towards a visit limit, and it shows up in the link&apos;s
                statistics.
              </p>

              <h2 id="create">Create your bio page</h2>
              <ol>
                <li>
                  Sign in and open <strong>Dashboard → Bio page</strong>.
                </li>
                <li>
                  Under <strong>Create your bio page</strong>, type a <strong>Handle</strong>: 3–30
                  characters, using letters, numbers, <code>-</code> and <code>_</code>. Capital letters
                  become lowercase. The line under the field says <strong>@yourname is available</strong>{" "}
                  when nobody has it.
                </li>
                <li>
                  Select <strong>Create page</strong>.
                </li>
              </ol>
              <p>
                A reserved word, such as <code>admin</code> or <code>help</code>, gets{" "}
                <strong>This handle is reserved. Try another.</strong> A handle someone else has gets{" "}
                <strong>This handle is taken. Try another.</strong> A handle whose page was deleted in the
                last 30 days says when it frees up, for example{" "}
                <strong>This handle was recently used and is kept until November 25, 2026. Try another.</strong>{" "}
                If you type dots or spaces, as in{" "}
                <code>ana.horvat</code>, the editor offers a handle you can use instead, such as{" "}
                <strong>Try @ana-horvat</strong>.
              </p>

              <h2 id="add-buttons">Add buttons</h2>
              <ol>
                <li>
                  Under <strong>Buttons</strong>, select <strong>Add from my links</strong>.
                </li>
                <li>
                  Find the link with <strong>Search your links</strong> and select <strong>Add</strong>.
                </li>
                <li>
                  Check the button&apos;s <strong>Title</strong> and <strong>Icon</strong>. They&apos;re
                  guessed from where the link goes: a link to Instagram gets the title Instagram and its
                  icon, and a link to any other site gets the site&apos;s address and the globe. Change
                  them as you like, or choose <strong>No icon</strong>.
                </li>
              </ol>
              <p>
                Only your own short links that work can be added, so the list shows your active links.
                To add a new destination, shorten it on the <Link href="/dashboard">URLs page</Link> first.
                A page holds up to 30 buttons; at 30 the editor says{" "}
                <strong>You&apos;ve added 30 buttons, the most a page can have.</strong>{" "}
                <strong>Remove</strong> takes a button off your page; the short link itself stays.
              </p>

              <h2 id="arrange">Reorder and hide buttons</h2>
              <ul>
                <li>
                  Drag a button by the grip on its left. Or focus the grip with the keyboard, where it
                  says <strong>Drag, or use the arrow keys</strong>, and press ↑ or ↓; Home and End move
                  it to the top or the bottom.
                </li>
                <li>
                  Turn off <strong>Show on page</strong> to hide a button without removing it. It stays in
                  the editor but doesn&apos;t show on your page.
                </li>
              </ul>
              <p>
                Nothing changes on your page until you select <strong>Save changes</strong> in the{" "}
                <strong>You have unsaved changes</strong> bar. <strong>Discard</strong> undoes everything
                since the last save.
              </p>

              <h2 id="look">Name, bio, avatar and colours</h2>
              <p>
                <strong>Display name</strong> and <strong>Bio</strong> are under <strong>Profile</strong>, at
                the top of the editor. <strong>Avatar</strong>, <strong>Accent colour</strong> and{" "}
                <strong>Theme</strong> are under <strong>Look</strong>, after your buttons.
              </p>
              <ul>
                <li>
                  <strong>Display name</strong>: up to 50 characters.
                </li>
                <li>
                  <strong>Bio</strong>: up to 160 characters of plain text on up to five lines. Empty lines
                  are dropped, and line breaks after the fifth line become spaces. Links in your bio
                  aren&apos;t clickable; add them as buttons.
                </li>
                <li>
                  <strong>Avatar</strong>: <strong>Initials</strong>, taken from your display name (or your
                  handle when there&apos;s no name), or <strong>Emoji</strong>: paste or type one emoji, or
                  pick a suggestion.
                </li>
                <li>
                  <strong>Accent colour</strong>: the colour of your buttons and avatar. Each of the eight
                  colours has a shade for light pages and one for dark pages, and both are easy to read.
                </li>
                <li>
                  <strong>Theme</strong>: <strong>Auto</strong> follows each visitor&apos;s device;{" "}
                  <strong>Light</strong> and <strong>Dark</strong> always look the same.
                </li>
              </ul>
              <p>
                The preview shows what visitors will see, as you type: beside the editor on a wide
                screen, or under the <strong>Preview</strong> tab on a narrower one.
              </p>

              <h2 id="share">Share your page</h2>
              <p>
                The bar at the top of the editor shows your page&apos;s address.{" "}
                <strong>Copy link</strong> copies it, <strong>QR code</strong> opens a QR code you can
                colour and download, <strong>View page</strong> opens your page in a new tab, and{" "}
                <strong>Views</strong> opens its analytics. Paste <code>hrva.cc/@yourname</code> into the
                link field of your profile.
              </p>

              <h2 id="views">Views and clicks</h2>
              <p>
                Select <strong>Views</strong> in the editor, or open <strong>Analytics</strong> and choose{" "}
                <strong>Bio page</strong>. For the range you pick:
              </p>
              <ul>
                <li>
                  <strong>Views</strong>: each visitor counts once a day, however often they open your
                  page. <strong>Bot views</strong>, from link previews and crawlers, are counted apart and
                  not counted as views. Your own visits count too.
                </li>
                <li>
                  Under <strong>Buttons</strong>, <strong>From your bio page</strong> counts the clicks on
                  a button&apos;s link that came from a hrva.cc page, such as your bio page, and{" "}
                  <strong>All clicks</strong> counts every click on that link, wherever you shared it. A
                  button that isn&apos;t on your page says why: <strong>Hidden</strong>, or the link&apos;s
                  state, such as <strong>Link turned off</strong>.
                </li>
              </ul>

              <h2 id="missing-buttons">Why a button isn&apos;t showing</h2>
              <p>
                A button shows only when <strong>Show on page</strong> is on and its short link works.
                When the link doesn&apos;t work, the editor marks the button with one of these and says
                how to fix it:
              </p>
              <ul>
                <li>
                  <strong>Link turned off</strong>: the link was deactivated. Turn it back on on the URLs
                  page.
                </li>
                <li>
                  <strong>Link expired</strong>: the link passed its expiry date. Give it a later one on the
                  URLs page.
                </li>
                <li>
                  <strong>Visit limit reached</strong>: the link has had all the visits it allows. Raise its
                  visit limit on the URLs page.
                </li>
                <li>
                  <strong>Waiting for review</strong>: the automatic checks flagged the link, and it stays
                  off your page until an admin has checked it.
                </li>
                <li>
                  <strong>Link blocked</strong>: the link was blocked. Blocked links can&apos;t be shown, so
                  remove the button.
                </li>
              </ul>
              <p>
                A turned-off, expired or full link shows again as soon as it works again, for example
                when you turn it back on or give it a new expiry date. Deleting a short link also removes
                its button.
              </p>

              <h2 id="handle">Change your handle</h2>
              <ol>
                <li>
                  Under <strong>Handle</strong>, select <strong>Change handle</strong>.
                </li>
                <li>
                  Type the <strong>New handle</strong> and select <strong>Change handle</strong>.
                </li>
              </ol>
              <p>
                Your old link stops working right away; it says the page isn&apos;t available and
                doesn&apos;t forward to the new one. Nobody else can take the old handle for 30 days, and
                you can take it back yourself in that time. Handles can be changed five times in 24
                hours, and creating the page counts as one.
              </p>
              <p>
                If an admin removes your handle, the editor shows why and your page has no address until
                you pick a new handle and select <strong>Choose handle</strong>.
              </p>

              <h2 id="search-engines">Search engines</h2>
              <p>
                <strong>Allow search engines to index this page</strong> is off by default. While
                it&apos;s off, search engines are asked not to list your page. Turn it on and save if you
                want people to find it through search.
              </p>

              <h2 id="report">Report a bio page</h2>
              <p>
                Select <strong>Report this page</strong> at the bottom of any bio page, or enter{" "}
                <code>hrva.cc/@name</code> on the <Link href="/report">report form</Link>. Choose{" "}
                <strong>Pretends to be someone</strong> for a page that impersonates a person or a brand, and
                say which button is the problem in the details. Reports go to a person; a report never hides a page by itself.
              </p>
              <p>
                An admin may hide a page that breaks the <Link href="/terms">terms</Link>. Visitors then see
                that the page isn&apos;t available, and its owner sees the reason in the editor and can
                still edit the page. If you think it&apos;s a mistake, email{" "}
                <a href="mailto:abuse@hrva.cc">abuse@hrva.cc</a>.
              </p>

              <h2 id="privacy">Bio pages and your privacy</h2>
              <ul>
                <li>
                  Everything on your page is public. Your email address is never shown on the page.
                </li>
                <li>
                  Views are daily counts, made with the same one-way hash as link statistics: a visitor
                  is counted once a day without storing their IP address.
                </li>
                <li>
                  Your page sets no cookies and loads no third-party scripts, fonts or trackers.
                </li>
                <li>
                  <strong>Delete bio page</strong>, at the bottom of the editor, deletes the page and its
                  view counts right away, but not while an admin has hidden it; your short links stay.
                  The handle is kept for 30 days so nobody can pretend to be you, and that includes you:
                  you won&apos;t be able to use it again until then. Deleting your account does the same.
                </li>
                <li>
                  The data export in Settings includes your bio page and its buttons.
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
      <HelpBreadcrumbs name="Bio pages" path="/help/link-in-bio" />
    </div>
  )
}
