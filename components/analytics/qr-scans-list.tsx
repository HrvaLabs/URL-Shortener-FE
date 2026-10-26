import Link from "next/link"
import { BreakdownList } from "@/components/analytics/breakdown-list"
import { QR_SCANS_START, analyticsDay, qrSplit } from "@/lib/analytics"
import type { AnalyticsTotals, BreakdownEntry } from "@/lib/types"
import { formatDate } from "@/lib/utils"

interface QrScansListProps {
  totals: AnalyticsTotals
  sources: BreakdownEntry[]
  passwordProtected?: boolean
}

export function QrScansList({ totals, sources, passwordProtected }: QrScansListProps) {
  const qrScansStart = formatDate(analyticsDay(QR_SCANS_START))

  return (
    <BreakdownList
      title="QR scans and direct clicks"
      dimension="sources"
      entries={qrSplit(totals, sources)}
      note={
        <>
          QR scans are scans of QR codes made by hrva.cc from {qrScansStart}. Codes made before then, and links that were
          typed, clicked or pasted, count as direct.{" "}
          <Link href="/help/stats#qr-scans" className="text-brand-link">
            How QR scans are counted
          </Link>
          {passwordProtected && <span className="mt-1 block">Scans of password-protected links count as direct.</span>}
        </>
      }
    />
  )
}
