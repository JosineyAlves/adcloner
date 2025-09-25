'use client'

import { useState } from 'react'
import { Folder, Grid3X3, FileText, Users } from 'lucide-react'

export type TabType = 'accounts' | 'campaigns' | 'adsets' | 'ads'

interface DashboardTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs = [
  {
    id: 'accounts' as TabType,
    label: 'Contas',
    icon: Users,
    description: 'Gerenciar contas de anúncios'
  },
  {
    id: 'campaigns' as TabType,
    label: 'Campanhas',
    icon: Folder,
    description: 'Visualizar e gerenciar campanhas'
  },
  {
    id: 'adsets' as TabType,
    label: 'Conjuntos de anúncios',
    icon: Grid3X3,
    description: 'Gerenciar conjuntos de anúncios'
  },
  {
    id: 'ads' as TabType,
    label: 'Anúncios',
    icon: FileText,
    description: 'Visualizar e editar anúncios'
  }
]

export default function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center space-x-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors duration-200
                  ${isActive 
                    ? 'border-primary-600 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon 
                  className={`
                    w-5 h-5 transition-colors duration-200
                    ${isActive ? 'text-primary-600' : 'text-gray-400'}
                  `} 
                />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
