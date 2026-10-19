import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Connect an app",
  robots: { index: false, follow: false },
}

export default function ConnectLayout({ children }: { children: React.ReactNode }) {
  return children
}
