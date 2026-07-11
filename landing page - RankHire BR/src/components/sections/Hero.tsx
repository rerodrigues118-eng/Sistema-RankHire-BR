import { motion } from "framer-motion"
import { ArrowRight, ArrowDown, Sparkles, Star } from "lucide-react"
import { Button } from "../ui/Button"
import { HeroCard } from "./HeroCard"

const LINE_1 = ["Encontre", "os", "melhores"]
const LINE_2 = ["talentos", "em", "minutos"]

const wordVariants = {
  hidden: { opacity: 0, y: "0.4em" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.15 + i * 0.06,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
}

export function Hero() {
  const line1Count = LINE_1.length
  const total = LINE_1.length + LINE_2.length

  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-rh-border"
    >
      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 25% 30%, rgba(6,214,160,0.05) 0%, rgba(6,8,15,0) 70%)",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 pb-24 pt-40 lg:grid-cols-[60%_40%] lg:gap-8 lg:px-8 lg:pt-40">
        {/* LEFT */}
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 18,
              delay: 0.05,
            }}
            className="mb-7 inline-flex"
          >
            <span className="inline-flex items-center gap-1.5 rounded-badge border border-rh-green/40 bg-rh-green-dim px-3 py-1 text-[13px] font-medium text-rh-green">
              <Sparkles className="h-3.5 w-3.5" />
              Recrutamento com IA · PT-BR nativo
            </span>
          </motion.div>

          <h1 className="font-display text-[44px] font-bold leading-[1.03] tracking-tight text-rh-white sm:text-6xl lg:text-[80px]">
            <span className="block">
              {LINE_1.map((word, i) => (
                <span
                  key={word}
                  className="mr-[0.25em] inline-block overflow-hidden align-bottom"
                >
                  <motion.span
                    custom={i}
                    variants={wordVariants}
                    initial="hidden"
                    animate="visible"
                    className="inline-block"
                  >
                    {word}
                  </motion.span>
                </span>
              ))}
            </span>
            <span className="block">
              {LINE_2.map((word, i) => {
                const isLast = word === "minutos"
                return (
                  <span
                    key={word}
                    className="relative mr-[0.25em] inline-block overflow-hidden align-bottom"
                  >
                    <motion.span
                      custom={line1Count + i}
                      variants={wordVariants}
                      initial="hidden"
                      animate="visible"
                      className="inline-block"
                    >
                      {word}
                    </motion.span>
                    {isLast && (
                      <motion.svg
                        aria-hidden
                        className="absolute -bottom-2 left-0 w-full"
                        height="14"
                        viewBox="0 0 200 14"
                        preserveAspectRatio="none"
                        fill="none"
                      >
                        <motion.path
                          d="M2 8 C50 2, 150 2, 198 7"
                          stroke="#06D6A0"
                          strokeWidth="3"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{
                            duration: 0.7,
                            delay: 0.15 + total * 0.06 + 0.1,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        />
                      </motion.svg>
                    )}
                  </span>
                )
              })}
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 max-w-lg text-lg leading-relaxed text-rh-gray"
          >
            IA que lê currículos, ranqueia candidatos e busca talentos no
            LinkedIn — em português, cobrado em Real.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <button
              type="button"
              onClick={() => window.location.assign('/cadastro?source=landing&plan=starter')}
              className="group inline-flex h-13 items-center justify-center gap-2 rounded-btn bg-rh-green px-7 py-3.5 text-base font-semibold text-rh-navy transition-all duration-200 hover:shadow-[0_0_28px_rgba(6,214,160,0.35)] hover:brightness-105"
            >
              Começar grátis — 14 dias
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
            <a href="#como-funciona">
              <button
                type="button"
                className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-btn border border-rh-border px-7 py-3.5 text-base font-medium text-rh-white transition-all duration-200 hover:border-rh-green/60 hover:text-rh-green sm:w-auto"
              >
                Ver como funciona
                <ArrowDown className="h-4 w-4" />
              </button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm"
          >
            <Metric value="500+" label="Empresas" />
            <span className="h-8 w-px bg-rh-border" />
            <Metric value="50k" label="CVs processados" />
            <span className="h-8 w-px bg-rh-border" />
            <Metric
              value="4.8"
              label="Avaliação"
              icon={<Star className="h-3.5 w-3.5 fill-rh-gold text-rh-gold" />}
            />
          </motion.div>
        </div>

        {/* RIGHT */}
        <div className="relative">
          {/* Dot grid decorative background */}
          <svg
            aria-hidden
            className="absolute -right-8 -top-8 h-[120%] w-[120%] opacity-40"
            width="100%"
            height="100%"
          >
            <defs>
              <pattern
                id="hero-dots"
                x="0"
                y="0"
                width="22"
                height="22"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1.5" cy="1.5" r="1.5" fill="#484F58" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-dots)" />
          </svg>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="animate-float will-change-transform">
              <HeroCard />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex">
        <span className="text-xs tracking-wide text-rh-muted">
          Scroll para explorar
        </span>
        <div className="relative h-10 w-px overflow-hidden bg-rh-border">
          <motion.div
            className="absolute left-0 top-0 h-3 w-px bg-rh-green"
            animate={{ y: [-12, 40] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </section>
  )
}

function Metric({
  value,
  label,
  icon,
}: {
  value: string
  label: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <span className="flex items-center gap-1 font-display text-lg font-bold text-rh-white">
        {value}
        {icon}
      </span>
      <span className="text-xs text-rh-muted">{label}</span>
    </div>
  )
}
