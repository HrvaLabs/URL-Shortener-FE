"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  page: number
  totalPages: number
  totalElements?: number
  size: number
  onPageChange: (page: number) => void
  onSizeChange: (size: number) => void
}

const PAGE_SIZES = [10, 20, 50, 100]

export function Pagination({ page, totalPages, totalElements, size, onPageChange, onSizeChange }: PaginationProps) {
  const firstItem = totalElements ? page * size + 1 : 0
  const lastItem = totalElements ? Math.min((page + 1) * size, totalElements) : 0

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {totalElements != null && (
          <span className="tabular-nums">
            {firstItem}–{lastItem} of {totalElements}
          </span>
        )}
        <span className="ml-2 hidden sm:inline">Rows per page</span>
        <select
          aria-label="Rows per page"
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="h-8 rounded-lg border border-input bg-background px-2 text-xs tabular-nums text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus:border-ring focus:outline-hidden focus:ring-4 focus:ring-ring/15"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        {totalPages > 0 && (
          <span className="text-xs text-muted-foreground mr-1">
            Page {page + 1} of {totalPages}
          </span>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
