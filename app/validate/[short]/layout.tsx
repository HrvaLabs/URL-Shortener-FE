import type { Metadata } from "next"
import { TITLE_SUFFIX } from "@/lib/seo"

const shortOf = (segment: string): string => {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

export async function generateMetadata({ params }: { params: Promise<{ short: string }> }): Promise<Metadata> {
  const short = shortOf((await params).short)
  return {
    title: `Where hrva.cc/${short} goes${TITLE_SUFFIX}`,
    description: `Look up where the short link hrva.cc/${short} goes before you open it.`,
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  }
}

export default function ValidateShortLayout({ children }: { children: React.ReactNode }) {
  return children
}
