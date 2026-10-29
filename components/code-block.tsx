import type { ReactNode } from "react"
import { CopyButton } from "@/components/copy-button"
import { cn } from "@/lib/utils"

interface CodeBlockProps {
  label: string
  code: string
  copyLabel: string
  mono?: boolean
  prompt?: boolean
}

export function CodeBlock({ label, code, copyLabel, mono, prompt }: CodeBlockProps) {
  return (
    <div className="mt-4 min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 py-1.5 pl-4 pr-2">
        <span className={cn("min-w-0 text-xs text-zinc-400 [overflow-wrap:anywhere]", mono ? "font-mono" : "font-medium")}>{label}</span>
        <CopyButton text={code} label={copyLabel} className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100" />
      </div>
      <pre className="whitespace-pre-wrap wrap-break-word p-4 font-mono text-[12.5px] leading-relaxed">
        <code>
          {prompt && <span className="select-none text-zinc-500">$ </span>}
          {code}
        </code>
      </pre>
    </div>
  )
}

export function InlineCode({ children, wrap = false }: { children: ReactNode; wrap?: boolean }) {
  return (
    <code
      className={cn(
        "rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground",
        wrap ? "[overflow-wrap:anywhere]" : "whitespace-nowrap",
      )}
    >
      {children}
    </code>
  )
}
