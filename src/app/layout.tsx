import type { Metadata } from "next";
import "./globals.css";
// Using system fonts instead of fetching Google Fonts during build

export const metadata: Metadata = {
  title: "RankHire BR - Recrutamento Inteligente",
  description: "Plataforma de triagem de currículos e busca de candidatos com IA para o mercado brasileiro.",
  metadataBase: new URL("https://app.rankhirebr.com.br"),
  openGraph: {
    title: "RankHire BR - Recrutamento Inteligente",
    description: "Plataforma de triagem de currículos e busca de candidatos com IA para o mercado brasileiro.",
    url: "https://app.rankhirebr.com.br",
    siteName: "RankHire BR",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RankHire BR - Recrutamento Inteligente",
    description: "Plataforma de triagem de currículos e busca de candidatos com IA para o mercado brasileiro.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
