import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// CookieBanner removed with landing components cleanup

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
