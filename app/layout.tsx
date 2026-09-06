import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-context";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SolarSight — Plataforma Preditiva de Geração Fotovoltaica (TCC FAESA)",
  description:
    "Plataforma preditiva stateless para dimensionamento e estimativa de geração fotovoltaica no Espírito Santo com modelo de transposição Liu-Jordan, Google Solar API e Marco Legal GD (Lei 14.300/2022).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${outfit.variable} ${geistMono.variable} h-full antialiased light`}
    >
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-900 font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}


