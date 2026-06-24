"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function SignupInlineCta() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) return;
        router.push(`/cadastro?email=${encodeURIComponent(trimmed)}`);
      }}
      className="mt-8 w-full max-w-md"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu e-mail corporativo"
          className="flex-1 rounded-full border border-white/10 bg-zinc-950 px-5 py-3 text-sm text-white outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-bold text-zinc-950 transition-colors hover:bg-zinc-100 cursor-pointer shadow-md"
        >
          Começar grátis
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
