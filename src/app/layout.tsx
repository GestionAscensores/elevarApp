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
  title: "Elevar App",
  description: "Sistema de gestión para mantenimiento de ascensores",
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
