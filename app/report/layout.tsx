import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Report a link",
  description: "Report a hrva.cc short link that leads to phishing, malware, spam or other abuse.",
  alternates: { canonical: "https://app.hrva.cc/report" },
  openGraph: {
    url: "https://app.hrva.cc/report",
    title: "Report a link — hrva.cc",
    description: "Report a hrva.cc short link that leads to phishing, malware, spam or other abuse.",
  },
}

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return children
}
