import type { Metadata, Viewport } from 'next'
import { Jura } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import FacebookSDK from '@/components/providers/FacebookSDK'
import { AppProvider } from '@/contexts/AppContext'
import { DateProvider } from '@/contexts/DateContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

// Jura é a fonte principal de toda a interface (design system do vmetrics) — ver
// app/globals.css para os demais tokens visuais (cor de marca, radius, sombras).
const jura = Jura({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'vmetrics',
  description: 'Gerencie e clone campanhas do Meta Ads em múltiplas contas e Business Managers',
}

// Explícito em vez de depender só do default implícito do App Router — garante
// width=device-width em qualquer navegador/ambiente, essencial pra responsividade mobile
// (sem isso, alguns navegadores mobile renderizam a página como se fosse desktop e dão zoom out).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

// Aplica a classe `dark` (tailwind.config.js: darkMode: 'class') ANTES da hidratação — roda
// como script bloqueante no <head>, então o navegador já pinta a página no tema certo desde o
// primeiro frame, sem o "flash" de claro→escuro que apareceria se essa decisão só rodasse depois
// que o React monta (ver contexts/ThemeContext.tsx, que assume esse estado a partir daí).
// Prioridade: escolha salva > preferência do sistema operacional > claro.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('vmetrics:theme');
    var theme = stored === 'dark' || stored === 'light'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning: o script acima pode alterar a classe do <html> antes do React
    // hidratar (adicionando `dark`), o que gera um mismatch client/server só nesse atributo —
    // é o padrão recomendado para esse tipo de script de tema (evita o warning sem esconder
    // mismatches de verdade, que continuam aparecendo em qualquer outro elemento).
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${jura.className} h-full`}>
        <ThemeProvider>
          <AppProvider>
            {/* Estado do drawer mobile da Sidebar (ver contexts/SidebarContext.tsx) — precisa
                envolver toda a árvore porque Sidebar e PageHeader são componentes irmãos,
                renderizados independentemente em cada página (não há layout aninhado por rota). */}
            <SidebarProvider>
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
            </SidebarProvider>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
