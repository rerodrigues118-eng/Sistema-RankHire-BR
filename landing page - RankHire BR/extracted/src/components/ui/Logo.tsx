interface LogoProps {
  className?: string
}

// Inline SVG mark: "R" with a green→gold gradient, next to the wordmark.
export function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="rh-logo-grad" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="#06D6A0" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
        </defs>
        <rect
          width="32"
          height="32"
          rx="8"
          fill="url(#rh-logo-grad)"
          fillOpacity="0.12"
          stroke="url(#rh-logo-grad)"
          strokeWidth="1"
        />
        <text
          x="16"
          y="22"
          textAnchor="middle"
          fontFamily="Syne, sans-serif"
          fontWeight="800"
          fontSize="18"
          fill="url(#rh-logo-grad)"
        >
          R
        </text>
      </svg>
      <span className="font-display text-xl font-bold tracking-tight text-rh-white">
        RankHire<span className="text-rh-green">BR</span>
      </span>
    </div>
  )
}
