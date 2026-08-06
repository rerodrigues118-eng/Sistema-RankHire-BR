import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

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
    <html lang="pt-BR" className="h-full antialiased">
      {/* Anti-flash script: applies saved theme class before first paint */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('rankhire-theme');if(t==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-200">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
