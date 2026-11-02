import { useId } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { selectChevronClass } from "@/components/ui/select-chevron"
import { EXPIRY_OPTIONS, NEVER_EXPIRES_NOTE, type ExpiryChoice } from "@/lib/api-keys"
import { cn, toDateInputValue } from "@/lib/utils"

interface ApiKeyExpiryFieldProps {
  choice: ExpiryChoice
  customDate: string
  error: string | null
  onChoiceChange: (choice: ExpiryChoice) => void
  onCustomDateChange: (date: string) => void
}

const SELECT_CLASS = cn(
  "mt-1.5 flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0",
  selectChevronClass,
)

const tomorrow = (): string => {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return toDateInputValue(date)
}

export function ApiKeyExpiryField({ choice, customDate, error, onChoiceChange, onCustomDateChange }: ApiKeyExpiryFieldProps) {
  const id = useId()
  const dateId = `${id}-date`
  const errorId = `${id}-error`
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={id}>Expires</Label>
        <select id={id} value={choice} onChange={(event) => onChoiceChange(event.target.value as ExpiryChoice)} className={SELECT_CLASS}>
          {EXPIRY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      {choice === "custom" && (
        <div>
          <Label htmlFor={dateId}>Expiry date</Label>
          <Input
            id={dateId}
            type="date"
            min={tomorrow()}
            value={customDate}
            onChange={(event) => onCustomDateChange(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="mt-1.5"
          />
        </div>
      )}
      {choice === "never" && <p className="text-sm text-muted-foreground">{NEVER_EXPIRES_NOTE}</p>}
      {error && <p id={errorId} role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
