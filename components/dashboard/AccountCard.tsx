'use client'

import { FacebookAccount } from '@/lib/types'
import { getStatusColor, getStatusIcon } from '@/lib/utils'
import { Facebook, Building2, Users, BarChart3 } from 'lucide-react'

interface AccountCardProps {
  account: FacebookAccount
}

export default function AccountCard({ account }: AccountCardProps) {
  return (
    <div className="card p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Facebook className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {account.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ID: {account.id}
            </p>
          </div>
        </div>
        
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
          {getStatusIcon(account.status)} {account.status}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Building2 className="w-4 h-4" />
          <span>{account.businessManagerName}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {account.pages.length} páginas
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {account.pixels.length} pixels
              </span>
            </div>
          </div>
          
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            account.tokenStatus === 'valid' 
              ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
              : 'text-red-600 bg-red-50 dark:bg-red-900/20'
          }`}>
            {account.tokenStatus === 'valid' ? '✓ Token válido' : '✗ Token expirado'}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              const details = `
📊 Detalhes da Conta:
• Nome: ${account.name}
• ID: ${account.id}
• Business Manager: ${account.businessManagerName}
• Status: ${account.status}
• Token: ${account.tokenStatus === 'valid' ? '✅ Válido' : '❌ Inválido'}
• Páginas: ${account.pages.length}
• Pixels: ${account.pixels.length}

📋 Páginas:
${account.pages.map(page => `• ${page.name} (${page.category})`).join('\n')}

🎯 Pixels:
${account.pixels.map(pixel => `• ${pixel.name} (${pixel.code})`).join('\n')}
              `
              alert(details)
            }}
            className="flex-1 btn-secondary text-sm py-2"
          >
            Ver detalhes
          </button>
          <button 
            onClick={() => {
              const options = [
                {
                  name: 'Facebook Ads Manager',
                  url: `https://business.facebook.com/adsmanager/manage/accounts?act=${account.id}`,
                  description: 'Gerenciar campanhas e anúncios'
                },
                {
                  name: 'Business Manager',
                  url: `https://business.facebook.com/settings`,
                  description: 'Configurações do Business Manager'
                },
                {
                  name: 'Páginas do Facebook',
                  url: `https://business.facebook.com/pages`,
                  description: 'Gerenciar páginas conectadas'
                },
                {
                  name: 'Pixels do Facebook',
                  url: `https://business.facebook.com/events_manager2/list/pixel/${account.businessManagerId}`,
                  description: 'Configurar pixels de conversão'
                }
              ]

              const option = prompt(`
🎯 Escolha uma opção de gerenciamento:

1. Facebook Ads Manager - Gerenciar campanhas e anúncios
2. Business Manager - Configurações do Business Manager  
3. Páginas do Facebook - Gerenciar páginas conectadas
4. Pixels do Facebook - Configurar pixels de conversão

Digite o número da opção (1-4):
              `)

              if (option) {
                const selectedIndex = parseInt(option) - 1
                if (selectedIndex >= 0 && selectedIndex < options.length) {
                  const selectedOption = options[selectedIndex]
                  window.open(selectedOption.url, '_blank')
                } else {
                  alert('Opção inválida')
                }
              }
            }}
            className="flex-1 btn-primary text-sm py-2"
          >
            Gerenciar
          </button>
        </div>
      </div>
    </div>
  )
} 