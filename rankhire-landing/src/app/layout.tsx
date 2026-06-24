import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "RankHire BR - Inteligência Artificial para Recrutamento",
  description: "Encontre os melhores talentos em segundos com a IA da RankHire. Triagem automatizada de currículos, busca inteligente no LinkedIn e pipeline kanban.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="antialiased text-[#111827] bg-[#FAFAFA]">
        {children}
      </body>
    </html>
  );
}
