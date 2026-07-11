import type { ReactNode } from "react"

type Tone = "green" | "gold"

interface BadgeProps {
  children: ReactNode
  tone?: Tone
  icon?: ReactNode
  className?: string
  pulse?: boolean
}

const tones: Record<Tone, string> = {
  green: "border-rh-green/40 bg-rh-green-dim text-rh-green",
  gold: "border-rh-gold/40 bg-rh-gold-dim text-rh-gold",
}

export function Badge({
  children,
  tone = "green",
  icon,
  className = "",
  pulse = false,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-badge border px-3 py-1 text-[13px] font-medium ${tones[tone]} ${
        pulse ? "animate-pulse-glow" : ""
      } ${className}`}
    >
      {icon}
      {children}
    </span>
  )
}
