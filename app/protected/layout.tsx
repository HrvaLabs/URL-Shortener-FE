import type { Metadata } from "next"
import { noIndex } from "@/lib/seo"

export const metadata: Metadata = noIndex("Protected link")

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return children
}
