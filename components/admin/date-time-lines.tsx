import { parseServerDateTime } from "@/lib/analytics"
import { formatDate } from "@/lib/utils"

/** A backend date-time as a date line and a time line, so a table column stays narrow. */
export function DateTimeLines({ value }: { value: string }) {
  const date = parseServerDateTime(value)
  return (
    <>
      <span className="block whitespace-nowrap">{formatDate(date)}</span>
      <span className="block whitespace-nowrap text-xs">{date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
    </>
  )
}
