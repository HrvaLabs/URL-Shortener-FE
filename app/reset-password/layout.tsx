import type { Metadata } from "next"
import { noIndex } from "@/lib/seo"

export const metadata: Metadata = noIndex("Reset password")

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
