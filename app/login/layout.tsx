import type { Metadata } from "next"
import { noIndex } from "@/lib/seo"

export const metadata: Metadata = noIndex("Sign in", "Sign in to your hrva.cc account to manage your shortened URLs.")

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
