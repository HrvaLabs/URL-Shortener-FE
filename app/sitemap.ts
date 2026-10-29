import type { MetadataRoute } from "next"
import { blogPosts } from "@/content/blog/posts"
import { CONTENT_UPDATED, type DatedPath } from "@/lib/content-dates"
import { absoluteUrl } from "@/lib/seo"

const dated = (path: DatedPath): MetadataRoute.Sitemap[number] => ({
  url: absoluteUrl(path),
  lastModified: CONTENT_UPDATED[path],
})

export default function sitemap(): MetadataRoute.Sitemap {
  const newestPost = blogPosts.map((post) => post.date).sort().at(-1)

  return [
    dated("/"),
    { url: absoluteUrl("/blog"), lastModified: newestPost },
    ...blogPosts.map((post) => ({ url: absoluteUrl(`/blog/${post.slug}`), lastModified: post.date })),
    { url: absoluteUrl("/changelog") },
    { url: absoluteUrl("/stats") },
    dated("/about"),
    dated("/mcp"),
    dated("/validate"),
    dated("/help"),
    dated("/help/utm"),
    dated("/help/passkeys"),
    dated("/help/stats"),
    dated("/help/link-in-bio"),
    dated("/help/notifications"),
    dated("/report"),
    dated("/privacy"),
    dated("/terms"),
  ]
}
