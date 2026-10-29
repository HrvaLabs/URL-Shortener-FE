import type { Metadata } from "next"
import { noIndex } from "@/lib/seo"

export const metadata: Metadata = noIndex("Signing in")

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
