export type FaqPart = string | { strong: string }

export interface HomeFaq {
  question: string
  answer: FaqPart[]
}

export const HOME_FAQS: HomeFaq[] = [
  {
    question: "How do I shorten a URL?",
    answer: [
      "Paste your long URL into the box at the top of the hrva.cc homepage and click ",
      { strong: "Shorten" },
      ". No account is needed, and you get a random short link. With a free account you can also choose a custom alias, a visit limit or an expiry date before shortening.",
    ],
  },
  {
    question: "Is hrva.cc free to use?",
    answer: [
      "Yes. Shortening is free and needs no account. A free account adds custom aliases, visit limits, expiry dates, passwords and analytics, also at no cost. There are no paid plans.",
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
      "With a free account, you can set a ",
      { strong: "visit limit" },
      " (the link stops working after N visits), an ",
      { strong: "expiration date" },
      " (the link expires at a specific time), or both when you shorten a URL.",
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
