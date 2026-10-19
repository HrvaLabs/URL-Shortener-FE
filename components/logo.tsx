import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  showText?: boolean
  href?: string
  className?: string
}

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="8" className="fill-foreground" />
      <rect x="8" y="10.5" width="16" height="3.5" rx="1.75" className="fill-background" />
      <rect x="8" y="18" width="7.5" height="3.5" rx="1.75" className="fill-background" />
      <circle cx="21.25" cy="19.75" r="2.25" className="fill-brand" />
    </svg>
  )
}

export function Logo({ showText = true, href = "/", className = "" }: LogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {showText && (
        <span className="text-lg font-semibold tracking-[-0.02em]">
          hrva<span className="text-muted-foreground">.cc</span>
        </span>
      )}
    </span>
  )

  if (href) {
    return (
      <Link href={href} aria-label="hrva.cc home" className="rounded-md">
        {content}
      </Link>
    )
  }

  return content
}
