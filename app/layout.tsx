import type { Metadata, Viewport } from 'next'
import { Jura } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import FacebookSDK from '@/components/providers/FacebookSDK'
import VmetricsTooltip from '@/components/providers/VmetricsTooltip'
import { AppProvider } from '@/contexts/AppContext'
import { DateProvider } from '@/contexts/DateContext'
import { SidebarProvider } from '@/contexts/SidebarContext'

// Jura é a fonte principal de toda a interface (design system do vmetrics) — ver
// app/globals.css para os demais tokens visuais (cor de marca, radius, sombras).
const jura = Jura({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'vmetrics',
  description: 'Acompanhe métricas e gerencie campanhas do Meta Ads em múltiplas contas',
  // PWA (instalar na tela inicial do celular e receber notificações de venda — ver
  // app/notificacoes/page.tsx). No iPhone o push só funciona com o app adicionado pelo Safari.
  manifest: '/manifest.webmanifest',
  icons: { apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'vmetrics', statusBarStyle: 'default' },
}

// Explícito em vez de depender só do default implícito do App Router — garante
// width=device-width em qualquer navegador/ambiente, essencial pra responsividade mobile
// (sem isso, alguns navegadores mobile renderizam a página como se fosse desktop e dão zoom out).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#CEFF00',
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
          {/* Estado do drawer mobile da Sidebar (ver contexts/SidebarContext.tsx) — precisa
              envolver toda a árvore porque Sidebar e PageHeader são componentes irmãos,
              renderizados independentemente em cada página (não há layout aninhado por rota). */}
          <SidebarProvider>
            <FacebookSDK />
            <VmetricsTooltip />
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
          </SidebarProvider>
        </AppProvider>
      </body>
    </html>
  )
}
