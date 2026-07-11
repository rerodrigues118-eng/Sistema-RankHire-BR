import type { ReactNode } from "react"
import { motion } from "framer-motion"

type Direction = "up" | "left" | "right" | "none"

interface RevealProps {
  children: ReactNode
  delay?: number // milliseconds
  direction?: Direction
  className?: string
  amount?: number
}

const offsets: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 32 },
  left: { x: -32, y: 0 },
  right: { x: 32, y: 0 },
  none: { x: 0, y: 0 },
}

// Reusable scroll-in reveal. Animates opacity + transform only.
export function Reveal({
  children,
  delay = 0,
  direction = "up",
  className,
  amount = 0.2,
}: RevealProps) {
  const offset = offsets[direction]

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount, margin: "0px 0px -80px 0px" }}
      transition={{
        duration: 0.7,
        delay: delay / 1000,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  )
}
