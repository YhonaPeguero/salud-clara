import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'Salud Transparente Chile — ¿Llegó la plata a tu hospital?',
  description:
    'Conecta el presupuesto público de salud (DIPRES) con las listas de espera de tu hospital (MINSAL). Datos públicos, en lenguaje humano.',
  keywords: ['salud', 'presupuesto', 'lista de espera', 'chile', 'transparencia', 'DIPRES', 'MINSAL'],
  openGraph: {
    title: 'Salud Transparente Chile',
    description: '¿Cuánto presupuesto recibió la red de salud de tu hospital? ¿Cómo evolucionó la lista de espera?',
    type: 'website',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
