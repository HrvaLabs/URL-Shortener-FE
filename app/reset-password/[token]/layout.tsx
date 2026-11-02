import type { Metadata } from "next"
import { noIndex, TITLE_SUFFIX } from "@/lib/seo"

export const metadata: Metadata = noIndex(`Set new password${TITLE_SUFFIX}`, "Set a new password for your hrva.cc account.")

export default function SetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
