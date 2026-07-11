import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X, ArrowUpRight } from "lucide-react"
import { Logo } from "../ui/Logo"
import { Button } from "../ui/Button"

const NAV_LINKS = [
  { label: "Produto", href: "#solucao" },
  { label: "Funcionalidades", href: "#como-funciona" },
  { label: "Preços", href: "#precos" },
  { label: "Sobre", href: "#faq" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ease-in-out ${
        scrolled
          ? "border-b border-rh-border bg-rh-navy/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <a href="#top" aria-label="RankHire BR — início">
          <Logo />
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="group relative text-sm font-medium text-rh-gray transition-colors hover:text-rh-white"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-rh-green transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={() => window.location.assign('/login?source=landing')}
            className="group inline-flex h-9 items-center justify-center gap-2 rounded-btn px-4 text-sm font-medium text-rh-white transition-all duration-200 hover:bg-rh-card/70"
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => window.location.assign('/cadastro?source=landing&plan=trial')}
            className="group inline-flex h-9 items-center justify-center gap-2 rounded-btn bg-rh-green px-4 text-sm font-semibold text-rh-navy transition-all duration-200 hover:shadow-[0_0_28px_rgba(6,214,160,0.35)] hover:brightness-105"
          >
            Começar grátis
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-btn text-rh-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-rh-border bg-rh-navy md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-btn px-2 py-3 text-base font-medium text-rh-gray transition-colors hover:bg-rh-card hover:text-rh-white"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                <Button variant="outline" size="md">
                  Entrar
                </Button>
                <Button variant="primary" size="md">
                  Começar grátis
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
