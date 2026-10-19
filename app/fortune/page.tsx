import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PageMeta } from "@/components/page-meta"
import { RefreshCw } from "lucide-react"

const fortunes = [
  "Your next short link will be clicked 42 times.",
  "A custom alias is in your near future.",
  "The QR code whispers wisdom. Scan wisely.",
  "You will soon receive a visit from a long-lost URL.",
  "Beware of broken links — they lead nowhere good.",
  "A link shortened today saves nine tomorrow.",
  "The analytics dashboard sees all. It has judged you favorably.",
  "An expired link awaits reactivation.",
  "Your API key will go further than you think.",
  "The one who shortens the most links wins at life.",
  "A mysterious visitor from a faraway IP shall click your link.",
  "To shorten is divine. To track, even more so.",
  "The URL you seek is hidden in plain sight.",
  "Great power comes with great short URLs.",
  "404 not found — said no fortune ever.",
  "Clickbait is not your destiny. You are better than that.",
  "A wild QR code appears! It leads to a place of wonder.",
  "Your visit limit approaches. Use your clicks wisely.",
  "Sharing is caring. Shortening is loving.",
  "The link chooses the clicker, Mr. Anderson.",
]

export default function FortunePage() {
  const fortune = fortunes[Math.floor(Math.random() * fortunes.length)]

  return (
    <div className="flex min-h-screen flex-col">
      <PageMeta title="URL Fortune — hrva.cc" description="Your URL fortune awaits." />
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-5 py-20">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-2xl">🔮 URL Fortune</h1>

          <div className="mt-8 rounded-xl border bg-card px-8 py-10">
            <div className="text-5xl" aria-hidden="true">🥠</div>
            <p className="mt-6 font-display text-xl leading-snug sm:text-2xl">
              <span className="text-brand">&ldquo;</span>
              {fortune}
              <span className="text-brand">&rdquo;</span>
            </p>
          </div>

          <Button asChild variant="outline" className="mt-6 gap-1.5">
            <a href="/fortune">
              <RefreshCw className="h-4 w-4" />
              Another fortune
            </a>
          </Button>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
