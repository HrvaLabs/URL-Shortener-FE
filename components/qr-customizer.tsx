"use client"

import { useId, useRef, useState } from "react"
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"

type Level = "L" | "M" | "Q" | "H"

interface QrCustomizerProps {
  value: string
  filename?: string
}

export function QrCustomizer({ value, filename = "qr-code" }: QrCustomizerProps) {
  const [fgColor, setFgColor] = useState("#0e0e11")
  const [bgColor, setBgColor] = useState("#ffffff")
  const [transparent, setTransparent] = useState(false)
  const [size, setSize] = useState(220)
  const [level, setLevel] = useState<Level>("M")
  const id = useId()

  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const svgWrapRef = useRef<HTMLDivElement>(null)

  const effectiveBg = transparent ? "transparent" : bgColor

  const downloadPng = () => {
    const canvas = canvasWrapRef.current?.querySelector("canvas")
    if (!canvas) return
    const a = document.createElement("a")
    a.href = canvas.toDataURL("image/png")
    a.download = `${filename}.png`
    a.click()
  }

  const downloadSvg = () => {
    const svg = svgWrapRef.current?.querySelector("svg")
    if (!svg) return
    const source = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([source], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={canvasWrapRef} className="max-w-full overflow-hidden rounded-lg border p-2" style={{ background: transparent ? "transparent" : "#ffffff" }}>
        <QRCodeCanvas value={value} size={size} fgColor={fgColor} bgColor={effectiveBg} level={level} marginSize={2} style={{ maxWidth: "100%", height: "auto" }} />
      </div>
      {/* hidden SVG mirror for vector export */}
      <div ref={svgWrapRef} className="hidden">
        <QRCodeSVG value={value} size={size} fgColor={fgColor} bgColor={effectiveBg} level={level} marginSize={2} />
      </div>

      <div className="w-full space-y-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-2">
            <Label htmlFor={`${id}-fg`}>Color</Label>
            <input id={`${id}-fg`} type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded-md border border-input bg-background p-0.5" />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`${id}-bg`}>Background</Label>
            <input id={`${id}-bg`} type="color" value={bgColor} disabled={transparent} onChange={(e) => setBgColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded-md border border-input bg-background p-0.5 disabled:cursor-not-allowed disabled:opacity-40" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} className="h-4 w-4 accent-brand" />
            Transparent
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Label htmlFor={`${id}-size`} className="w-16 shrink-0">Size</Label>
          <input id={`${id}-size`} type="range" min={120} max={512} step={20} value={size} onChange={(e) => setSize(Number(e.target.value))} className="min-w-0 flex-1 accent-brand" />
          <span className="w-12 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{size}px</span>
        </div>

        <div className="flex items-center gap-3">
          <Label htmlFor={`${id}-level`} className="w-16 shrink-0">Quality</Label>
          <select id={`${id}-level`} value={level} onChange={(e) => setLevel(e.target.value as Level)} className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0">
            <option value="L">Low (more data)</option>
            <option value="M">Medium</option>
            <option value="Q">Quartile</option>
            <option value="H">High (most robust)</option>
          </select>
        </div>
      </div>

      <div className="flex w-full gap-2">
        <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5" onClick={downloadPng}>
          <Download className="h-4 w-4" /> PNG
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5" onClick={downloadSvg}>
          <Download className="h-4 w-4" /> SVG
        </Button>
      </div>
    </div>
  )
}
