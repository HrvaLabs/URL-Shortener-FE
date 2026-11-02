import type { Metadata } from "next"
import { noIndex } from "@/lib/seo"

export const metadata: Metadata = noIndex("Verify email", "Verify your hrva.cc email address.")

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children
}
