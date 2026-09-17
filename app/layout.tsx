import type { Metadata } from 'next'
import { Jura } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import FacebookSDK from '@/components/providers/FacebookSDK'
import { AppProvider } from '@/contexts/AppContext'
import { DateProvider } from '@/contexts/DateContext'

// Jura é a fonte principal de toda a interface (design system do vmetrics) — ver
// app/globals.css para os demais tokens visuais (cor de marca, radius, sombras).
const jura = Jura({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'vmetrics',
  description: 'Gerencie e clone campanhas do Meta Ads em múltiplas contas e Business Managers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${jura.className} h-full`}>
        <AppProvider>
          <FacebookSDK />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </AppProvider>
      </body>
    </html>
  )
} 