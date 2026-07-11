import { motion } from "framer-motion"
import { ArrowRight, Star } from "lucide-react"
import { Button } from "../ui/Button"
import { CountUp } from "../ui/CountUp"

const lineReveal = {
  hidden: { clipPath: "inset(100% 0 0 0)" },
  visible: (i: number) => ({
    clipPath: "inset(0% 0 0 0)",
    transition: {
      duration: 0.8,
      delay: i * 0.15,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
}

export function CTA() {
  return (
    <section className="relative overflow-hidden border-y border-rh-border py-32 lg:py-40">
      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 45%, rgba(6,214,160,0.06) 0%, rgba(6,8,15,0) 70%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
        <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-rh-white sm:text-6xl lg:text-[72px]">
          <span className="block overflow-hidden">
            <motion.span
              custom={0}
              variants={lineReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="inline-block"
            >
              Comece a contratar
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              custom={1}
              variants={lineReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="inline-block text-rh-green"
            >
              mais inteligente hoje.
            </motion.span>
          </span>
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-rh-gray"
        >
          14 dias grátis. Sem cartão. Cancele quando quiser.
        </motion.p>

        {/* Inline form */}
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.55 }}
          onSubmit={(e) => {
            e.preventDefault();
            window.location.assign('/login?source=landing&plan=trial');
          }}
          className="mx-auto mt-9 flex max-w-lg flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            required
            placeholder="seu@email.com.br"
            aria-label="Seu e-mail"
            className="h-13 flex-1 rounded-btn border border-rh-border bg-rh-surface px-4 text-sm text-rh-white placeholder:text-rh-muted focus:border-rh-green/60 focus:outline-none focus:ring-2 focus:ring-rh-green/30"
          />
          <Button type="submit" variant="primary" size="lg">
            Começar grátis
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Button>
        </motion.form>

        {/* Metrics */}
        <div className="mx-auto mt-16 flex max-w-xl items-center justify-center gap-8 sm:gap-16">
          <MetricBlock
            value={<CountUp end={500} suffix="+" />}
            label="Empresas"
          />
          <span className="h-10 w-px bg-rh-border" />
          <MetricBlock
            value={<CountUp end={50000} suffix="+" />}
            label="CVs processados"
          />
          <span className="h-10 w-px bg-rh-border" />
          <MetricBlock
            value={
              <span className="flex items-center gap-1">
                <CountUp end={4.8} decimals={1} />
                <Star className="h-5 w-5 fill-rh-gold text-rh-gold" />
              </span>
            }
            label="Avaliação"
          />
        </div>
      </div>
    </section>
  )
}

function MetricBlock({
  value,
  label,
}: {
  value: React.ReactNode
  label: string
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display text-2xl font-bold text-rh-white sm:text-3xl">
        {value}
      </span>
      <span className="mt-1 text-xs text-rh-muted sm:text-sm">{label}</span>
    </div>
  )
}
