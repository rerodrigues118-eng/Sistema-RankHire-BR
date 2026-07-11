import { useCountUp } from "../../hooks/useCountUp"

interface CountUpProps {
  end: number
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

export function CountUp({
  end,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1800,
  className = "",
}: CountUpProps) {
  const { ref, value } = useCountUp({ end, decimals, duration })
  return (
    <span ref={ref} className={className}>
      {prefix}
      {value}
      {suffix}
    </span>
  )
}
