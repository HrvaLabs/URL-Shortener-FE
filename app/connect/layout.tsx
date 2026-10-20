import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Connect an app",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

export default function ConnectLayout({ children }: { children: React.ReactNode }) {
  return children
}
