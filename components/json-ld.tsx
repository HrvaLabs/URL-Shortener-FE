/**
 * JSON-LD structured data injected into the root layout.
 * Renders a <script> tag with ld+json for rich search results,
 * AI-powered engines, and voice/answer engines.
 */
const APP_URL = "https://app.hrva.cc"
const BRAND_URL = "https://hrva.cc"

export function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "hrva.cc",
        url: APP_URL,
        description:
          "Shorten URLs, track visits, and manage your links with control and clarity. Free URL shortener with analytics, expiration control, and safe browsing checks.",
        applicationCategory: "UtilityApplication",
        operatingSystem: "All",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: {
          "@type": "Person",
          name: "Karlo Hrvačić",
          url: "https://karlo.cc",
        },
      },
      {
        "@type": "Organization",
        name: "hrva.cc",
        url: BRAND_URL,
        logo: `${APP_URL}/favicon.svg`,
        sameAs: [
          "https://github.com/karlohrvacic/url-shortener",
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How do I shorten a URL?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Paste your long URL into the input field on the hrva.cc homepage and click 'Shorten'. You can optionally set a custom alias, visit limit, or expiration date before shortening.",
            },
          },
          {
            "@type": "Question",
            name: "Is hrva.cc free to use?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, hrva.cc is completely free to use. You can shorten URLs, set visit limits and expiration dates, and track analytics without any cost.",
            },
          },
          {
            "@type": "Question",
            name: "Can I track how many people clicked my link?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, creating an account lets you see click analytics for every link you shorten, including total visits, visit history, and per-link performance.",
            },
          },
          {
            "@type": "Question",
            name: "How do expiration dates and visit limits work?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "When shortening a URL, you can set a visit limit (the link stops working after N visits) or an expiration date (the link expires at a specific time). Both features give you full control over your links.",
            },
          },
          {
            "@type": "Question",
            name: "What is a URL shortener used for?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A URL shortener converts long web addresses into short, shareable links. They are commonly used on social media, in emails, and in marketing campaigns to make links cleaner, trackable, and easier to manage.",
            },
          },
        ],
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
