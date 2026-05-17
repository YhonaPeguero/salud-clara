import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'Salud Transparente — Consulta el presupuesto de tu red de salud',
  description:
    'Datos publicos de DIPRES y MINSAL traducidos a lenguaje humano. Descubre cuanto recibio tu hospital y como va la lista de espera.',
  keywords: ['salud', 'presupuesto', 'lista de espera', 'chile', 'transparencia', 'DIPRES', 'MINSAL', 'hackathon'],
  openGraph: {
    title: 'Salud Transparente',
    description: 'Consulta el presupuesto de tu red de salud. Datos publicos, lenguaje humano.',
    type: 'website',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased bg-[#FAFBFC]`}>
      <body className="min-h-full flex flex-col bg-[var(--color-background)]">{children}</body>
    </html>
  )
}
