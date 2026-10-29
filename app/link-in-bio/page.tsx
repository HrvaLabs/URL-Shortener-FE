import Link from "next/link"
import type { Metadata } from "next"
import { JSON_LD_IDS, JsonLdScript, pageBreadcrumbs, reference } from "@/components/json-ld"
import { StaticPage } from "@/components/static-page"
import { Button } from "@/components/ui/button"
import { absoluteUrl, pageMetadata } from "@/lib/seo"

const path = "/link-in-bio"
const title = "Free link in bio page with no ads"
const description =
  "A free link in bio page at hrva.cc/@yourname: up to 30 buttons, each a checked short link, private view counts, no ads or trackers, and search indexing off unless you turn it on."

export const metadata: Metadata = pageMetadata({ title, description, path })

const linkInBioJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${absoluteUrl(path)}#webpage`,
      url: absoluteUrl(path),
      name: title,
      description,
      inLanguage: "en",
      about: reference(JSON_LD_IDS.app),
      isPartOf: reference(JSON_LD_IDS.website),
    },
    pageBreadcrumbs("Link in bio", path),
  ],
}

export default function LinkInBioPage() {
  return (
    <StaticPage
      title="A free link in bio page, with no ads or trackers"
      lead={
        <>
          <p>
            One page at hrva.cc/@yourname with your name, a short bio and a button for each link, made for the single link
            field in your Instagram, TikTok or any other profile. It comes with every free hrva.cc account.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/bio">Create your page</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/help/link-in-bio">How bio pages work</Link>
            </Button>
          </div>
        </>
      }
      after={<JsonLdScript data={linkInBioJsonLd} />}
    >
      <div className="prose-custom">
        <h2 id="what-you-get">What you get</h2>
        <ul>
          <li>Your own address, hrva.cc/@yourname, with a handle of 3 to 30 letters, numbers, hyphens and underscores</li>
          <li>A display name, a bio of up to 160 characters on up to five lines, and an avatar with your initials or an emoji</li>
          <li>Up to 30 buttons, with titles and icons guessed from where each link goes, which you can change, reorder or hide</li>
          <li>Eight accent colours, each readable on light and dark pages, and a light, dark or automatic theme</li>
          <li>A QR code of your page that you can colour and download</li>
        </ul>
        <p>Every account can have one page, and there are no paid plans.</p>

        <h2 id="checked-links">Every button is a checked short link</h2>
        <p>
          Each button is one of your own hrva.cc short links, so it goes through hrva.cc like any other: the link was
          checked for phishing and malware when it was made and is checked again every night, every click is checked
          against the blocklists that block outright, it counts towards the link&apos;s visit limit, and it shows up in
          the link&apos;s statistics. A button shows only while its link works: when a link is turned off, expires or reaches
          its visit limit, its button disappears from your page until the link works again.
        </p>

        <h2 id="views">Private view counts</h2>
        <p>
          Your page counts views, each visitor once a day, with link previews and crawlers counted apart. For each button
          you see how many clicks came from your bio page and how many came from everywhere else. To count visitors once a
          day, hrva.cc uses a one-way hash with a key that changes every day and never stores visitors&apos; IP addresses.
          The page sets no cookies and loads no third-party scripts, fonts or trackers.{" "}
          <Link href="/privacy-first-url-shortener">How visits are counted</Link>.
        </p>

        <h2 id="search-engines">Search engines</h2>
        <p>
          Indexing is off by default: search engines are asked not to list your page. Turn on{" "}
          <strong>Allow search engines to index this page</strong> in the editor when you want people to find it through
          search.
        </p>

        <h2 id="small-print">The small print</h2>
        <p>
          The bottom of every bio page says <strong>Made with hrva.cc</strong> and has a <strong>Report this page</strong>{" "}
          link, so visitors can tell a person about a page that pretends to be someone. Links in your bio text aren&apos;t
          clickable; add them as buttons.
        </p>
        <p>
          <Link href="/dashboard/bio">Create your page</Link>, or read the step-by-step guide,{" "}
          <Link href="/help/link-in-bio">Bio pages</Link>.
        </p>
      </div>
    </StaticPage>
  )
}
