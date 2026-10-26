import Link from "next/link"
import { Logo } from "@/components/logo"

const columns = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/validate", label: "Check a link" },
      { href: "/changelog", label: "Changelog" },
      { href: "/stats", label: "hrva.cc in numbers" },
      { href: "https://status.hrva.cc/status/url", label: "Status", external: true },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: "/mcp", label: "MCP server" },
      { href: "https://hrva.cc/swagger-ui/index.html", label: "API docs", external: true },
      { href: "/dashboard/api-keys", label: "API keys" },
      { href: "https://github.com/karlohrvacic/url-shortener", label: "Source on GitHub", external: true },
    ],
  },
  {
    title: "More",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/help", label: "Help" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/report", label: "Report a link" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A free, open-source URL shortener. Built and run by one person in Croatia.
            </p>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="space-y-3">
              <h2 className="text-sm font-semibold">{column.title}</h2>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2022–{new Date().getFullYear()} hrva.cc · A{" "}
            <a href="https://hrvalabs.net/" className="underline-offset-4 hover:text-foreground hover:underline">
              HrvaLabs
            </a>{" "}
            project
          </p>
          <p>Free. No ads, no third-party trackers.</p>
        </div>
      </div>
    </footer>
  )
}
