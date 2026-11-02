import type { Metadata } from "next"
import { noIndex, TITLE_SUFFIX } from "@/lib/seo"

export const metadata: Metadata = noIndex(`Resend verification${TITLE_SUFFIX}`, "Resend your hrva.cc email verification link.")

export default function ResendVerificationLayout({ children }: { children: React.ReactNode }) {
  return children
}
