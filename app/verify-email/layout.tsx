import type { Metadata } from "next"
import { noIndex } from "@/lib/seo"

export const metadata: Metadata = noIndex("Verify email")

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children
}
