import Link from "next/link"
import { authorUrls } from "@/content/blog/posts"

export function PostAuthor({ name }: { name: string }) {
  if (!authorUrls[name]) return <span>{name}</span>

  return (
    <Link
      href="/about"
      rel="author"
      className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
    >
      {name}
    </Link>
  )
}
