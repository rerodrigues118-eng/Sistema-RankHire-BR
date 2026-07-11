import type { HTMLAttributes, ReactNode } from "react"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  glow?: "green" | "gold" | "none"
}

const glows: Record<NonNullable<CardProps["glow"]>, string> = {
  green: "hover:border-rh-green/50 hover:shadow-[0_0_30px_rgba(6,214,160,0.12)]",
  gold: "hover:border-rh-gold/50 hover:shadow-[0_0_30px_rgba(212,175,55,0.12)]",
  none: "hover:border-rh-muted",
}

export function Card({
  children,
  hover = true,
  glow = "green",
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-card border border-rh-border bg-rh-card transition-all duration-200 ${
        hover ? `hover:-translate-y-1 ${glows[glow]}` : ""
      } ${className}`}
      style={hover ? { willChange: "transform" } : undefined}
      {...props}
    >
      {children}
    </div>
  )
}
