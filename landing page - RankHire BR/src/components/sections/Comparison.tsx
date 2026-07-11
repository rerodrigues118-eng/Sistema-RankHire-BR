import { motion } from "framer-motion"
import { Check, X } from "lucide-react"
import { Reveal } from "../ui/Reveal"
import { Button } from "../ui/Button"

const COMPETITOR_1 = {
  name: "LinkedIn Recruiter",
  price: "R$2.000+",
  period: "/mês",
  items: [
    "Interface em inglês",
    "Sem ranking automático por IA",
    "Cobrança em dólar",
    "Curva de aprendizado alta",
    "Foco no mercado global",
  ],
}

const RANKHIRE = {
  name: "RankHire BR",
  price: "a partir de R$149",
  period: "/mês",
  items: [
    "100% em português (PT-BR)",
    "Ranking automático por IA",
    "Cobrança em Real",
    "Onboarding em minutos",
    "Feito para o mercado brasileiro",
    "Agente IA autônomo",
  ],
}

const COMPETITOR_2 = {
  name: "Juicebox",
  price: "R$700+",
  period: "/mês (em dólar)",
  items: [
    "Interface em inglês",
    "Não entende CLT/PJ",
    "Cobrança em dólar",
    "Suporte fora do fuso BR",
    "Sem foco no Brasil",
  ],
}

export function Comparison() {
  return (
    <section className="border-b border-rh-border py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="text-center">
          <span className="text-sm font-medium uppercase tracking-widest text-rh-green">
            Comparativo
          </span>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight text-rh-white sm:text-5xl">
            Por que trocar pelo RankHire BR
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-center">
          <SideColumn data={COMPETITOR_1} delay={0} />
          <FeaturedColumn />
          <SideColumn data={COMPETITOR_2} delay={0.15} />
        </div>
      </div>
    </section>
  )
}

function SideColumn({
  data,
  delay,
}: {
  data: typeof COMPETITOR_1
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-rh-border bg-rh-surface p-7"
    >
      <h3 className="font-display text-xl font-bold text-rh-gray">
        {data.name}
      </h3>
      <p className="mt-3">
        <span className="font-display text-3xl font-bold text-rh-gray">
          {data.price}
        </span>
        <span className="text-sm text-rh-muted">{data.period}</span>
      </p>
      <ul className="mt-6 space-y-3">
        {data.items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm">
            <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400/60" />
            <span className="text-rh-gray">{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function FeaturedColumn() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-card border border-rh-green/60 bg-rh-card p-7 shadow-[0_0_40px_rgba(6,214,160,0.12)] lg:scale-105"
    >
      <span className="mb-4 inline-block rounded-badge border border-rh-green/40 bg-rh-green-dim px-3 py-1 text-xs font-semibold text-rh-green">
        Melhor escolha
      </span>
      <h3 className="font-display text-2xl font-bold text-rh-white">
        {RANKHIRE.name}
      </h3>
      <p className="mt-3">
        <span className="font-display text-3xl font-bold text-rh-green">
          {RANKHIRE.price}
        </span>
        <span className="text-sm text-rh-gray">{RANKHIRE.period}</span>
      </p>
      <ul className="mt-6 space-y-3">
        {RANKHIRE.items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-rh-green" />
            <span className="text-rh-white">{item}</span>
          </li>
        ))}
      </ul>
      <Button variant="primary" size="md" className="mt-7 w-full">
        Começar grátis
      </Button>
    </motion.div>
  )
}
