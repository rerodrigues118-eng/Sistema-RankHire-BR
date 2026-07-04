import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel Administrativo - RankHire",
  description: "Sistema de administração RankHire",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
