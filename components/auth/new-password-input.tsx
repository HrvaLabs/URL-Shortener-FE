"use client"

import { forwardRef, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input, type InputProps } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export const NEW_PASSWORD_RULES = "At least 8 characters and at most 72 bytes. Accented letters count as two bytes."

interface NewPasswordInputProps extends Omit<InputProps, "id" | "type" | "autoComplete"> {
  id: string
  error?: string | null
}

export const NewPasswordInput = forwardRef<HTMLInputElement, NewPasswordInputProps>(({ id, error, className, ...props }, ref) => {
  const [shown, setShown] = useState(false)
  const rulesId = `${id}Rules`
  const errorId = `${id}Error`

  return (
    <div className={className}>
      <div className="relative">
        <Input
          ref={ref}
          id={id}
          type={shown ? "text" : "password"}
          autoComplete="new-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${rulesId} ${errorId}` : rulesId}
          className="pr-11"
          {...props}
        />
        <button
          type="button"
          onClick={() => setShown((current) => !current)}
          aria-pressed={shown}
          aria-controls={id}
          aria-label={shown ? "Hide password" : "Show password"}
          className={cn(
            "absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors",
            "hover:text-foreground focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-ring/15",
          )}
        >
          {shown ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      <p id={rulesId} className="mt-1.5 text-xs text-muted-foreground">{NEW_PASSWORD_RULES}</p>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-destructive [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
    </div>
  )
})
NewPasswordInput.displayName = "NewPasswordInput"
