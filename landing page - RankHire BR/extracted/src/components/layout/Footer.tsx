import { Logo } from "../ui/Logo"

const columns = [
  {
    title: "Produto",
    links: ["Recursos", "Integrações", "Novidades", "Roadmap", "Preços"],
  },
  {
    title: "Empresa",
    links: ["Sobre", "Carreiras", "Blog", "Imprensa", "Contato"],
  },
  {
    title: "Recursos",
    links: ["Documentação", "Guias", "Referência da API", "Comunidade", "Suporte"],
  },
  {
    title: "Legal",
    links: ["Privacidade", "Termos", "Segurança", "Cookies", "LGPD"],
  },
]

const socials = ["Twitter", "LinkedIn", "GitHub", "YouTube"]

export function Footer() {
  return (
    <footer className="border-t border-rh-border bg-rh-surface">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-rh-gray">
              A plataforma de recrutamento que transforma pilhas de currículos em uma lista curta de
              talentos ranqueados por IA em minutos.
            </p>
            <div className="mt-6 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={s}
                  className="flex h-9 w-9 items-center justify-center rounded-btn border border-rh-border text-xs font-medium text-rh-gray transition-colors hover:border-rh-green hover:text-rh-green"
                >
                  {s[0]}
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-rh-white">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-rh-gray transition-colors hover:text-rh-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-rh-border pt-8 sm:flex-row">
          <p className="text-sm text-rh-gray">
            {"\u00A9"} {new Date().getFullYear()} RankHire Tecnologia Ltda. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2 text-sm text-rh-gray">
            <span className="h-2 w-2 rounded-full bg-rh-green" />
            Todos os sistemas operando
          </div>
        </div>
      </div>
    </footer>
  )
}
