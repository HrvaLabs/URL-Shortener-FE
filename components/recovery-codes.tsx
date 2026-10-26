"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy, Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

const FILE_NAME = "hrva-cc-recovery-codes.txt"
const COPIED_FEEDBACK_MS = 2000

function localDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

export function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    panelRef.current?.focus()
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

  const copyCodes = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"))
    } catch {
      toast.error("Couldn't copy the codes. Select them and copy them, or download them.")
      return
    }
    setSaved(true)
    setCopied(true)
    clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
  }

  const downloadCodes = () => {
    const account = user?.email ? ` for ${user.email}` : ""
    const header = `hrva.cc recovery codes${account}, created ${localDate(new Date())}. Each code works once.`
    const blob = new Blob([[header, ...codes].join("\n") + "\n"], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = FILE_NAME
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setSaved(true)
  }

  return (
    <div ref={panelRef} tabIndex={-1} className="space-y-4 outline-none">
      <p className="text-sm text-muted-foreground">
        Save these 10 recovery codes somewhere safe, such as your password manager. Each works once if you can&apos;t use
        your passkeys, security keys or authenticator app. You won&apos;t see them again.
      </p>
      <div className="grid grid-cols-2 gap-1.5 rounded-lg border bg-muted/40 p-3 font-mono text-sm">
        {codes.map((code) => <span key={code}>{code}</span>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={copyCodes}>
          {copied ? <Check className="h-4 w-4 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
          {copied ? "Copied" : "Copy codes"}
        </Button>
        <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={downloadCodes}>
          <Download className="h-4 w-4 shrink-0" />
          Download (.txt)
        </Button>
        <span role="status" className="sr-only">{copied ? "Recovery codes copied" : ""}</span>
      </div>
      <label className="flex w-fit cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={saved}
          onChange={(e) => setSaved(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-brand"
        />
        <span className="text-sm">I&apos;ve saved these codes</span>
      </label>
      <Button type="button" size="sm" disabled={!saved} onClick={onDone}>
        I&apos;ve saved them
      </Button>
    </div>
  )
}
