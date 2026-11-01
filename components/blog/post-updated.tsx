import { formatContentDate } from "@/lib/content-dates"

export function PostUpdated({ date }: { date: string }) {
  return (
    <>
      <span aria-hidden="true"> · </span>
      Updated{" "}
      <time dateTime={date} className="tabular-nums">
        {formatContentDate(date)}
      </time>
    </>
  )
}
