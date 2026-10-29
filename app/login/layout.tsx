import type { Metadata } from "next"
import { noIndex } from "@/lib/seo"

export const metadata: Metadata = noIndex("Sign in")

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
