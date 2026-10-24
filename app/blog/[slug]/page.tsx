import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { blogPosts } from "@/content/blog/posts"
import { PostAuthor } from "@/components/blog/post-author"
import { ArrowLeft, ArrowRight } from "lucide-react"

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)
  if (!post) return {}
  return {
    title: `${post.title} — hrva.cc Blog`,
    description: post.excerpt,
    alternates: { canonical: `https://app.hrva.cc/blog/${post.slug}` },
    openGraph: {
      url: `https://app.hrva.cc/blog/${post.slug}`,
      title: post.title,
      description: post.excerpt,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)

  if (!post) {
    notFound()
  }

  const currentIndex = blogPosts.findIndex((p) => p.slug === slug)
  const prevPost = currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null
  const nextPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-12 sm:py-16">
          <article className="mx-auto max-w-3xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All posts
            </Link>

            <header className="mt-8 border-b pb-8">
              <h1 className="font-display text-3xl leading-tight sm:text-4xl">{post.title}</h1>

              <p className="mt-4 text-sm text-muted-foreground">
                <time dateTime={post.date} className="tabular-nums">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span aria-hidden="true"> · </span>
                <PostAuthor name={post.author} />
              </p>

              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="font-normal text-muted-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>
            </header>

            <div className="prose-custom mt-10">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>

            <nav aria-label="More posts" className="mt-16 grid gap-6 border-t pt-8 sm:grid-cols-2">
              {prevPost ? (
                <Link
                  href={`/blog/${prevPost.slug}`}
                  className="group flex items-start gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="flex flex-col gap-1">
                    <span className="text-xs font-medium">Previous</span>
                    <span className="text-sm font-medium text-foreground transition-colors group-hover:text-brand">
                      {prevPost.title}
                    </span>
                  </span>
                </Link>
              ) : <div className="hidden sm:block" />}
              {nextPost ? (
                <Link
                  href={`/blog/${nextPost.slug}`}
                  className="group flex items-start justify-end gap-2 text-right text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="flex flex-col gap-1">
                    <span className="text-xs font-medium">Next</span>
                    <span className="text-sm font-medium text-foreground transition-colors group-hover:text-brand">
                      {nextPost.title}
                    </span>
                  </span>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" />
                </Link>
              ) : <div className="hidden sm:block" />}
            </nav>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
