import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Changelog",
  description: "Latest improvements, updates and fixes to the hrva.cc URL shortener.",
  path: "/changelog",
})

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return children
}
