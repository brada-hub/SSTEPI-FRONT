import type { Metadata } from "next";
import { Outfit, DM_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  preload: false,
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "SSTEPI - Portal Clínico y Administrativo",
  description: "Sistema de Salud Tecnológico de Especialidades e Internación",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${dmMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

