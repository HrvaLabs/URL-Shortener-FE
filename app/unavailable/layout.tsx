import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Link unavailable",
  robots: { index: false, follow: false },
}

export default function UnavailableLayout({ children }: { children: React.ReactNode }) {
  return children
}
