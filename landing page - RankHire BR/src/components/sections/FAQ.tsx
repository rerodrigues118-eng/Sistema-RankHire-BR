import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Reveal } from "../ui/Reveal"
import { Button } from "../ui/Button"

const FAQS = [
  {
    q: "Como funciona o trial de 14 dias?",
    a: "Você tem acesso completo a todos os recursos do plano Pro por 14 dias, sem custo. Ao final, escolhe o plano ideal ou cancela sem cobrança.",
  },
  {
    q: "Preciso de cartão de crédito para começar?",
    a: "Não. O período de teste é liberado apenas com seu e-mail corporativo, sem necessidade de cartão.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. Não há fidelidade nem multa. Cancele com um clique no painel e mantenha o acesso até o fim do ciclo pago.",
  },
  {
    q: "Como a IA ranqueia os candidatos?",
    a: "A IA analisa cada currículo contra os critérios da vaga, atribuindo notas por experiência, fit cultural e skills — com justificativa transparente para cada score.",
  },
  {
    q: "O sistema é compatível com a LGPD?",
    a: "Totalmente. Todos os dados são armazenados no Brasil, com consentimento, direito ao esquecimento e trilha de auditoria completa.",
  },
  {
    q: "Funciona para qualquer área de recrutamento?",
    a: "Sim. De tecnologia a varejo, saúde e indústria — a IA se adapta aos critérios que você define para cada vaga.",
  },
  {
    q: "Qual a diferença do LinkedIn Recruiter?",
    a: "Somos nativos em português, cobramos em Real, entregamos ranking automático por IA e um Agente autônomo — por uma fração do preço.",
  },
  {
    q: "O que é o Agente IA?",
    a: "É um recrutador autônomo que busca, filtra e qualifica candidatos no LinkedIn de forma contínua, entregando os melhores perfis prontos para você.",
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="border-b border-rh-border py-28 lg:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-8">
        {/* Left */}
        <Reveal direction="left">
          <span className="text-sm font-medium uppercase tracking-widest text-rh-green">
            FAQ
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-rh-white sm:text-5xl">
            Perguntas frequentes
          </h2>
          <p className="mt-4 max-w-sm leading-relaxed text-rh-gray">
            Não encontrou o que procurava? Nossa equipe responde em português e
            no seu fuso.
          </p>
          <Button variant="outline" size="md" className="mt-6">
            Falar com o time
          </Button>
        </Reveal>

        {/* Right — accordion */}
        <div className="divide-y divide-rh-border border-y border-rh-border">
          {FAQS.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q} className="relative">
                {/* Growing green line */}
                <span
                  className={`absolute left-0 top-0 h-full w-0.5 bg-rh-green transition-transform duration-300 ${
                    isOpen ? "scale-y-100" : "scale-y-0"
                  }`}
                  style={{ transformOrigin: "top" }}
                />
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-4 py-5 pl-5 pr-2 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="rounded-badge bg-rh-green-dim px-2 py-0.5 font-mono text-xs font-medium text-rh-green">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 font-display text-base font-bold text-rh-white sm:text-lg">
                    {item.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <ChevronDown className="h-5 w-5 text-rh-gray" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 pl-14 pr-6 leading-relaxed text-rh-gray">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
