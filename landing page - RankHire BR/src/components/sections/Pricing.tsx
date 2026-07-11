import { useState } from "react"
import { Check } from "lucide-react"
import { Reveal } from "../ui/Reveal"
import { Button } from "../ui/Button"

interface Plan {
  name: string
  monthly: number
  badge?: string
  badgeTone?: "green" | "gold"
  highlight?: "green" | "gold"
  features: string[]
  cta: string
  ctaVariant: "primary" | "outline" | "gold"
}

const PLANS: Plan[] = [
  {
    name: "Starter",
    monthly: 149,
    features: [
      "100 PDFs / mês",
      "50 buscas no LinkedIn",
      "5 vagas ativas",
      "Ranking por IA",
      "Suporte por e-mail",
    ],
    cta: "Começar grátis",
    ctaVariant: "outline",
  },
  {
    name: "Pro",
    monthly: 299,
    badge: "Mais popular",
    badgeTone: "green",
    highlight: "green",
    features: [
      "500 PDFs / mês",
      "300 buscas no LinkedIn",
      "Vagas ilimitadas",
      "Agente IA autônomo",
      "Analytics avançado",
      "Suporte prioritário",
    ],
    cta: "Começar grátis",
    ctaVariant: "primary",
  },
  {
    name: "Agência",
    monthly: 599,
    badge: "Para equipes",
    badgeTone: "gold",
    highlight: "gold",
    features: [
      "Tudo ilimitado",
      "Múltiplos usuários",
      "Workspaces por cliente",
      "API e integrações",
      "Gerente de conta dedicado",
    ],
    cta: "Falar com vendas",
    ctaVariant: "gold",
  },
]

export function Pricing() {
  const [annual, setAnnual] = useState(false)

  const priceFor = (monthly: number) =>
    annual ? Math.round(monthly * 0.8) : monthly

  return (
    <section id="precos" className="border-b border-rh-border py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="text-center">
          <span className="text-sm font-medium uppercase tracking-widest text-rh-green">
            Preços
          </span>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight text-rh-white sm:text-5xl">
            Planos em Real, sem surpresa
          </h2>
        </Reveal>

        {/* Toggle */}
        <Reveal delay={100} className="mt-10 flex items-center justify-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-rh-border bg-rh-surface p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                !annual ? "bg-rh-green text-rh-navy" : "text-rh-gray"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                annual ? "bg-rh-green text-rh-navy" : "text-rh-gray"
              }`}
            >
              Anual
              <span
                className={`rounded-badge px-1.5 py-0.5 text-[10px] font-bold ${
                  annual
                    ? "bg-rh-navy/20 text-rh-navy"
                    : "bg-rh-green-dim text-rh-green"
                }`}
              >
                -20%
              </span>
            </button>
          </div>
        </Reveal>

        {/* Cards */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 100}>
              <PlanCard plan={plan} price={priceFor(plan.monthly)} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function PlanCard({ plan, price }: { plan: Plan; price: number }) {
  const isPro = plan.highlight === "green"
  const isGold = plan.highlight === "gold"

  const borderCls = isPro
    ? "border-rh-green/50 shadow-[0_0_36px_rgba(6,214,160,0.12)]"
    : isGold
      ? "border-rh-gold/50 shadow-[0_0_36px_rgba(212,175,55,0.1)]"
      : "border-rh-border"

  return (
    <div
      className={`relative flex h-full flex-col rounded-card bg-rh-card p-8 transition-transform duration-200 hover:-translate-y-1 ${
        isPro ? "shimmer-border" : `border ${borderCls}`
      }`}
    >
      {/* When shimmer-border, we still need the base border color */}
      {isPro && (
        <span className="pointer-events-none absolute inset-0 rounded-card border border-rh-green/30" />
      )}

      {plan.badge && (
        <span
          className={`mb-4 inline-block w-fit rounded-badge border px-3 py-1 text-xs font-semibold ${
            plan.badgeTone === "gold"
              ? "border-rh-gold/40 bg-rh-gold-dim text-rh-gold"
              : "border-rh-green/40 bg-rh-green-dim text-rh-green"
          }`}
        >
          {plan.badge}
        </span>
      )}

      <h3 className="font-display text-xl font-bold text-rh-white">
        {plan.name}
      </h3>

      <div className="mt-4 flex items-end gap-1">
        <span className="font-display text-4xl font-bold text-rh-white">
          R${price}
        </span>
        <span className="mb-1 text-sm text-rh-gray">/mês</span>
      </div>

      <ul className="mt-7 flex-1 space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <Check
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                isGold ? "text-rh-gold" : "text-rh-green"
              }`}
            />
            <span className="text-rh-gray">{f}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => window.location.assign(`/cadastro?source=landing&plan=${plan.name.toLowerCase()}`)}
        className={`mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-btn px-5 text-sm font-semibold transition-all duration-200 ${
          plan.ctaVariant === "primary"
            ? "bg-rh-green text-rh-navy hover:shadow-[0_0_28px_rgba(6,214,160,0.35)] hover:brightness-105"
            : plan.ctaVariant === "gold"
              ? "border border-rh-gold/60 bg-transparent text-rh-gold hover:bg-rh-gold-dim hover:border-rh-gold"
              : "border border-rh-border bg-transparent text-rh-white hover:border-rh-green/60 hover:text-rh-green"
        }`}
      >
        {plan.cta}
      </button>
    </div>
  )
}
