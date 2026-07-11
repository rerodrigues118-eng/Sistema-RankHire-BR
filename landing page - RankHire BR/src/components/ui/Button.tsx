import type { ButtonHTMLAttributes, ReactNode } from "react"

type Variant = "primary" | "ghost" | "gold" | "outline"
type Size = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const base =
  "group inline-flex items-center justify-center gap-2 rounded-btn font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rh-green/60 focus-visible:ring-offset-2 focus-visible:ring-offset-rh-navy disabled:opacity-50 disabled:pointer-events-none"

const variants: Record<Variant, string> = {
  primary:
    "bg-rh-green text-rh-navy font-semibold hover:shadow-[0_0_28px_rgba(6,214,160,0.35)] hover:brightness-105",
  ghost: "text-rh-white hover:bg-rh-card/70",
  gold: "bg-transparent text-rh-gold border border-rh-gold/60 hover:bg-rh-gold-dim hover:border-rh-gold",
  outline:
    "bg-transparent text-rh-white border border-rh-border hover:border-rh-green/60 hover:text-rh-green",
}

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 py-3.5 text-base",
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
