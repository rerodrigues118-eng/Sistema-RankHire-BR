import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Quote } from "lucide-react"
import { Reveal } from "../ui/Reveal"

const TESTIMONIALS = [
  {
    quote: "Reduzi triagem de 2 dias para 30 minutos.",
    name: "Gustavo R.",
    role: "Recrutador Sênior",
    city: "São Paulo",
    initials: "GR",
  },
  {
    quote: "Finalmente uma ferramenta que fala português.",
    name: "Ana C.",
    role: "Head de RH",
    city: "Curitiba",
    initials: "AC",
  },
  {
    quote:
      "O Agente IA encontrou 3 candidatos enquanto eu estava em reunião.",
    name: "Roberto M.",
    role: "Talent Acquisition",
    city: "Rio de Janeiro",
    initials: "RM",
  },
]

export function Testimonials() {
  const [active, setActive] = useState(0)
  const count = TESTIMONIALS.length

  const next = useCallback(
    () => setActive((a) => (a + 1) % count),
    [count],
  )

  useEffect(() => {
    const id = setInterval(next, 4000)
    return () => clearInterval(id)
  }, [next])

  const getOffset = (i: number) => {
    const diff = (i - active + count) % count
    if (diff === 0) return 0
    if (diff === 1) return 1
    if (diff === count - 1) return -1
    return diff
  }

  return (
    <section className="overflow-hidden border-b border-rh-border py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="text-center">
          <span className="text-sm font-medium uppercase tracking-widest text-rh-green">
            Depoimentos
          </span>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight text-rh-white sm:text-5xl">
            Quem recruta com o RankHire BR
          </h2>
        </Reveal>

        <div
          className="relative mx-auto mt-20 h-72 max-w-2xl"
          style={{ perspective: "1200px" }}
        >
          {TESTIMONIALS.map((t, i) => {
            const offset = getOffset(i)
            const isActive = offset === 0
            return (
              <motion.button
                key={t.name}
                onClick={() => !isActive && setActive(i)}
                aria-label={`Ver depoimento de ${t.name}`}
                className="absolute left-1/2 top-0 w-full max-w-lg cursor-pointer"
                animate={{
                  x: `calc(-50% + ${offset * 55}%)`,
                  scale: isActive ? 1 : 0.86,
                  rotateY: offset * -15,
                  opacity: Math.abs(offset) > 1 ? 0 : isActive ? 1 : 0.5,
                  zIndex: isActive ? 30 : 10 - Math.abs(offset),
                }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className={`rounded-card border bg-rh-card p-8 text-left ${
                    isActive
                      ? "border-rh-green/40 shadow-[0_0_40px_rgba(6,214,160,0.1)]"
                      : "border-rh-border"
                  }`}
                >
                  <Quote className="h-8 w-8 text-rh-green/50" />
                  <p className="mt-4 font-display text-xl font-bold leading-snug text-rh-white sm:text-2xl">
                    {t.quote}
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-rh-green/20 to-rh-gold/20 text-sm font-bold text-rh-white">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-rh-white">
                        {t.name}
                      </p>
                      <p className="text-xs text-rh-gray">
                        {t.role} · {t.city}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Ir para depoimento ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-rh-green" : "w-2 bg-rh-border"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
