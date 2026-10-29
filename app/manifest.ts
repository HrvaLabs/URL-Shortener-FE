import type { MetadataRoute } from "next"
import { HOME_DESCRIPTION, HOME_TITLE_TEXT, SITE_NAME } from "@/lib/seo"

const APP_ICON = { src: "/icon-192.png", sizes: "192x192", type: "image/png" }

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${SITE_NAME}: ${HOME_TITLE_TEXT}`,
    short_name: SITE_NAME,
    description: HOME_DESCRIPTION,
    start_url: "/launch",
    scope: "/",
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
    shortcuts: [
      { name: "New link", url: "/#shorten", icons: [APP_ICON] },
      { name: "My links", url: "/dashboard", icons: [APP_ICON] },
    ],
    share_target: {
      action: "/share",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
  }
}
