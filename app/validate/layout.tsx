import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Check where a short link goes",
  description:
    "Look up a hrva.cc short link to see where it leads before you open it, when it was made, and whether it has a password.",
  path: "/validate",
})

export default function ValidateLayout({ children }: { children: React.ReactNode }) {
  return children
}
