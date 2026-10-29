import type { MetadataRoute } from "next"

const PRIVATE_PATHS = ["/dashboard/", "/admin/", "/api/", "/egg", "/connect"]

const AI_SEARCH_AGENTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
]

const AI_TRAINING_AGENTS = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "meta-externalagent",
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_SEARCH_AGENTS, allow: "/", disallow: PRIVATE_PATHS },
      ...AI_TRAINING_AGENTS.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
    sitemap: "https://app.hrva.cc/sitemap.xml",
  }
}
