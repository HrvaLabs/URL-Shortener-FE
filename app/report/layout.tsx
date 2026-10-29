import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Report a link or bio page",
  description: "Report a hrva.cc short link or bio page that leads to phishing, malware, spam or other abuse.",
  path: "/report",
})

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return children
}
