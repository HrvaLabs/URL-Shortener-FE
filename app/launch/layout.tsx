import type { Metadata } from "next"
import { noIndex } from "@/lib/seo"

export const metadata: Metadata = noIndex("Opening hrva.cc")

export default function LaunchLayout({ children }: { children: React.ReactNode }) {
  return children
}
