import { motion } from "framer-motion"

const CRITERIA = [
  { label: "Experiência", value: 92 },
  { label: "Fit cultural", value: 88 },
  { label: "Skills técnicas", value: 95 },
]

const SKILLS = ["React", "TypeScript", "Node", "UX"]

// Score gauge (circular) in gold + criteria bars in green.
export function HeroCard() {
  const radius = 34
  const circ = 2 * Math.PI * radius
  const score = 4.8
  const pct = score / 5

  return (
    <div className="w-full max-w-md rounded-card border border-rh-border bg-rh-card p-6 shadow-[0_0_60px_rgba(6,214,160,0.08)]">
      {/* Candidate header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rh-green/20 to-rh-gold/20 font-display text-lg font-bold text-rh-white">
            MS
          </div>
          <div>
            <p className="text-sm font-semibold text-rh-white">Mariana Silva</p>
            <p className="text-xs text-rh-gray">Product Designer Sênior</p>
          </div>
        </div>

        {/* Gauge */}
        <div className="relative h-20 w-20">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="#21262D"
              strokeWidth="6"
            />
            <motion.circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="#D4AF37"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              whileInView={{ strokeDashoffset: circ * (1 - pct) }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-xl font-bold text-rh-gold">
              {score}
            </span>
            <span className="text-[10px] text-rh-muted">score</span>
          </div>
        </div>
      </div>

      {/* Criteria bars */}
      <div className="mt-6 space-y-3.5">
        {CRITERIA.map((c, i) => (
          <div key={c.label}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-rh-gray">{c.label}</span>
              <span className="font-medium text-rh-white">{c.value}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-rh-surface">
              <motion.div
                className="h-full rounded-full bg-rh-green"
                initial={{ width: 0 }}
                whileInView={{ width: `${c.value}%` }}
                viewport={{ once: true }}
                transition={{
                  duration: 1,
                  delay: 0.5 + i * 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="mt-6 flex flex-wrap gap-2">
        {SKILLS.map((s) => (
          <span
            key={s}
            className="rounded-badge border border-rh-border bg-rh-surface px-2.5 py-1 text-xs text-rh-gray"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}
