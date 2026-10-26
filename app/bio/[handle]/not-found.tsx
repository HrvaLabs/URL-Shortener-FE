import Link from "next/link"

export default function BioPageNotFound() {
  return (
    <div className="bio-public bio-theme-auto flex min-h-dvh w-full flex-col">
      <main className="mx-auto flex w-full max-w-[34rem] flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">This page isn&apos;t available</h1>
        <p className="mt-3 text-[var(--bio-muted)]">The address may be wrong, or the page was removed.</p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--bio-fg)] px-5 font-medium text-[var(--bio-bg)] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[var(--bio-fg)] focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          Go to hrva.cc
        </Link>
      </main>
    </div>
  )
}
