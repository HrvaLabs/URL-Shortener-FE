import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { BlogPost } from "@/content/blog/posts"
import { PostAuthor } from "@/components/blog/post-author"

export function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <article className="py-8">
      <p className="text-sm text-muted-foreground">
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

      <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
        <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-brand">
          {post.title}
        </Link>
      </h2>

      <p className="mt-3 leading-7 text-muted-foreground">{post.excerpt}</p>

      <Link
        href={`/blog/${post.slug}`}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
      >
        Read more
        <span className="sr-only">: {post.title}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </article>
  )
}
