import { authorUrls } from "@/content/blog/posts"

export function PostAuthor({ name }: { name: string }) {
  const url = authorUrls[name]
  if (!url) return <span>{name}</span>

  return (
    <a
      href={url}
      target="_blank"
      rel="author noopener noreferrer"
      className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
    >
      {name}
    </a>
  )
}
