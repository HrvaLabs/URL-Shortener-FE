import type { Metadata } from "next"
import { BlogPostCard } from "@/components/blog/blog-post-card"
import { pageMetadata } from "@/lib/seo"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { blogPosts } from "@/content/blog/posts"

export const metadata: Metadata = pageMetadata({
  title: "Blog",
  description:
    "How hrva.cc stops phishing links, counts visits, caches redirects and migrates its database without downtime, plus practical guides to short links.",
  path: "/blog",
})

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">Short links, sharp insights</h1>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
              Articles about URL shortening, link management, analytics, security, and best practices — written by the person behind hrva.cc.
            </p>

            <ul className="mt-10 divide-y border-y">
              {blogPosts.map((post) => (
                <li key={post.slug}>
                  <BlogPostCard post={post} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
