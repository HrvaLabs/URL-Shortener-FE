import type { Metadata } from "next"
import { noIndex } from "@/lib/seo"

export const metadata: Metadata = noIndex("URL Fortune")

export default function FortuneLayout({ children }: { children: React.ReactNode }) {
  return children
}
