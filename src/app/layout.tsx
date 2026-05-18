import type { Metadata } from 'next'
import { Geist, Playfair_Display } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'K-milla — Datos públicos de salud chilena, conectados',
  description:
    'Presupuesto recibido (DIPRES) y personas en lista de espera (MINSAL) de tu Servicio de Salud. En una sola búsqueda, en lenguaje simple.',
  keywords: ['salud', 'presupuesto', 'lista de espera', 'chile', 'transparencia', 'DIPRES', 'MINSAL', 'K-milla'],
  openGraph: {
    title: 'K-milla',
    description: 'Presupuesto y lista de espera de tu Servicio de Salud, conectados. Una sola búsqueda.',
    type: 'website',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geist.variable} ${playfair.variable} h-full antialiased bg-[#FAFBFC]`}>
      <body className="min-h-full flex flex-col bg-[var(--color-background)]">{children}</body>
    </html>
  )
}
