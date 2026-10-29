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
      "Yes. Shortening needs no account, and a free account adds custom aliases, visit limits, expiry dates, passwords and analytics. There are no paid plans.",
    ],
  },
  {
    question: "Can I track how many people clicked my link?",
    answer: [
      "Yes, with a free account. Your dashboard shows each link's clicks and daily unique visitors, with referrers, countries and devices.",
    ],
  },
  {
    question: "How do expiration dates and visit limits work?",
    answer: [
      "With a free account, you can set a ",
      { strong: "visit limit" },
      " (the link stops working after N visits), an ",
      { strong: "expiration date" },
      " (the link stops working at a set time), or both when you shorten a URL.",
    ],
  },
  {
    question: "What is a URL shortener used for?",
    answer: [
      "It turns a long web address into a short link that is easier to share on social media, in emails and in marketing campaigns, and it can count how often the link is opened.",
    ],
  },
]

export const faqAnswerText = (faq: HomeFaq): string =>
  faq.answer.map((part) => (typeof part === "string" ? part : part.strong)).join("")
