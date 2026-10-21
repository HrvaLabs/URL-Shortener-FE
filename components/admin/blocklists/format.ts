export function formatMegabytes(bytes: number | null): string {
  if (bytes == null) return "—"
  return `${(bytes / 1_048_576).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MB`
}
