import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030307] via-[#071029] to-[#061226] text-white flex items-center justify-center">
      <div className="max-w-4xl w-full px-6 py-20">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-black mb-6">RankHire BR — Recrutamento com IA em português</h1>
            <p className="text-lg text-zinc-300 mb-8">Leia currículos, ranqueie candidatos e encontre talentos no LinkedIn — tudo em português e cobrado em Real.</p>
            <div className="flex items-center gap-4">
              <Link href="/cadastro" className="bg-amber-400 text-black px-6 py-3 rounded-full font-semibold">Iniciar trial gratuito</Link>
              <Link href="/login" className="border border-white/20 px-5 py-3 rounded-full text-white">Ir para login</Link>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-2">Demonstração rápida</h3>
              <p className="text-sm text-zinc-300">Crie sua conta trial e siga o onboarding para gerar sua primeira vaga e testar o processamento de PDFs.</p>
              <ul className="mt-4 text-sm text-zinc-300 list-disc list-inside">
                <li>Trial de 14 dias</li>
                <li>10 PDFs/mês no trial</li>
                <li>Busca inteligente integrada (planos pagos)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
