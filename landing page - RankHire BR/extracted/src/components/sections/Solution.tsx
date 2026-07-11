import { motion } from "framer-motion"
import { Bot, Linkedin, Gauge } from "lucide-react"
import { Reveal } from "../ui/Reveal"

export function Solution() {
  return (
    <section id="solucao" className="border-b border-rh-border py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <span className="text-sm font-medium uppercase tracking-widest text-rh-green">
            A solução
          </span>
          <h2 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight text-rh-white sm:text-5xl">
            Tudo que você precisa. Nada que não.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-rh-gray">
            Uma plataforma completa de recrutamento inteligente, pensada do zero
            para o mercado brasileiro.
          </p>
        </Reveal>

        {/* Bento grid */}
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">
          {/* PDF Ranker — 2 cols */}
          <Reveal delay={0} className="md:col-span-2">
            <PdfRankerCard />
          </Reveal>

          {/* Score IA — 1 col */}
          <Reveal delay={80} className="md:col-span-1">
            <ScoreCard />
          </Reveal>

          {/* Agente IA — 1 col, 2 rows */}
          <Reveal delay={160} className="md:col-span-1 md:row-span-2">
            <AgentCard />
          </Reveal>

          {/* LinkedIn — 1 col */}
          <Reveal delay={240} className="md:col-span-1">
            <LinkedInCard />
          </Reveal>

          {/* Pipeline — 2 cols... placed below to fit grid */}
          <Reveal delay={320} className="md:col-span-1">
            <PipelineCard />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function CardShell({
  children,
  glow = "green",
  className = "",
}: {
  children: React.ReactNode
  glow?: "green" | "gold"
  className?: string
}) {
  const glowCls =
    glow === "gold"
      ? "hover:border-rh-gold/50 hover:shadow-[0_0_30px_rgba(212,175,55,0.12)]"
      : "hover:border-rh-green/50 hover:shadow-[0_0_30px_rgba(6,214,160,0.12)]"
  return (
    <div
      className={`group h-full rounded-card border border-rh-border bg-rh-card p-6 transition-all duration-200 hover:-translate-y-1 ${glowCls} ${className}`}
      style={{ willChange: "transform" }}
    >
      {children}
    </div>
  )
}

function PdfRankerCard() {
  const bars = [
    { label: "curriculo_ana.pdf", value: 96 },
    { label: "curriculo_joao.pdf", value: 72 },
    { label: "curriculo_bea.pdf", value: 88 },
  ]
  return (
    <CardShell className="border-rh-green/30">
      <div className="flex h-full flex-col justify-between gap-6">
        <div>
          <h3 className="font-display text-2xl font-bold text-rh-white">
            PDF Ranker
          </h3>
          <p className="mt-2 max-w-sm leading-relaxed text-rh-gray">
            Processe 150 currículos em paralelo e receba um ranking por fit em
            minutos.
          </p>
        </div>
        <div className="space-y-3">
          {bars.map((b, i) => (
            <div key={b.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-mono text-rh-muted">{b.label}</span>
                <span className="text-rh-green">{b.value}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-rh-surface">
                <motion.div
                  className="h-full rounded-full bg-rh-green"
                  initial={{ width: "0%" }}
                  whileInView={{ width: `${b.value}%` }}
                  viewport={{ once: false }}
                  transition={{
                    duration: 1.4,
                    delay: i * 0.2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    repeatDelay: 1,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  )
}

function ScoreCard() {
  const radius = 42
  const circ = 2 * Math.PI * radius
  const pct = 4.8 / 5
  return (
    <CardShell glow="gold">
      <div className="flex h-full flex-col items-center justify-center gap-4 py-2">
        <div className="relative h-32 w-32">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#21262D"
              strokeWidth="7"
            />
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#D4AF37"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              whileInView={{ strokeDashoffset: circ * (1 - pct) }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-3xl font-bold text-rh-gold">
              4.8
            </span>
          </div>
        </div>
        <div className="text-center">
          <h3 className="font-display text-lg font-bold text-rh-white">
            Score IA
          </h3>
          <p className="mt-1 text-sm text-rh-gray">Avaliação por critério</p>
        </div>
      </div>
    </CardShell>
  )
}

function AgentCard() {
  return (
    <CardShell>
      <div className="flex h-full flex-col justify-between gap-6">
        <div className="flex items-center justify-center py-8">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse-glow rounded-full bg-rh-green/20 blur-xl" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-rh-green/40 bg-rh-green-dim">
              <Bot className="h-11 w-11 text-rh-green" />
            </div>
          </div>
        </div>
        <div>
          <span className="mb-3 inline-block rounded-badge border border-rh-green/40 bg-rh-green-dim px-2.5 py-0.5 text-xs font-medium text-rh-green">
            Autônomo
          </span>
          <h3 className="font-display text-2xl font-bold text-rh-white">
            Agente IA
          </h3>
          <p className="mt-2 leading-relaxed text-rh-gray">
            Trabalha enquanto você dorme, buscando e qualificando candidatos sem
            supervisão.
          </p>
        </div>
      </div>
    </CardShell>
  )
}

function LinkedInCard() {
  return (
    <CardShell>
      <div className="flex h-full flex-col justify-between gap-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-card border border-rh-border bg-rh-surface">
          <Linkedin className="h-6 w-6 text-rh-green" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-rh-white">
            LinkedIn
          </h3>
          <p className="mt-2 leading-relaxed text-rh-gray">
            Boolean search em PT-BR com filtros avançados de senioridade e
            localização.
          </p>
        </div>
      </div>
    </CardShell>
  )
}

function PipelineCard() {
  const cols = [
    { title: "Triagem", n: 24 },
    { title: "Entrevista", n: 8 },
    { title: "Oferta", n: 3 },
  ]
  return (
    <CardShell>
      <div className="flex h-full flex-col justify-between gap-6">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-rh-green" />
          <h3 className="font-display text-xl font-bold text-rh-white">
            Pipeline
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {cols.map((c, ci) => (
            <div
              key={c.title}
              className="rounded-lg border border-rh-border bg-rh-surface p-2"
            >
              <p className="mb-2 text-[10px] uppercase tracking-wide text-rh-muted">
                {c.title}
              </p>
              <div className="space-y-1.5">
                {Array.from({ length: ci === 0 ? 3 : ci === 1 ? 2 : 1 }).map(
                  (_, i) => (
                    <motion.div
                      key={i}
                      className="h-3 rounded bg-rh-card"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: (ci + i) * 0.3,
                        ease: "easeInOut",
                      }}
                    />
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  )
}
