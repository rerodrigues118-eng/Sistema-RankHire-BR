import { motion } from "framer-motion"
import { useCursorFollow } from "../../hooks/useCursorFollow"

// Small green dot that follows the mouse and expands over interactive elements.
export function CustomCursor() {
  const { position, isHovering, isVisible } = useCursorFollow()

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] hidden rounded-full bg-rh-green mix-blend-difference md:block"
      animate={{
        x: position.x - (isHovering ? 16 : 4),
        y: position.y - (isHovering ? 16 : 4),
        width: isHovering ? 32 : 8,
        height: isHovering ? 32 : 8,
        opacity: isVisible ? (isHovering ? 0.5 : 1) : 0,
      }}
      transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.3 }}
      style={{ willChange: "transform" }}
    />
  )
}
