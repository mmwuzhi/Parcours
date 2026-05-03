import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Parcours',
  description: 'Job application tracker & interview question bank',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </Providers>
      </body>
    </html>
  )
}
