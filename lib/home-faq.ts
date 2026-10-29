export type FaqPart = string | { strong: string }

export interface HomeFaq {
  question: string
  answer: FaqPart[]
}

export const HOME_FAQS: HomeFaq[] = [
  {
    question: "How do I shorten a URL?",
    answer: [
      "Paste your long URL into the input field on the hrva.cc homepage and click ",
      { strong: "Shorten" },
      ". You can optionally set a custom alias, visit limit, or expiration date before shortening. No account required for basic use.",
    ],
  },
  {
    question: "Is hrva.cc free to use?",
    answer: [
      "Yes, hrva.cc is completely free to use. You can shorten URLs, set visit limits and expiration dates, and track analytics without any cost. Creating an account unlocks additional features like link management and detailed analytics.",
    ],
  },
  {
    question: "Can I track how many people clicked my link?",
    answer: [
      "Yes. Creating a free account gives you access to click analytics for every link you shorten, including total visit counts and per-link performance data. You can view all your links and their analytics from your dashboard.",
    ],
  },
  {
    question: "How do expiration dates and visit limits work?",
    answer: [
      "When shortening a URL, you can optionally set a ",
      { strong: "visit limit" },
      " (the link stops working after N visits) or an ",
      { strong: "expiration date" },
      " (the link expires at a specific time). Both features give you full control over your links.",
    ],
  },
  {
    question: "What is a URL shortener used for?",
    answer: [
      "A URL shortener converts long web addresses into short, shareable links. They are commonly used on social media, in emails, and in marketing campaigns to make links cleaner, trackable, and easier to manage.",
    ],
  },
]

export const faqAnswerText = (faq: HomeFaq): string =>
  faq.answer.map((part) => (typeof part === "string" ? part : part.strong)).join("")
