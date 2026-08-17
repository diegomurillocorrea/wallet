import type { Metadata } from "next"
import { Archivo_Black, Geist_Mono, Poppins } from "next/font/google"
import { MotionProvider } from "@/components/motion-provider"
import "./globals.css"

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Wally · Finanzas personales",
  description: "Registro de gastos e ingresos, categorías, presupuestos y resumen mensual.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es-SV"
      className={`${poppins.variable} ${archivoBlack.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-forest font-sans text-sand">
        <div className="app-ambient" aria-hidden="true" />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  )
}
