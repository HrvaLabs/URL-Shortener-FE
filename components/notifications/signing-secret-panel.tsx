"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import Link from "next/link"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

const COPIED_FEEDBACK_MS = 2000

interface SigningSecretPanelProps {
  channelName: string
  secret: string
  onDone: () => void
}

export const SigningSecretPanel = forwardRef<HTMLHeadingElement | null, SigningSecretPanelProps>(function SigningSecretPanel(
  { channelName, secret, onDone },
  ref,
) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [copied, setCopied] = useState(false)

  useImperativeHandle(ref, () => headingRef.current as HTMLHeadingElement, [])

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warnBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload)
      clearTimeout(copiedTimer.current)
    }
  }, [])

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret)
    } catch {
      toast.error("Couldn't copy the secret. Select it and copy it.")
      return
    }
    setCopied(true)
    clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
  }

  return (
    <section aria-labelledby="signing-secret-heading" className="space-y-3 rounded-lg border border-warning/40 bg-warning/5 p-4">
      <div>
        <h5
          id="signing-secret-heading"
          ref={headingRef}
          tabIndex={-1}
          className="scroll-mt-24 text-sm font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          Your signing secret
        </h5>
        <p className="mt-0.5 text-sm text-muted-foreground [overflow-wrap:anywhere]">{channelName}</p>
      </div>
      <p className="rounded-md border bg-background px-3 py-2 font-mono text-sm [overflow-wrap:anywhere]">{secret}</p>
      <p className="text-sm text-muted-foreground">
        This is the only time it&apos;s shown. Use it to check the X-Hrva-Signature header.{" "}
        <Link href="/help/notifications#webhook" target="_blank" rel="noopener" className="text-brand-link">How to check signatures</Link>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copySecret} className="gap-1.5">
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? "Copied" : "Copy secret"}
        </Button>
        <Button type="button" size="sm" onClick={onDone}>I&apos;ve saved it</Button>
      </div>
      <p role="status" className="sr-only">{copied ? "Secret copied." : ""}</p>
    </section>
  )
})
