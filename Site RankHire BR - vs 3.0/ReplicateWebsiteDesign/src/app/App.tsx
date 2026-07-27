import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  ChevronDown,
  ArrowRight,
  Check,
  Menu,
  X,
  Zap,
  Plus,
  Minus,
  Mail,
  BarChart2,
  Users,
  MessageSquare,
  GitMerge,
  Brain,
  Star,
  Play,
  Headphones,
  TrendingUp,
  Globe,
  Shield,
} from "lucide-react";

type Page = "home" | "features" | "pricing" | "about" | "contact" | "terms" | "404";

// ── Animation helpers ──────────────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, amount: 0.2 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

function staggerChild(i: number) {
  return {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: false, amount: 0.1 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 },
  };
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar({ page, onNav }: { page: Page; onNav: (p: Page) => void }) {
  const [open, setOpen] = useState(false);

  const links: { label: string; page: Page }[] = [
    { label: "Início", page: "home" },
    { label: "Funcionalidades", page: "features" },
    { label: "Preços", page: "pricing" },
    { label: "Sobre", page: "about" },
    { label: "Contato", page: "contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-14 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
      <button
        onClick={() => onNav("home")}
        className="flex items-center gap-2 text-slate-900 font-semibold text-sm"
      >
        <div className="w-5 h-5 border border-slate-300 rounded-sm flex items-center justify-center">
          <div className="w-2 h-2 bg-slate-900 rounded-[1px]" />
        </div>
        RankHire BR
      </button>

      <div className="hidden md:flex items-center gap-7">
        {links.map((l) => (
          <button
            key={l.page}
            onClick={() => onNav(l.page)}
            className={`text-sm transition-colors ${
              page === l.page ? "text-slate-900 font-semibold" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={() => { window.location.href = "/login"; }}
          className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 transition-colors font-medium"
        >
          Entrar
        </button>
        <button
          onClick={() => { window.location.href = "/cadastro"; }}
          className="flex items-center gap-1.5 text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md px-3.5 py-1.5 font-semibold hover:opacity-90 transition-all shadow-md shadow-blue-500/20"
        >
          Criar Conta <ArrowRight size={13} />
        </button>
      </div>

      <button className="md:hidden text-slate-900" onClick={() => setOpen(!open)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-slate-200 p-4 flex flex-col gap-3 md:hidden shadow-lg">
          {links.map((l) => (
            <button
              key={l.page}
              onClick={() => { onNav(l.page); setOpen(false); }}
              className="text-sm text-slate-600 hover:text-slate-900 text-left"
            >
              {l.label}
            </button>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={() => { window.location.href = "/login"; setOpen(false); }}
              className="text-sm text-slate-600 hover:text-slate-900 py-1.5 text-left font-medium"
            >
              Entrar
            </button>
            <button
              onClick={() => { window.location.href = "/cadastro"; setOpen(false); }}
              className="flex items-center justify-between text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md px-3 py-2 font-semibold hover:opacity-90 transition-all"
            >
              <span>Criar Conta</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer({ onNav }: { onNav: (p: Page) => void }) {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 pt-14 pb-8 text-left">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col items-center gap-6 mb-10">
          <div className="flex items-center gap-5">
            <a href="https://x.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" /></svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </a>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-8">
          <button onClick={() => onNav("home")} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Início</button>
          <button onClick={() => onNav("features")} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Funcionalidades</button>
          <button onClick={() => onNav("pricing")} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Preços</button>
          <button onClick={() => onNav("about")} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Sobre Nós</button>
          <button onClick={() => onNav("contact")} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Contato</button>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button onClick={() => onNav("home")} className="flex items-center gap-2 text-slate-900 text-sm font-semibold">
            <div className="w-5 h-5 border border-slate-300 rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-slate-900 rounded-[1px]" />
            </div>
            RankHire BR
          </button>
          <p className="text-xs text-slate-400">© 2026 RankHire BR. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Inbox Mockup (hero) ──────────────────────────────────────────────────────
function InboxMockup() {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-200 bg-slate-50">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 px-3 py-0.5 rounded-sm bg-slate-100 text-xs text-slate-500 w-48 justify-center">
            <Shield size={9} />
            app.rankhire.com.br/triagem
          </div>
        </div>
      </div>
      <div className="flex text-left" style={{ height: 340 }}>
        {/* Sidebar */}
        <div className="w-40 border-r border-slate-200 flex flex-col bg-slate-50 shrink-0">
          {/* Account */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white">RH</div>
            <span className="text-[11px] text-slate-700 font-medium truncate">RankHire AI</span>
            <ChevronDown size={10} className="ml-auto text-slate-400 shrink-0" />
          </div>
          {/* Nav items */}
          <div className="flex-1 overflow-hidden py-1">
            {[
              { label: "Vagas Ativas", count: 12, active: true },
              { label: "Candidatos", count: 342 },
              { label: "Triagem IA", count: 85 },
              { label: "Entrevistas", count: 8 },
              { label: "Histórico", count: null },
            ].map((item) => (
              <div key={item.label} className={`flex items-center justify-between px-3 py-1 text-[11px] cursor-pointer rounded mx-1 ${item.active ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-500 hover:text-slate-800"}`}>
                <span className="truncate">{item.label}</span>
                {item.count && <span className={item.active ? "text-blue-700 text-[9px]" : "text-slate-400 text-[9px]"}>{item.count}</span>}
              </div>
            ))}
            <div className="mt-1 border-t border-slate-200 pt-1">
              {[
                { label: "NLP Match", count: 24 },
                { label: "Python Dev", count: 18 },
                { label: "React Senior", count: 42 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between px-3 py-1 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer rounded mx-1">
                  <span className="truncate">{item.label}</span>
                  <span className="text-slate-400 text-[9px]">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Candidate list */}
        <div className="w-52 border-r border-slate-200 flex flex-col bg-white shrink-0">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-900">Triagem</span>
            <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Score 90%+</span>
          </div>
          <div className="px-2 py-1 border-b border-slate-200">
            <div className="flex items-center gap-1.5 bg-slate-100 rounded px-2 py-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span className="text-[9px] text-slate-400">Filtrar candidatos...</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {[
              { name: "Mateus Henrique", match: "Match Score: 98%", sub: "Engenheiro Senior • NLP Match", tags: ["Python", "PyTorch"], active: true },
              { name: "Fernanda Souza", match: "Match Score: 94%", sub: "Tech Lead Frontend • React Match", tags: ["Next.js", "TS"] },
              { name: "Gustavo Santos", match: "Match Score: 89%", sub: "Product Manager • Fit Match", tags: ["SaaS", "Agile"] },
            ].map((cand, i) => (
              <div key={i} className={`px-3 py-2 border-b border-slate-100 cursor-pointer ${cand.active ? "bg-slate-50" : "hover:bg-slate-50/50"}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-semibold text-slate-900 truncate max-w-[100px]">{cand.name}</span>
                  <span className="text-[9px] text-blue-600 font-bold shrink-0">{cand.match.split(": ")[1]}</span>
                </div>
                <div className="text-[9px] text-slate-500 font-medium mb-1 truncate">{cand.sub}</div>
                <div className="flex gap-1 flex-wrap">
                  {cand.tags.map((t) => (
                    <span key={t} className="text-[8px] px-1 py-0.5 bg-slate-100 text-slate-500 rounded">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Candidate content */}
        <div className="flex-1 bg-white p-3 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xs font-semibold text-slate-900">Mateus Henrique</h3>
                <p className="text-[10px] text-slate-500">Engenheiro Senior • NLP Match</p>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-bold">Match Score: 98%</span>
            </div>
            
            <div className="text-[10px] text-slate-600 leading-relaxed space-y-1.5">
              <p><strong className="text-slate-800">Resumo IA:</strong> 10+ anos de experiência real em fintechs. Inglês fluente para negociação comercial e facilidade de liderança de times de alta performance em IA.</p>
              <p><strong className="text-slate-800">Histórico:</strong> Tech Lead de IA na Stone (3 anos) e Eng. NLP na Hotmart (4 anos).</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <div className="bg-slate-50 rounded p-2 border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-semibold text-slate-700">Tempo de Triagem Reduzido em 85%</span>
                <span className="text-[9px] font-bold text-blue-600">-85%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full" style={{ width: "85%" }} />
              </div>
              <div className="flex justify-between mt-1 text-[8px] text-slate-500">
                <span>Antes: 48 horas (Filtros Manuais)</span>
                <span className="text-blue-600 font-medium">Agora: 7 minutos (RankHire AI)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Brand Logos ─────────────────────────────────────────────────────────────
function BrandLogos() {
  const brands = [
    { name: "Acme Corp", icon: "⟫" },
    { name: "Echo Valley", icon: "✕" },
    { name: "Quantum", icon: "✦" },
    { name: "PULSE", icon: null },
    { name: "Outside", icon: null },
    { name: "APEX", icon: "✕" },
    { name: "Celestial", icon: "✳" },
    { name: "2TWICE", icon: null },
  ];

  return (
    <section className="py-14 border-t border-slate-200 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6">
        <motion.p {...fadeUp} className="text-center text-sm text-slate-500 mb-8">Empresas inovadoras que contratam 10x mais rápido</motion.p>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-6">
          {brands.map((b, i) => (
            <motion.div key={b.name} {...staggerChild(i)} className="flex items-center justify-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
              {b.icon && <span className="text-slate-500 text-sm">{b.icon}</span>}
              <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">{b.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
function FAQAccordion({ items }: { items: { q: string; a: string; category: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="flex flex-col md:flex-row gap-10">
      <div className="md:w-72 shrink-0 text-left">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Perguntas Frequentes</h2>
        <p className="text-slate-600 text-sm leading-relaxed">Tudo o que você precisa saber sobre a plataforma e como podemos ajudar seu RH.</p>
      </div>
      <div className="flex-1 text-left">
        {categories.map((cat) => (
          <div key={cat} className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{cat}</p>
            <div className="space-y-px">
              {items.filter((i) => i.category === cat).map((item, idx) => {
                const globalIdx = items.indexOf(item);
                return (
                  <div key={idx} className="border-b border-slate-200">
                    <button
                      onClick={() => setOpen(open === globalIdx ? null : globalIdx)}
                      className="flex items-center justify-between w-full py-3.5 text-left"
                    >
                      <span className="text-sm font-medium text-slate-900">{item.q}</span>
                      {open === globalIdx ? (
                        <Minus size={14} className="text-slate-400 shrink-0 ml-4" />
                      ) : (
                        <Plus size={14} className="text-slate-400 shrink-0 ml-4" />
                      )}
                    </button>
                    {open === globalIdx && (
                      <p className="text-sm text-slate-600 pb-4 leading-relaxed">{item.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CTA Section ─────────────────────────────────────────────────────────────
function CTASection({ onNav }: { onNav: (p: Page) => void }) {
  return (
    <section className="py-24 text-center border-t border-slate-200 bg-slate-50">
      <div className="max-w-2xl mx-auto px-6">
        <motion.h2 {...fadeUp} className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
          Pronto para revolucionar seu recrutamento?
        </motion.h2>
        <motion.p {...fadeUp} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }} className="text-slate-600 mb-8 leading-relaxed text-sm">
          Substitua a triagem manual por inteligência artificial autônoma e encontre os melhores talentos em minutos.
        </motion.p>
        <motion.div {...fadeUp} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} className="flex items-center justify-center gap-4">
          <button
            onClick={() => { window.location.href = "/cadastro"; }}
            className="px-5 py-2.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-blue-500/20"
          >
            Iniciar Triagem Gratuita
          </button>
          <button 
            onClick={() => onNav("contact")}
            className="px-5 py-2.5 rounded-md border border-slate-300 bg-white text-slate-700 text-sm hover:bg-slate-50 transition-colors shadow-sm"
          >
            Falar com Consultor
          </button>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Pricing Cards ────────────────────────────────────────────────────────────
function PricingCards({ onNav }: { onNav: (p: Page) => void }) {
  const plans = [
    {
      name: "Starter",
      tagline: "Para Startups e RHs enxutos.",
      price: "Grátis",
      cta: "Começar Agora",
      ctaStyle: "ghost",
      features: [
        "Até 3 vagas ativas",
        "PDF Ranker (até 100 CVs/vaga)",
        "Busca Semântica Básica",
        "Suporte por e-mail",
      ],
    },
    {
      name: "Pro",
      tagline: "Para times em escala.",
      price: "R$ 1.490/mês",
      cta: "Testar Grátis por 14 dias",
      ctaStyle: "primary",
      popular: true,
      features: [
        "Vagas ilimitadas",
        "PDF Ranker Ilimitado",
        "Busca Semântica Avançada (NLP)",
        "1 Agente de IA Co-recrutador",
        "Exportação de dados e relatórios",
        "Suporte prioritário via chat",
      ],
    },
    {
      name: "Enterprise",
      tagline: "Para Grandes Operações e Consultorias.",
      price: "Sob Medida",
      cta: "Falar com Consultor",
      ctaStyle: "ghost",
      features: [
        "Tudo do plano Pro",
        "Múltiplos Agentes de IA customizados",
        "Integração via API com seu ATS/ERP atual",
        "Treinamento de algoritmo com base nos melhores funcionários da empresa",
        "Gerente de conta dedicado (CSM)",
      ],
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto text-left">
      {plans.map((plan, i) => (
        <motion.div
          key={plan.name}
          {...staggerChild(i)}
          className={`rounded-xl border p-6 flex flex-col relative ${
            plan.popular
              ? "border-blue-400/60 bg-gradient-to-b from-blue-50 to-white shadow-xl shadow-blue-500/10"
              : "border-slate-200 bg-white shadow-lg shadow-slate-200/50"
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-[10px] font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-0.5 rounded-full">Mais popular</span>
            </div>
          )}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-500 mb-1">{plan.name}</h3>
            <p className="text-xs text-slate-400 mb-3">{plan.tagline}</p>
            <div className="text-3xl font-bold text-slate-900">{plan.price}</div>
          </div>
          <div className="space-y-2 flex-1 mb-6">
            {plan.features.map((f) => (
              <div key={f} className="flex items-start gap-2">
                <Check size={13} className="text-blue-600 mt-0.5 shrink-0" />
                <span className="text-xs text-slate-600">{f}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              if (plan.name === "Enterprise") {
                onNav("contact");
              } else {
                window.location.href = "/cadastro";
              }
            }}
            className={`w-full py-2 rounded-md text-sm font-medium transition-all ${
              plan.ctaStyle === "primary"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-md shadow-blue-500/20"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
            }`}
          >
            {plan.cta}
          </button>
        </motion.div>
      ))}
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ onNav }: { onNav: (p: Page) => void }) {
  const faqItems = [
    { category: "Busca Semântica", q: "Como a Busca Semântica se diferencia de um filtro comum de palavras-chave?", a: "Filtros comuns buscam termos exatos no texto (ex: \"React\"). Nossa IA lê o contexto e entende sinônimos, vivências correlatas e senioridade real, encontrando candidatos excelentes que podem não ter escrito a palavra exata da sua busca, mas possuem a competência técnica exigida." },
    { category: "Integrações", q: "A plataforma se integra ao meu ATS atual (Gupy, Greenhouse, Workable)?", a: "Sim. No plano Enterprise, oferecemos integrações nativas e via API para exportar o ranking de candidatos diretamente para o sistema de gestão de vagas que a sua empresa já utiliza, sem necessidade de migração de dados." },
    { category: "Agentes de IA", q: "O Agente de IA conversa direto com os candidatos?", a: "Se você ativar essa função, sim. O co-recrutador autônomo pode enviar e-mails ou mensagens para tirar dúvidas básicas sobre a vaga, coletar pretensão salarial e agendar horários na agenda do recrutador humano automaticamente." },
    { category: "Segurança & LGPD", q: "Como a plataforma lida com a LGPD e privacidade dos currículos?", a: "A segurança é nossa prioridade fundamental. Todos os dados são criptografados de ponta a ponta, os currículos são processados em ambientes isolados e seguem rigorosamente as diretrizes da LGPD (Brasil) e GDPR (Europa), permitindo a exclusão automática de dados sensíveis após o término do processo seletivo." },
  ];

  const testimonials = [
    {
      company: "PULSE",
      text: "A RankHire transformou completamente a nossa triagem técnica. Reduzimos o tempo de triagem de semanas para poucas horas.",
      name: "Cristina Vasconcelos",
      role: "Diretora de Talent Acquisition",
      avatar: "C",
      large: true,
    },
    {
      company: "Quantum",
      text: "A busca semântica é incrível. Consigo achar candidatos qualificados mesmo se eles não usam as palavras-chave exatas da vaga.",
      name: "Wagner Silva",
      role: "Head de Recrutamento Técnico",
      avatar: "W",
    },
    {
      company: "Echo Valley",
      text: "O Agente de IA co-recrutador nos ajudou a pré-qualificar mais de 500 candidatos em tempo recorde.",
      name: "Marcos Medeiros",
      role: "Gerente de RH",
      avatar: "M",
    },
    {
      company: "Outside",
      text: "A facilidade de fazer upload de centenas de PDFs de currículos e obter um ranking instantâneo economizou centenas de horas de trabalho do nosso time.",
      name: "Sandra Costa",
      role: "Líder de Operações de RH",
      avatar: "S",
    },
    {
      company: "APEX",
      text: "A redução de viés inconsciente nas etapas de triagem nos ajudou a aumentar a diversidade no nosso short-list em mais de 40%.",
      name: "Thiago Barbosa",
      role: "Gerente de D&I e Recrutamento",
      avatar: "T",
    },
    {
      company: "2TWICE",
      text: "A integração com o nosso ATS atual (Gupy) funcionou perfeitamente. O time adotou a ferramenta no primeiro dia.",
      name: "Lícia Prado",
      role: "CEO",
      avatar: "L",
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-blue-100/60 via-indigo-50/30 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="relative max-w-4xl mx-auto">
          <motion.div {...fadeUp} className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3 py-1.5 mb-6 text-xs font-semibold">
            <span>✨ Nova era do recrutamento semântico</span>
          </motion.div>
          <motion.h1 {...fadeUp} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 }} className="text-5xl md:text-6xl font-bold text-slate-900 mb-5 leading-[1.08]">
            A evolução do recrutamento<br />
            impulsionada por <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">inteligência autônoma</span>
          </motion.h1>
          <motion.p {...fadeUp} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }} className="text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed text-base">
            Substitua filtros obsoletos de palavras-chave pela compreensão de contexto em linguagem natural. Triagem em massa, ranking de currículos e agentes co-recrutadores para times de alta performance.
          </motion.p>
          <motion.div {...fadeUp} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }} className="flex items-center justify-center gap-3 mb-12">
            <button
              onClick={() => { window.location.href = "/cadastro"; }}
              className="px-5 py-2.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-blue-500/20"
            >
              Iniciar Triagem Gratuita
            </button>
            <button
              onClick={() => onNav("contact")}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
            >
              Agendar Demo Executiva <ArrowRight size={14} />
            </button>
          </motion.div>
          {/* Product mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-blue-500/5 rounded-3xl blur-xl" />
            <div className="relative">
              <InboxMockup />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted by */}
      <BrandLogos />

      {/* Features */}
      <section className="py-20 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Recrutamento Inteligente de Ponta a Ponta</h2>
            <p className="text-slate-600 max-w-xl mx-auto">Explore as ferramentas de IA desenvolvidas para otimizar e acelerar seu pipeline de contratação.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Card 1 */}
            <motion.div {...staggerChild(0)} className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Brain size={20} className="text-blue-600" />
                  </div>
                  <span className="text-[10px] font-semibold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">Busca Semântica</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">Busca Inteligente por Contexto, não por Palavras-Chave</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Escreva como se estivesse explicando para um humano: <span className="text-slate-800 italic">"Preciso de um Tech Lead com vivência em fintechs e inglês fluente para negociação"</span>. Nossa IA mapeia a intenção real e encontra talentos ocultos que os filtros Booleanos tradicionais descartam.
                </p>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div {...staggerChild(1)} className="md:col-span-1 rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <BarChart2 size={20} className="text-blue-600" />
                  </div>
                  <span className="text-[10px] font-semibold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">Match de 0 a 100%</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">Triagem de Currículos em Massa</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Faça upload de centenas de PDFs de uma só vez. O sistema lê, valida históricos, cruza competências e gera um ranking limpo pontuado de 0 a 100% de compatibilidade em segundos.
                </p>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div {...staggerChild(2)} className="md:col-span-1 rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <MessageSquare size={20} className="text-blue-600" />
                  </div>
                  <span className="text-[10px] font-semibold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">Autonomia Total</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">Seu Co-piloto 24/7 no Pipeline</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Um agente inteligente que faz o primeiro contato, tira dúvidas dos candidatos e organiza o fluxo da vaga, liberando o recrutador apenas para as entrevistas decisivas.
                </p>
              </div>
            </motion.div>

            {/* Card 4 */}
            <motion.div {...staggerChild(3)} className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Shield size={20} className="text-blue-600" />
                  </div>
                  <span className="text-[10px] font-semibold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">D&I Otimizado</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">Contratação Baseada em Mérito Puro</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Algoritmos treinados para focar exclusivamente em competências técnicas, experiência real e fit cultural, eliminando vieses cognitivos na primeira etapa do processo seletivo.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-t border-slate-200 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.h2 {...fadeUp} className="text-3xl font-bold text-slate-900 mb-2">Números que comprovam a eficiência</motion.h2>
          <motion.p {...fadeUp} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }} className="text-slate-500 mb-12 text-sm">Resultados reais obtidos por times de recrutamento que utilizam nossa inteligência artificial autônoma.</motion.p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
            {[
              { icon: <TrendingUp size={20} className="text-blue-500" />, value: "85%", label: "Redução no tempo de triagem (Time-to-Hire)" },
              { icon: <Star size={20} className="text-blue-500" />, value: "98%", label: "De precisão no Match de competências" },
              { icon: <Users size={20} className="text-blue-500" />, value: "500K+", label: "Currículos processados e analisados" },
              { icon: <BarChart2 size={20} className="text-blue-500" />, value: "10x", label: "Mais candidatos qualificados no short-list" },
            ].map((s, i) => (
              <motion.div key={s.label} {...staggerChild(i)} className="flex flex-col items-start gap-2">
                {s.icon}
                <div className="text-3xl font-bold text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-3">Planos e Preços</h2>
            <p className="text-slate-600 text-sm">Escolha o plano ideal para a sua equipe de recrutamento.</p>
          </motion.div>
          <PricingCards onNav={onNav} />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 border-t border-slate-200 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-3">Criado para Recrutadores, Aprovado por Gestores</h2>
            <p className="text-slate-600 text-sm">Depoimentos de times de RH que transformaram suas operações com o RankHire BR.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4 text-left">
            {testimonials.map((t, i) => (
              <motion.div key={t.company} {...staggerChild(i)} className="rounded-xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-slate-800">{t.company}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{t.text}</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-900">{t.name}</p>
                    <p className="text-[10px] text-slate-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div {...fadeUp}>
            <FAQAccordion items={faqItems} />
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <CTASection onNav={onNav} />
    </div>
  );
}

// ─── Scroll Reveal Hook ───────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { setVisible(entry.isIntersecting); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

// ─── Feature Mockup: NLP Search ──────────────────────────────────────────────
function NLPSearchMockup() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/60">
      {/* Search bar with blue glow */}
      <div className="relative mb-5">
        <div className="flex items-center gap-2 rounded-lg border border-blue-300/60 bg-blue-50/50 px-3 py-3 shadow-[0_0_24px_rgba(59,130,246,0.10)]">
          <Brain size={13} className="text-blue-600 shrink-0" />
          <span className="text-[11px] text-slate-700 italic flex-1 leading-relaxed">
            "Arquiteto AWS com vivência em migração de legado e inglês para reuniões diárias"
          </span>
          <span className="text-[9px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-0.5 rounded font-semibold shrink-0">⏎ Buscar</span>
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
      </div>
      {/* Status label */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-[9px] text-slate-500">Motor NLP processando intenção semântica...</span>
        <span className="ml-auto text-[9px] text-blue-600 font-medium">0.3s</span>
      </div>
      {/* Result cards */}
      <div className="space-y-2">
        {[
          { name: "Mateus Henrique", role: "Cloud Architect • AWS Expert", score: "98%", tags: ["AWS", "Migration", "Inglês C2"] },
          { name: "Fernanda Lima", role: "Tech Lead • Infrastructure", score: "94%", tags: ["Azure", "Kubernetes", "Inglês B2+"] },
        ].map((c) => (
          <div key={c.name} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 hover:border-blue-300/50 transition-colors cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-slate-900">{c.name}</p>
              <p className="text-[9px] text-slate-500">{c.role}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {c.tags.map((t) => (
                  <span key={t} className="text-[8px] px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded">{t}</span>
                ))}
              </div>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 shrink-0">
              ✨ {c.score} Match
            </span>
          </div>
        ))}
        <p className="text-center text-[8px] text-slate-400 pt-1">2 talentos encontrados por compreensão semântica de contexto</p>
      </div>
    </div>
  );
}

// ─── Feature Mockup: PDF Ranker ───────────────────────────────────────────────
function PDFRankerMockup() {
  const files = [
    { name: "curriculo_joao_silva.pdf", match: 99, label: "Engenheiro Senior" },
    { name: "CV_fernanda_tech_lead.pdf", match: 94, label: "Tech Lead Frontend" },
    { name: "resume_marcos_pm.pdf", match: 71, label: "Product Manager" },
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/60">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={13} className="text-blue-600" />
          <span className="text-[11px] font-semibold text-slate-900">PDF Ranker — 3 arquivos</span>
        </div>
        <span className="text-[9px] bg-green-50 border border-green-200 text-green-600 px-2 py-0.5 rounded-full font-medium">✓ Concluído em 4.2s</span>
      </div>
      {/* File rows */}
      <div className="space-y-3">
        {files.map((f) => (
          <div key={f.name} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-50 border border-red-200 flex items-center justify-center text-[7px] text-red-500 font-bold shrink-0">PDF</div>
                <div>
                  <p className="text-[10px] text-slate-700 font-medium truncate max-w-[140px]">{f.name}</p>
                  <p className="text-[8px] text-slate-400">{f.label}</p>
                </div>
              </div>
              <span className={`text-[11px] font-bold ${f.match >= 90 ? "text-blue-600" : "text-slate-400"}`}>{f.match}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1 mb-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${f.match >= 90 ? "bg-gradient-to-r from-blue-600 to-indigo-600" : "bg-slate-300"}`}
                style={{ width: `${f.match}%` }}
              />
            </div>
            {f.match >= 90 && (
              <div className="flex justify-end">
                <button className="text-[9px] text-blue-600 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50 transition-colors">
                  Ver Análise da IA →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Feature Mockup: AI Agent Chat ───────────────────────────────────────────
function AIAgentMockup() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/60">
      {/* Chat header */}
      <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">AI</div>
        <div>
          <p className="text-[11px] font-semibold text-slate-900">RankHire AI Agent</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <p className="text-[9px] text-green-600">Online agora • responde em segundos</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
        </div>
      </div>
      {/* Messages */}
      <div className="space-y-3 mb-4">
        {/* AI message */}
        <div className="flex gap-2 items-start">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[7px] font-bold text-white shrink-0 mt-0.5">AI</div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl rounded-tl-none px-3 py-2 max-w-[90%]">
            <p className="text-[10px] text-slate-700 leading-relaxed">
              Olá, Marcos! 👋 Analisei seu background em Python e achei excelente. Você teria 15 minutos nesta <span className="text-blue-600 font-semibold">quinta-feira</span> para conversarmos sobre a vaga de Tech Lead?
            </p>
          </div>
        </div>
        {/* Typing indicator */}
        <div className="flex gap-2 items-center pl-7">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-[8px] text-slate-400">Marcos está digitando...</span>
        </div>
      </div>
      {/* Quick reply buttons */}
      <div className="flex flex-wrap gap-1.5">
        {["✅ Quinta às 14h, perfeito!", "📅 Prefiro outro horário", "📋 Quero saber mais"].map((opt) => (
          <button key={opt} className="text-[9px] border border-blue-200 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors">
            {opt}
          </button>
        ))}
      </div>
      <p className="text-[8px] text-slate-400 mt-3 text-center">Resposta sincroniza automaticamente com Google Calendar do recrutador</p>
    </div>
  );
}

// ─── FEATURES PAGE ────────────────────────────────────────────────────────────
function FeaturesPage({ onNav }: { onNav: (p: Page) => void }) {
  const block1 = useScrollReveal();
  const block2 = useScrollReveal();
  const block3 = useScrollReveal();
  const ctaBanner = useScrollReveal();

  const rc = (visible: boolean) =>
    `transition-all duration-700 ease-out ${
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
    }`;

  const specs1 = [
    {
      label: "Compreensão de Linguagem Natural",
      desc: 'Digite frases completas como "Preciso de um Arquiteto AWS com vivência em migração de legado e inglês para reuniões diárias". A IA interpreta intenção, não keywords.',
    },
    {
      label: "Mapeamento de Competências Correlatas",
      desc: 'Se você pedir "Node.js", o sistema automaticamente valoriza candidatos com histórico forte em ecossistemas modernos de JavaScript e Backend, mesmo que a palavra-chave exata esteja abreviada no CV.',
    },
    {
      label: "Filtro de Sênioridade Real",
      desc: "O algoritmo analisa o impacto dos projetos anteriores do candidato, separando plenos de seniores reais, independentemente do tempo de formado.",
    },
  ];

  const specs2 = [
    {
      label: "Score de Compatibilidade (0 a 100%)",
      desc: "Cada currículo recebe uma nota matemática baseada no cruzamento entre os requisitos obrigatórios da vaga e as entregas reais descritas no PDF.",
    },
    {
      label: "Auditoria de Histórico e Job Hopping",
      desc: "Identificação automática de lacunas temporais não explicadas, permanência média em empresas anteriores e consistência de carreira.",
    },
    {
      label: "Extração Limpa de Dados (Parsers com IA)",
      desc: "Não importa se o candidato fez o currículo em duas colunas, com gráficos ou em formatos complexos — nossa IA extrai apenas a verdade técnica e apresenta em interface padronizada.",
    },
  ];

  const specs3 = [
    {
      label: "Primeiro Contato e Engajamento",
      desc: "O agente aborda os candidatos pré-selecionados por e-mail ou WhatsApp, apresentando a vaga e verificando o interesse inicial em tempo real.",
    },
    {
      label: "Triagem Conversacional e Dúvidas",
      desc: "Responde perguntas frequentes dos candidatos sobre modelo de trabalho, benefícios e cultura da empresa, além de coletar pretensão salarial e disponibilidade de início.",
    },
    {
      label: "Agendamento Inteligente de Entrevistas",
      desc: "Sincronização direta com a agenda dos recrutadores humanos (Google Calendar / Outlook), marcando entrevistas automaticamente sem a famosa troca de 10 e-mails para achar um horário.",
    },
  ];

  return (
    <div className="pt-28 pb-0">
      {/* ── Page Hero ── */}
      <div className="text-center px-6 mb-24 max-w-3xl mx-auto">
        <motion.div {...fadeUp} className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3 py-1.5 mb-6 text-xs font-semibold">
          <Zap size={12} className="text-blue-600" />
          <span>Deep-Dive Técnico das Funcionalidades</span>
        </motion.div>
        <motion.h1 {...fadeUp} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 }} className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 leading-tight">
          Três pilares que<br />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">redefinem o recrutamento</span>
        </motion.h1>
        <motion.p {...fadeUp} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }} className="text-slate-600 text-base leading-relaxed max-w-xl mx-auto">
          Explore em profundidade a arquitetura de IA por trás da Busca Semântica, do PDF Ranker e do Agente Co-recrutador autônomo.
        </motion.p>
      </div>

      {/* ── BLOCK 1: NLP SEARCH (texto esquerda, mockup direita) ── */}
      <section className="px-6 mb-28 border-t border-slate-200 pt-24">
        <div
          ref={block1.ref}
          className={`max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center ${rc(block1.visible)}`}
        >
          <div className="text-left">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full mb-5">
              🧠 Motor Semântico NLP
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              Busca Inteligente por Contexto: O fim dos filtros Booleanos obsoletos
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              Nossa inteligência artificial não busca palavras idênticas em uma tabela blindada. Ela decodifica a intenção por trás da sua busca, entendendo sinônimos, correlações técnicas e nível de maturidade profissional exatamente como um Tech Recruiter sênior faria.
            </p>
            <div className="space-y-5">
              {specs1.map((s) => (
                <div key={s.label} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={10} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-0.5">{s.label}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <NLPSearchMockup />
        </div>
      </section>

      {/* ── BLOCK 2: PDF RANKER (mockup esquerda, texto direita) ── */}
      <section className="px-6 mb-28 border-t border-slate-200 pt-24 bg-slate-50/50">
        <div
          ref={block2.ref}
          className={`max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center ${rc(block2.visible)}`}
        >
          <PDFRankerMockup />
          <div className="text-left">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full mb-5">
              📊 Análise em Lote 10x Mais Rápida
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              PDF Ranker: Triagem de centenas de currículos em segundos com pontuação de precisão
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              Elimine dias de leitura manual e fadiga visual. O PDF Ranker processa pilhas de documentos simultaneamente, estruturando dados caóticos de qualquer modelo de currículo em um ranking limpo, ordenado pelo percentual de compatibilidade real com a vaga.
            </p>
            <div className="space-y-5">
              {specs2.map((s) => (
                <div key={s.label} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={10} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-0.5">{s.label}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOCK 3: AI AGENT (texto esquerda, mockup direita) ── */}
      <section className="px-6 mb-28 border-t border-slate-200 pt-24">
        <div
          ref={block3.ref}
          className={`max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center ${rc(block3.visible)}`}
        >
          <div className="text-left">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full mb-5">
              🤖 Autonomia de Ponta a Ponta
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              Agente Co-recrutador: Seu assistente 24/7 que opera o topo do funil sozinho
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              Enquanto sua equipe foca no relacionamento humano e nas decisões finais, o Agente de IA assume o trabalho operacional de engajar talentos, tirar dúvidas e organizar a agenda, acelerando o fechamento da vaga sem perder o toque de empatia.
            </p>
            <div className="space-y-5">
              {specs3.map((s) => (
                <div key={s.label} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={10} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-0.5">{s.label}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <AIAgentMockup />
        </div>
      </section>

      {/* ── FULL-WIDTH CTA BANNER ── */}
      <section className="px-6 pb-24 border-t border-slate-200 pt-16">
        <div
          ref={ctaBanner.ref}
          className={`max-w-5xl mx-auto ${rc(ctaBanner.visible)}`}
        >
          <div className="relative rounded-2xl overflow-hidden border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50/30 p-14 text-center shadow-xl shadow-blue-500/5">
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 rounded-2xl border border-blue-100/50 pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3 py-1 mb-6 text-xs font-semibold">
                <Play size={10} className="fill-blue-600" />
                <span>Demo ao vivo disponível agora</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                Pronto para ver essa arquitetura em ação?
              </h2>
              <p className="text-slate-600 text-sm max-w-lg mx-auto mb-10 leading-relaxed">
                Agende uma demonstração técnica de 20 minutos e veja o PDF Ranker e a Busca Semântica processando vagas reais.
              </p>
              <button
                onClick={() => onNav("contact")}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-blue-500/20"
              >
                Agendar Demo Executiva <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── PRICING PAGE ─────────────────────────────────────────────────────────────
function PricingPage({ onNav }: { onNav: (p: Page) => void }) {
  const faqItems = [
    { category: "Busca Semântica", q: "Como a Busca Semântica se diferencia de um filtro comum de palavras-chave?", a: "Filtros comuns buscam termos exatos no texto (ex: \"React\"). Nossa IA lê o contexto e entende sinônimos, vivências correlatas e senioridade real, encontrando candidatos excelentes que podem não ter escrito a palavra exata da sua busca, mas possuem a competência técnica exigida." },
    { category: "Integrações", q: "A plataforma se integra ao meu ATS atual (Gupy, Greenhouse, Workable)?", a: "Sim. No plano Enterprise, oferecemos integrações nativas e via API para exportar o ranking de candidatos diretamente para o sistema de gestão de vagas que a sua empresa já utiliza, sem necessidade de migração de dados." },
    { category: "Agentes de IA", q: "O Agente de IA conversa direto com os candidatos?", a: "Se você ativar essa função, sim. O co-recrutador autônomo pode enviar e-mails ou mensagens para tirar dúvidas básicas sobre a vaga, coletar pretensão salarial e agendar horários na agenda do recrutador humano automaticamente." },
    { category: "Segurança & LGPD", q: "Como a plataforma lida com a LGPD e privacidade dos currículos?", a: "A segurança é nossa prioridade fundamental. Todos os dados são criptografados de ponta a ponta, os currículos são processados em ambientes isolados e seguem rigorosamente as diretrizes da LGPD (Brasil) e GDPR (Europa), permitindo a exclusão automática de dados sensíveis após o término do processo seletivo." },
  ];

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">Planos Flexíveis para<br />Qualquer Escala</h1>
          <p className="text-slate-600 max-w-md mx-auto text-sm">Comece gratuitamente e evolua sua operação com nossa tecnologia de recrutamento autônomo.</p>
        </motion.div>
        <PricingCards onNav={onNav} />

        <motion.div {...fadeUp} className="mt-20 border-t border-slate-200 pt-16">
          <FAQAccordion items={faqItems} />
        </motion.div>
      </div>
      <CTASection onNav={onNav} />
    </div>
  );
}

// ─── ABOUT / CAREERS PAGE ─────────────────────────────────────────────────────
function AboutPage({ onNav }: { onNav: (p: Page) => void }) {
  const roles = [
    { title: "Engenheiro de Software Senior (IA/NLP)", location: "Remoto / São Paulo", type: "Tempo Integral" },
    { title: "Designer de Produto (UX/UI)", location: "Remoto / Rio de Janeiro", type: "Tempo Integral" },
    { title: "Cientista de Dados (LLMs)", location: "Remoto", type: "Tempo Integral" },
    { title: "Gerente de Sucesso do Cliente", location: "São Paulo, SP", type: "Tempo Integral" },
    { title: "Pesquisador de UX", location: "Remoto", type: "Tempo Integral" },
  ];

  const values = [
    { title: "Inovação com IA", description: "Utilizamos tecnologia de IA de ponta para impacto real na vida dos recrutadores." },
    { title: "Foco no Candidato", description: "Projetamos experiências que respeitam o tempo e a jornada de quem busca uma oportunidade." },
    { title: "Decisões por Dados", description: "Ajudamos empresas a tomarem decisões imparciais e embasadas em dados reais." },
    { title: "D&I por Padrão", description: "Nossos algoritmos são desenhados para reduzir viés e impulsionar a diversidade." },
    { title: "Colaboração Global", description: "Trabalhamos de forma assíncrona e distribuída para construir o futuro do trabalho." },
  ];

  return (
    <div className="pt-28 pb-20">
      {/* Hero */}
      <section className="px-6 text-center mb-16">
        <div className="max-w-3xl mx-auto">
          <motion.h1 {...fadeUp} className="text-5xl font-bold text-slate-900 mb-4 leading-tight">
            Liderando a evolução do<br />recrutamento com inteligência artificial
          </motion.h1>
          <motion.p {...fadeUp} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }} className="text-slate-600 max-w-xl mx-auto mb-6 text-sm leading-relaxed">
            Estamos construindo a plataforma de triagem e inteligência semântica mais avançada do mercado para conectar grandes empresas a grandes talentos.
          </motion.p>
          <motion.button
            {...fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            onClick={() => onNav("contact")}
            className="px-5 py-2.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-blue-500/20"
          >
            Ver vagas abertas
          </motion.button>
        </div>
      </section>

      {/* Office photo */}
      <section className="px-6 mb-20">
        <motion.div {...fadeUp} className="max-w-5xl mx-auto rounded-xl overflow-hidden h-64 md:h-80">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwd29ya2luZyUyMG9mZmljZSUyMEFJJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3ODQ5OTA1MTl8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Team working in office"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </section>

      {/* Why work here */}
      <section className="px-6 mb-20">
        <div className="max-w-5xl mx-auto text-left">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="md:w-64 shrink-0">
              <motion.h2 {...fadeUp} className="text-2xl font-bold text-slate-900 mb-3">Por que trabalhar na RankHire?</motion.h2>
            </div>
            <div className="flex-1 space-y-5">
              {values.map((v, i) => (
                <motion.div key={v.title} {...staggerChild(i)} className="flex gap-8">
                  <div className="w-44 shrink-0 text-sm font-medium text-slate-800">{v.title}</div>
                  <div className="text-sm text-slate-500 leading-relaxed">{v.description}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Minds */}
      <section className="px-6 mb-20 border-t border-slate-200 pt-16">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Meet the Minds</h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Nosso time de especialistas dedicados a revolucionar o recrutamento e seleção através de inteligência artificial autônoma.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                name: "Mateus Henrique",
                role: "Fundador & CEO | Ex-Head de Talent Acquisition",
                img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300&h=300",
              },
              {
                name: "Thiago Costa",
                role: "CTO & Líder de IA | Especialista em NLP",
                img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300&h=300",
              },
              {
                name: "Maria Rodrigues",
                role: "Diretora de Produto & Experiência do Candidato",
                img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300&h=300",
              },
              {
                name: "Ana Souza",
                role: "Head de Sucesso do Cliente & Operações de RH",
                img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300&h=300",
              },
            ].map((member, i) => (
              <motion.div key={member.name} {...staggerChild(i)} className="flex flex-col items-center text-center">
                <div className="w-full aspect-square rounded-xl overflow-hidden mb-4 border border-slate-200">
                  <img
                    src={member.img}
                    alt={member.name}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{member.name}</h3>
                <p className="text-[11px] text-slate-500 leading-normal max-w-[200px]">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section className="px-6 mb-20">
        <div className="max-w-5xl mx-auto text-left">
          <motion.h2 {...fadeUp} className="text-2xl font-bold text-slate-900 mb-6">Vagas abertas</motion.h2>
          <div className="space-y-3">
            {roles.map((role, i) => (
              <motion.div
                key={role.title}
                {...staggerChild(i)}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 mb-1">{role.title}</div>
                  <div className="text-xs text-slate-500">{role.location}</div>
                </div>
                <button
                  onClick={() => onNav("contact")}
                  className="text-xs border border-slate-300 rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Candidatar-se
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection onNav={onNav} />
    </div>
  );
}

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────
function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const brands = ["Acme Corp", "Echo Valley", "Quantum", "PULSE", "Outside", "APEX", "Celestial", "2TWICE"];

  return (
    <div className="pt-28 pb-20 px-6 text-left">
      <div className="max-w-2xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Fale Conosco</h1>
          <p className="text-slate-600 text-sm">Tem dúvidas ou gostaria de uma demonstração personalizada? Nosso time está pronto para ajudar!</p>
        </motion.div>

        {submitted ? (
          <motion.div {...fadeUp} className="text-center py-12 border border-slate-200 rounded-xl bg-white shadow-sm">
            <Check size={32} className="text-green-500 mx-auto mb-3" />
            <h3 className="text-slate-900 font-semibold mb-1">Mensagem enviada!</h3>
            <p className="text-slate-600 text-sm">Entraremos em contato em até 24 horas.</p>
          </motion.div>
        ) : (
          <motion.form
            {...fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-600 mb-1 block">Nome</label>
                <input
                  type="text"
                  placeholder="Seu nome"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">Sobrenome</label>
                <input
                  type="text"
                  placeholder="Seu sobrenome"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-600 mb-1 block">E-mail corporativo</label>
              <input
                type="email"
                placeholder="voce@empresa.com"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Telefone</label>
              <input
                type="tel"
                placeholder="+55 (11) 99999-9999"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Mensagem</label>
              <textarea
                rows={4}
                placeholder="Como podemos ajudar seu time de RH?"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:opacity-90 transition-all shadow-md shadow-blue-500/20"
            >
              Enviar Mensagem →
            </button>
            <p className="text-center text-xs text-slate-500">
              Ao enviar este formulário, você concorda com a nossa{" "}
              <span className="text-blue-600 underline cursor-pointer">política de privacidade</span>
            </p>
          </motion.form>
        )}

        {/* Trusted by */}
        <div className="mt-20 text-center">
          <p className="text-center text-sm text-slate-500 mb-8">Empresas inovadoras que contratam 10x mais rápido</p>
          <div className="grid grid-cols-4 gap-4">
            {brands.map((b) => (
              <div key={b} className="flex items-center justify-center">
                <span className="text-sm font-semibold text-slate-500">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TERMS PAGE ───────────────────────────────────────────────────────────────
function TermsPage() {
  const sections = [
    {
      title: "1. Aceitação dos Termos",
      body: "Ao acessar ou usar a plataforma RankHire, você reconhece que leu, compreendeu e concorda em estar vinculado a estes Termos. Se você não concordar, não deverá usar nossos serviços.",
    },
    {
      title: "2. Contas de Usuário",
      body: "Para acessar determinados recursos da plataforma, você precisará se registrar. Você concorda em fornecer informações precisas, completas e atualizadas durante o registro.",
    },
    {
      title: "3. Política de Privacidade",
      body: "Nossa Política de Privacidade descreve como coletamos, usamos e protegemos suas informações. Ao usar nossos serviços, você concorda com a coleta e uso de dados conforme descrito nela.",
    },
    {
      title: "4. Responsabilidades do Usuário",
      body: "Você é responsável por manter a confidencialidade da sua senha e conta, bem como por todas as atividades que ocorrem sob sua conta.",
    },
    {
      title: "5. Propriedade Intelectual e LGPD",
      body: "Todo o conteúdo inserido por você na plataforma permanece como sua propriedade. Seus dados e os dados de currículos processados seguem estritamente as diretrizes da LGPD.",
    },
    {
      title: "6. Limitação de Responsabilidade",
      body: "Na extensão máxima permitida pela lei aplicável, a RankHire não será responsável por quaisquer danos indiretos, incidentais ou consequentes decorrentes do uso da plataforma.",
    },
  ];

  return (
    <div className="pt-28 pb-20 px-6 text-left">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Termos de Serviço</h1>
        <p className="text-sm text-slate-500 mb-12">Última atualização: 25 de Julho de 2026</p>
        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-base font-semibold text-slate-900 mb-2">{s.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 404 PAGE ─────────────────────────────────────────────────────────────────
function NotFoundPage({ onNav }: { onNav: (p: Page) => void }) {
  return (
    <div className="pt-28 pb-20 flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-100/60 blur-3xl rounded-full" />
        <h1 className="relative text-8xl font-bold text-slate-900 tracking-tighter">
          4<span className="text-slate-300">0</span>4
        </h1>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-3">Página não encontrada</h2>
      <p className="text-slate-500 text-sm mb-8">Desculpe, não conseguimos encontrar a página que você está procurando.</p>
      <button
        onClick={() => onNav("home")}
        className="flex items-center gap-2 px-4 py-2.5 rounded-md border border-slate-300 text-slate-700 text-sm hover:bg-slate-50 transition-colors"
      >
        <ArrowRight size={14} className="rotate-180" />
        Voltar para a página inicial
      </button>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("home");

  const onNav = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white font-[Inter,sans-serif] text-slate-900">
      <Navbar page={page} onNav={onNav} />
      <main>
        {page === "home" && <HomePage onNav={onNav} />}
        {page === "features" && <FeaturesPage onNav={onNav} />}
        {page === "pricing" && <PricingPage onNav={onNav} />}
        {page === "about" && <AboutPage onNav={onNav} />}
        {page === "contact" && <ContactPage />}
        {page === "terms" && <TermsPage />}
        {page === "404" && <NotFoundPage onNav={onNav} />}
      </main>
      <Footer onNav={onNav} />
    </div>
  );
}
