import type { Metadata } from "next"
import { noIndex } from "@/lib/seo"

export const metadata: Metadata = noIndex("Easter egg")

export default function EggLayout({ children }: { children: React.ReactNode }) {
  return children
}
