import type { Metadata } from "next"
import { noIndex } from "@/lib/seo"

export const metadata: Metadata = noIndex("Easter egg", "You found it.")

export default function EggLayout({ children }: { children: React.ReactNode }) {
  return children
}
