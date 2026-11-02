import type { Metadata } from "next"
import { noIndex } from "@/lib/seo"

export const metadata: Metadata = noIndex("Create an account", "Sign up for a free hrva.cc account to manage your shortened URLs with analytics and control.")

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
