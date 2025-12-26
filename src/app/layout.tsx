import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

import { Toaster } from "@/components/ui/sonner"
import SessionProvider from "@/components/providers/session-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { PaletteProvider } from "@/components/providers/palette-provider"

export const metadata: Metadata = {
  title: "Elevar App | Software para Mantenimiento de Ascensores y Abonos",
  description: "La plataforma #1 para empresas de ascensores en Argentina. Bitácora Digital QR, Geolocalización de Técnicos, Facturación de Abonos AFIP y Gestión de Repuestos.",
  keywords: [
    "Software Mantenimiento Ascensores",
    "App Ascensores Argentina",
    "Gestión de Abonos Mensuales",
    "Bitácora Digital QR Ascensores",
    "Conservadores de Elevadores",
    "Representante Técnico Ascensores",
    "Facturación Electrónica AFIP",
    "Control de Rutas Técnicos",
    "Libro de Inspección Digital"
  ],
  authors: [{ name: "Elevar App" }],
  openGraph: {
    title: "Elevar App | Modernizá tu Empresa de Ascensores",
    description: "Digitalizá tus rutas, abonos y reportes técnicos con la App líder del mercado.",
    type: "website",
    locale: "es_AR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.className} ${inter.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <PaletteProvider>
            <SessionProvider>
              {children}
              <Toaster />
            </SessionProvider>
          </PaletteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
