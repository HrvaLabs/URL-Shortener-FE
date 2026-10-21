import type { Metadata, Viewport } from "next"
import { Host_Grotesk, JetBrains_Mono } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"
import { Providers } from "./providers"
import { JsonLd } from "@/components/json-ld"

const sans = Host_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-host-grotesk",
})

const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
})

const baseUrl = "https://app.hrva.cc"

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "hrva.cc — short links, shaped by you",
    template: "%s — hrva.cc",
  },
  description:
    "Shorten URLs, track visits, and manage your links with control and clarity. Free URL shortener with analytics, expiration control, and safe browsing checks.",
  keywords: [
    "URL shortener",
    "link shortener",
    "short links",
    "link management",
    "URL analytics",
    "hrva.cc",
    "free URL shortener",
  ],
  authors: [{ name: "hrva.cc" }],
  creator: "hrva.cc",
  publisher: "hrva.cc",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "hrva.cc",
    url: baseUrl,
    title: "hrva.cc — short links, shaped by you",
    description:
      "Shorten URLs, track visits, and manage your links with control and clarity. Free URL shortener with analytics, expiration control, and safe browsing checks.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "hrva.cc — short links, shaped by you",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "hrva.cc — short links, shaped by you",
    description:
      "Shorten URLs, track visits, and manage your links with control and clarity.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "hrva.cc",
    statusBarStyle: "default",
  },
  category: "technology",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  colorScheme: "light dark",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Toaster
          closeButton
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              boxShadow: "0 4px 12px -2px rgb(0 0 0 / 0.08)",
            },
          }}
        />
        <JsonLd />
      </body>
    </html>
  )
}
