import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { FileText, UploadCloud, ListOrdered } from "lucide-react"

const PANELS = [
  {
    n: "01",
    icon: FileText,
    title: "Descreva em português",
    text: "Escreva como você procuraria um amigo recrutador. A IA entende CLT, PJ e o mercado brasileiro.",
    visual: "type",
  },
  {
    n: "02",
    icon: UploadCloud,
    title: "Upload ou busca automática",
    text: "150 PDFs processados em minutos, ou busca autônoma no LinkedIn com filtros avançados.",
    visual: "stack",
  },
  {
    n: "03",
    icon: ListOrdered,
    title: "Ranking preciso, decisão rápida",
    text: "Candidatos ordenados por fit com justificativa por critério. Sem achismo, com dados.",
    visual: "rank",
  },
] as const

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66.66%"])
  const dot0 = useTransform(scrollYProgress, [0, 0.33], [1, 0.3])
  const dot1 = useTransform(scrollYProgress, [0.28, 0.4, 0.66], [0.3, 1, 0.3])
  const dot2 = useTransform(scrollYProgress, [0.66, 0.8], [0.3, 1])

  return (
    <section
      id="como-funciona"
      ref={sectionRef}
      className="relative h-[300vh] border-b border-rh-border"
    >
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        {/* Header + progress */}
        <div className="mx-auto flex w-full max-w-7xl items-end justify-between px-6 pb-6 pt-24 lg:px-8">
          <div>
            <span className="text-sm font-medium uppercase tracking-widest text-rh-green">
              Como funciona
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-rh-white sm:text-4xl">
              Do briefing ao candidato ideal
            </h2>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            {[dot0, dot1, dot2].map((op, i) => (
              <motion.span
                key={i}
                style={{ opacity: op }}
                className="h-2 w-2 rounded-full bg-rh-green"
              />
            ))}
          </div>
        </div>

        {/* Horizontal track */}
        <motion.div style={{ x }} className="flex h-full will-change-transform">
          {PANELS.map((p) => (
            <Panel key={p.n} panel={p} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function Panel({ panel }: { panel: (typeof PANELS)[number] }) {
  const Icon = panel.icon
  return (
    <div className="flex h-full w-screen shrink-0 items-center">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:px-8">
        {/* Text side */}
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-2 -top-24 select-none font-display text-[180px] font-extrabold leading-none text-rh-green-dim lg:text-[200px]"
          >
            {panel.n}
          </span>
          <div className="relative">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-card border border-rh-green/40 bg-rh-green-dim">
              <Icon className="h-7 w-7 text-rh-green" />
            </div>
            <h3 className="max-w-md font-display text-3xl font-bold leading-tight text-rh-white sm:text-4xl">
              {panel.title}
            </h3>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-rh-gray">
              {panel.text}
            </p>
          </div>
        </div>

        {/* Visual side */}
        <div className="flex justify-center">
          <PanelVisual variant={panel.visual} />
        </div>
      </div>
    </div>
  )
}

function PanelVisual({ variant }: { variant: "type" | "stack" | "rank" }) {
  if (variant === "type") {
    return (
      <div className="w-full max-w-md rounded-card border border-rh-border bg-rh-card p-6">
        <div className="mb-3 flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rh-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-rh-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-rh-border" />
        </div>
        <div className="rounded-lg bg-rh-surface p-4 font-mono text-sm text-rh-gray">
          <TypeLine />
        </div>
      </div>
    )
  }
  if (variant === "stack") {
    return (
      <div className="relative h-64 w-full max-w-md">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 flex w-56 items-center gap-3 rounded-card border border-rh-border bg-rh-card p-4"
            style={{ top: i * 18, zIndex: 10 - i }}
            initial={{ x: "-50%", opacity: 0.5 }}
            whileInView={{ x: "-50%", opacity: 1 }}
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          >
            <FileText className="h-5 w-5 shrink-0 text-rh-green" />
            <div className="h-2 flex-1 rounded bg-rh-surface" />
          </motion.div>
        ))}
      </div>
    )
  }
  // rank
  const items = [
    { name: "Ana C.", score: 96 },
    { name: "Beatriz L.", score: 91 },
    { name: "João P.", score: 84 },
  ]
  return (
    <div className="w-full max-w-md space-y-3">
      {items.map((it, i) => (
        <motion.div
          key={it.name}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5, delay: i * 0.15 }}
          className="flex items-center justify-between rounded-card border border-rh-border bg-rh-card p-4"
        >
          <div className="flex items-center gap-3">
            <span className="font-display text-sm font-bold text-rh-muted">
              #{i + 1}
            </span>
            <span className="text-sm font-medium text-rh-white">{it.name}</span>
          </div>
          <span className="font-display font-bold text-rh-gold">
            {it.score}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

function TypeLine() {
  return (
    <div>
      <motion.span
        initial={{ width: 0 }}
        whileInView={{ width: "100%" }}
        viewport={{ once: false }}
        transition={{ duration: 2, ease: "linear" }}
        className="inline-block overflow-hidden whitespace-nowrap align-bottom"
        style={{ display: "inline-block" }}
      >
        Preciso de um designer sênior, PJ, remoto...
      </motion.span>
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 bg-rh-green"
      />
    </div>
  )
}
