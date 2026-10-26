"use client"

import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type RefCallback,
} from "react"
import { insertionIndex, moveItem } from "@/lib/bio"

type DragSession = { pointerId: number; from: number; index: number }

type PendingFocus = { index: number; scroll: boolean }

const KEY_TARGETS = new Map<string, (index: number, last: number) => number>([
  ["ArrowUp", (index) => index - 1],
  ["ArrowDown", (index) => index + 1],
  ["Home", () => 0],
  ["End", (_index, last) => last],
])

const SCROLL_EDGE = 56

const SCROLL_STEP = 16

const HANDLE_STYLE: CSSProperties = { touchAction: "none" }

const focusIsLost = () => !document.activeElement || document.activeElement === document.body

export function useReorder<T>({
  items,
  onChange,
  label,
  disabled = false,
}: {
  items: readonly T[]
  onChange: (next: T[]) => void
  label: (item: T) => string
  disabled?: boolean
}) {
  const rows = useRef<(HTMLElement | null)[]>([])
  const handles = useRef<(HTMLElement | null)[]>([])
  const order = useRef<readonly T[]>(items)
  const moving = useRef(false)
  const session = useRef<DragSession | null>(null)
  const pendingFocus = useRef<PendingFocus | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [announcement, setAnnouncement] = useState({ text: "", id: 0 })

  useLayoutEffect(() => {
    order.current = items
    moving.current = false
    const focus = pendingFocus.current
    if (!focus) return
    pendingFocus.current = null
    handles.current[focus.index]?.focus({ preventScroll: !focus.scroll })
  })

  const announce = (next: readonly T[], index: number) => {
    const text = `Moved ${label(next[index])} to position ${index + 1} of ${next.length}`
    setAnnouncement((current) => ({ text, id: current.id + 1 }))
  }

  const move = (from: number, to: number): readonly T[] | null => {
    const current = order.current
    if (moving.current || to === from || to < 0 || to >= current.length) return null
    const next = moveItem(current, from, to)
    order.current = next
    moving.current = true
    onChange(next)
    return next
  }

  const followPointer = useEffectEvent((event: globalThis.PointerEvent) => {
    const drag = session.current
    if (!drag || event.pointerId !== drag.pointerId) return
    if (event.clientY < SCROLL_EDGE) window.scrollBy(0, -SCROLL_STEP)
    else if (event.clientY > window.innerHeight - SCROLL_EDGE) window.scrollBy(0, SCROLL_STEP)
    if (moving.current) return
    const midpoints = rows.current.slice(0, order.current.length).flatMap((row, index) => {
      if (index === drag.index || !row) return []
      const box = row.getBoundingClientRect()
      return [box.top + box.height / 2]
    })
    const to = insertionIndex(midpoints, event.clientY)
    const handleHadFocus = document.activeElement === handles.current[drag.index]
    if (!move(drag.index, to)) return
    drag.index = to
    setDraggingIndex(to)
    if (handleHadFocus) pendingFocus.current = { index: to, scroll: false }
  })

  const endDrag = useEffectEvent((event: globalThis.PointerEvent) => {
    const drag = session.current
    if (!drag || event.pointerId !== drag.pointerId) return
    session.current = null
    setDraggingIndex(null)
    if (drag.index !== drag.from) announce(order.current, drag.index)
    if (focusIsLost()) handles.current[drag.index]?.focus({ preventScroll: true })
  })

  const dragging = draggingIndex !== null

  useEffect(() => {
    if (!dragging) return
    const onMove = (event: globalThis.PointerEvent) => followPointer(event)
    const onEnd = (event: globalThis.PointerEvent) => endDrag(event)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onEnd)
    window.addEventListener("pointercancel", onEnd)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onEnd)
      window.removeEventListener("pointercancel", onEnd)
    }
  }, [dragging])

  const handleProps = (index: number) => ({
    ref: (element: HTMLElement | null) => {
      handles.current[index] = element
    },
    style: HANDLE_STYLE,
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (disabled || session.current || (event.pointerType === "mouse" && event.button !== 0)) return
      event.currentTarget.setPointerCapture(event.pointerId)
      session.current = { pointerId: event.pointerId, from: index, index }
      setDraggingIndex(index)
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      const target = KEY_TARGETS.get(event.key)
      if (!target || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      event.preventDefault()
      if (disabled || session.current) return
      const to = target(index, order.current.length - 1)
      const next = move(index, to)
      if (!next) return
      pendingFocus.current = { index: to, scroll: true }
      announce(next, to)
    },
  })

  const rowRef = (index: number): RefCallback<HTMLElement> => (element) => {
    rows.current[index] = element
  }

  return { handleProps, rowRef, announcement: announcement.text, announcementId: announcement.id, draggingIndex }
}
