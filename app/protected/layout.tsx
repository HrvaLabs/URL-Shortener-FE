import type { Metadata } from "next"
import { noIndex } from "@/lib/seo"

export const metadata: Metadata = noIndex("Protected link", "This link is password protected.")

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return children
}
