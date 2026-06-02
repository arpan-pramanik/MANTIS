import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jbMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jb-mono' })

export const metadata: Metadata = {
  title: 'MANTIS | Enterprise API Protection',
  description: 'Mitigation of API-based Nuisances using Threat Intelligence System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jbMono.variable} font-sans antialiased min-h-screen bg-[#0a0e1a] text-[#f0f4ff]`}>
        <div className="noise-overlay"></div>
        {children}
      </body>
    </html>
  )
}
