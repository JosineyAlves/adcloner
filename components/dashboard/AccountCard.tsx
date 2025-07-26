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
          <button className="flex-1 btn-secondary text-sm py-2">
            Ver detalhes
          </button>
          <button className="flex-1 btn-primary text-sm py-2">
            Clonar campanha
          </button>
        </div>
      </div>
    </div>
  )
} 