import type { MetadataRoute } from "next"
import { HOME_DESCRIPTION, HOME_HEADLINE, SITE_NAME } from "@/lib/seo"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: ${HOME_HEADLINE}`,
    short_name: SITE_NAME,
    description: HOME_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
