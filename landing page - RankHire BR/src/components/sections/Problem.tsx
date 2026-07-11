import { motion } from "framer-motion"
import { Clock, Scale, DollarSign, ArrowRight } from "lucide-react"
import { useScrollAnimation } from "../../hooks/useScrollAnimation"
import { Reveal } from "../ui/Reveal"

const PROBLEMS = [
  {
    n: "①",
    icon: Clock,
    title: "Triagem manual",
    text: "Recrutador passa dias lendo currículos um por um, sem escala.",
  },
  {
    n: "②",
    icon: Scale,
    title: "Decisões subjetivas",
    text: "Critérios inconsistentes entre processos e entre recrutadores.",
  },
  {
    n: "③",
    icon: DollarSign,
    title: "Ferramentas em dólar",
    text: "Pagar R$700+ por algo feito para o mercado americano.",
  },
]

export function Problem() {
  const { ref, isInView } = useScrollAnimation(0.3)

  return (
    <section className="border-b border-rh-border py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <h2 className="max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-rh-white sm:text-5xl lg:text-[56px]">
            O recrutamento no Brasil está quebrado
          </h2>
        </Reveal>

        {/* Horizontal timeline */}
        <div ref={ref} className="relative mt-20">
          {/* Connector line (desktop) */}
          <svg
            aria-hidden
            className="absolute left-0 top-8 hidden h-1 w-full md:block"
            preserveAspectRatio="none"
            viewBox="0 0 100 1"
          >
            <motion.line
              x1="8"
              y1="0.5"
              x2="92"
              y2="0.5"
              stroke="#21262D"
              strokeWidth="1"
              strokeDasharray="1"
              initial={{ pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : {}}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
            {PROBLEMS.map((p, i) => {
              const Icon = p.icon
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 24 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.6,
                    delay: 0.3 + i * 0.2,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative"
                >
                  <div className="relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-card border border-rh-border bg-rh-card">
                    <Icon className="h-7 w-7 text-red-400/70" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl font-bold text-rh-muted">
                      {p.n}
                    </span>
                    <h3 className="font-display text-xl font-bold text-rh-white">
                      {p.title}
                    </h3>
                  </div>
                  <p className="mt-3 max-w-xs leading-relaxed text-rh-gray">
                    {p.text}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Turn */}
        <Reveal delay={200} className="mt-20">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-rh-border to-rh-green/40" />
            <div className="flex items-center gap-2 whitespace-nowrap font-display text-lg font-bold text-rh-green sm:text-2xl">
              <motion.span
                animate={{ x: [0, 6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="h-6 w-6" />
              </motion.span>
              Existe uma forma melhor
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-rh-border to-rh-green/40" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
