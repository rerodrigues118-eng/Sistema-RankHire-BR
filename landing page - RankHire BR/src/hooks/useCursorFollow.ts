import { useEffect, useState } from "react"

// Tracks the mouse position and whether it is hovering an interactive element.
export function useCursorFollow() {
  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [isHovering, setIsHovering] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only enable on fine pointers (mouse), skip touch devices.
    const finePointer = window.matchMedia("(pointer: fine)").matches
    if (!finePointer) return

    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
      setIsVisible(true)
      const target = e.target as HTMLElement
      const interactive = target.closest(
        'a, button, [role="button"], input, [data-cursor="hover"]',
      )
      setIsHovering(Boolean(interactive))
    }

    const handleLeave = () => setIsVisible(false)

    window.addEventListener("mousemove", handleMove)
    document.body.addEventListener("mouseleave", handleLeave)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      document.body.removeEventListener("mouseleave", handleLeave)
    }
  }, [])

  return { position, isHovering, isVisible }
}
