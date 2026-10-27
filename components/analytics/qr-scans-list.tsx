import Link from "next/link"
import { BreakdownList } from "@/components/analytics/breakdown-list"
import { qrSplit } from "@/lib/analytics"
import type { AnalyticsTotals, BreakdownEntry } from "@/lib/types"

interface QrScansListProps {
  totals: AnalyticsTotals
  sources?: BreakdownEntry[]
  passwordProtected?: boolean
}

export function QrScansList({ totals, sources, passwordProtected }: QrScansListProps) {
  return (
    <BreakdownList
      title="QR scans and other clicks"
      dimension="sources"
      entries={qrSplit(totals, sources)}
      note={
        <>
          {passwordProtected
            ? "This link has a password, so every visit, scans included, counts as another click."
            : "QR scans count scans of QR codes made by hrva.cc. Links that were typed, clicked or pasted count as other clicks."}{" "}
          <Link href="/help/stats#qr-scans" className="text-brand-link">
            How QR scans are counted
          </Link>
        </>
      }
    />
  )
}
