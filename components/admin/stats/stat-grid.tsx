import Link from "next/link"

export interface StatItem {
  label: string
  value: React.ReactNode
  hint?: string
  href?: string
}

interface StatGridProps {
  title?: string
  hint?: string
  items: StatItem[]
}

export function StatGrid({ title, hint, items }: StatGridProps) {
  const grid = (
    <dl className="grid gap-4 @md:grid-cols-2 @4xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 rounded-xl border bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums [overflow-wrap:anywhere]">
            {item.href ? (
              <Link href={item.href} className="text-brand-link">
                {item.value}
              </Link>
            ) : (
              item.value
            )}
          </dd>
          {item.hint && <dd className="mt-1 text-xs text-muted-foreground [overflow-wrap:anywhere]">{item.hint}</dd>}
        </div>
      ))}
    </dl>
  )

  if (!title) return grid

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {grid}
    </section>
  )
}
