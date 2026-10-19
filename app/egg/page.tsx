"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PageMeta } from "@/components/page-meta"
import { Volume2, QrCode } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

const quacks = [
  "🦆 Quack!",
  "🦆 Quack quack!",
  "🦆 QUACK!",
  "🦆 ...quack?",
  "🦆 Quack quack quack!",
  "🦆  quaaack  ",
  "🦆   ",
  "🦆 Q-U-A-C-K.",
  "🦆 ^·፡·^",
]

export default function EggPage() {
  const [quackIndex, setQuackIndex] = useState(0)
  const [showQr, setShowQr] = useState(false)
  const [count, setCount] = useState(0)

  const handleQuack = () => {
    setQuackIndex((prev) => (prev + 1) % quacks.length)
    setCount((prev) => prev + 1)

    if (count >= 9) {
      setShowQr(true)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PageMeta title="🥚 — hrva.cc" description="You found it." />
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-5 py-20">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-2xl">🥚 You found it!</h1>

          <div className="mt-8 select-none text-[96px] leading-none motion-safe:animate-bounce" aria-hidden="true">
            🦆
          </div>

          <div className="mt-8 rounded-xl border bg-card p-6">
            <p className="min-h-[3rem] font-display text-2xl" aria-live="polite">
              {quacks[quackIndex]}
            </p>
            <Button onClick={handleQuack} size="lg" variant="brand" className="mt-4 gap-2">
              <Volume2 className="h-4 w-4" />
              Quack
            </Button>

            {showQr && (
              <div className="animate-result-in mt-6 space-y-3 border-t pt-6">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <QrCode className="h-4 w-4" />
                  You earned a surprise!
                </div>
                <div className="flex justify-center">
                  <div className="rounded-lg border bg-white p-2">
                    <QRCodeSVG value="https://www.youtube.com/watch?v=dQw4w9WgXcQ" size={140} fgColor="#0e0e11" bgColor="#ffffff" level="M" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="mt-4 text-sm tabular-nums text-muted-foreground">
            Quack {count + 1} time{count !== 0 ? "s" : ""}
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
