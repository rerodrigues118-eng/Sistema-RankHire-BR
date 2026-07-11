import { useEffect, useRef, useState } from "react"
import { useInView } from "framer-motion"

interface UseCountUpOptions {
  end: number
  duration?: number
  decimals?: number
  start?: number
}

// Counts from `start` to `end` when the element enters the viewport.
export function useCountUp({
  end,
  duration = 1800,
  decimals = 0,
  start = 0,
}: UseCountUpOptions) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const [value, setValue] = useState(start)

  useEffect(() => {
    if (!isInView) return

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    if (prefersReduced) {
      setValue(end)
      return
    }

    let raf = 0
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // expo out easing
      const eased = 1 - Math.pow(2, -10 * progress)
      setValue(start + (end - start) * (progress === 1 ? 1 : eased))
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setValue(end)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isInView, end, duration, start])

  const formatted = value.toFixed(decimals)
  return { ref, value: formatted, isInView }
}
