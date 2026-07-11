const ROW_1 = [
  "Nubank",
  "iFood",
  "Totvs",
  "Conta Azul",
  "RD Station",
]
const ROW_2 = [
  "Gympass",
  "Hotmart",
  "Sebrae",
  "Resultados Digitais",
  "Gupy",
]

function Marquee({
  items,
  direction,
}: {
  items: string[]
  direction: "left" | "right"
}) {
  const doubled = [...items, ...items]
  return (
    <div className="mask-fade-x overflow-hidden">
      <div
        className={`flex w-max gap-14 ${
          direction === "left"
            ? "animate-marquee-left"
            : "animate-marquee-right"
        }`}
      >
        {doubled.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="whitespace-nowrap font-display text-2xl font-bold text-rh-muted"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}

export function Logos() {
  return (
    <section className="border-b border-rh-border py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="mb-10 text-center text-[13px] tracking-wide text-rh-muted">
          Confiado por empresas que recrutam com inteligência
        </p>
        <div className="flex flex-col gap-6">
          <Marquee items={ROW_1} direction="left" />
          <Marquee items={ROW_2} direction="right" />
        </div>
      </div>
    </section>
  )
}
