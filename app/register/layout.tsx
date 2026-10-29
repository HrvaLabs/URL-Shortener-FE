import type { Metadata } from "next"
import { noIndex } from "@/lib/seo"

export const metadata: Metadata = noIndex("Create an account")

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
