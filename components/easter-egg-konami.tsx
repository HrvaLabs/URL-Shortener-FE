"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]

const KEY_LABELS: Record<string, string> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  b: "B",
  a: "A",
}

export function EasterEggKonami() {
  const [activated, setActivated] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let seq: string[] = []

    const handler = (e: KeyboardEvent) => {
      seq.push(e.key)
      if (seq.length > KONAMI.length) seq = seq.slice(-KONAMI.length)

      if (seq.length === KONAMI.length && seq.every((k, i) => k === KONAMI[i])) {
        setActivated(true)
        setTimeout(() => setVisible(true), 100)
        setTimeout(() => setVisible(false), 5000)
        seq = []
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  if (!activated) return null

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 z-100 bg-brand/10 transition-opacity duration-1000",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="absolute inset-x-0 bottom-8 flex justify-center px-5">
        <div
          className={cn(
            "flex flex-wrap justify-center gap-1 rounded-xl border bg-card p-2 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.15)]",
            visible && "animate-result-in",
          )}
        >
          {KONAMI.map((key, index) => (
            <kbd
              key={index}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-md border bg-background px-2 font-mono text-sm",
                index >= KONAMI.length - 2 && "border-brand/40 bg-brand-soft text-brand",
              )}
            >
              {KEY_LABELS[key]}
            </kbd>
          ))}
        </div>
      </div>
    </div>
  )
}
