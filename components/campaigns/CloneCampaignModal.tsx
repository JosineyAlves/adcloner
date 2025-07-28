'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, AlertCircle, Loader2 } from 'lucide-react'
import { FacebookAccount, Campaign } from '@/lib/types'
import toast from 'react-hot-toast'

interface CloneCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  campaign: Campaign | null
  accounts: FacebookAccount[]
}

interface CloneResult {
  targetAdAccountId: string
  success: boolean
  campaign?: any
  adSet?: any
  error?: string
}

export default function CloneCampaignModal({ 
  isOpen, 
  onClose, 
  campaign, 
  accounts 
}: CloneCampaignModalProps) {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [isCloning, setIsCloning] = useState<boolean>(false)
  const [cloneResults, setCloneResults] = useState<CloneResult[]>([])

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  const handleClone = async () => {
    if (!campaign || selectedAccounts.length === 0) {
      toast.error('Selecione pelo menos uma conta de destino')
      return
    }

    setIsCloning(true)
    setCloneResults([])

    try {
      // Clonar para cada conta selecionada
      const results: CloneResult[] = []
      
      for (const accountId of selectedAccounts) {
        try {
          const response = await fetch('/api/campaigns/clones', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              sourceCampaignId: campaign.id,
              targetAccountId: accountId,
              campaignName: `${campaign.name} - Clone`
            })
          })

          const data = await response.json()

          if (data.success) {
            results.push({
              targetAdAccountId: accountId,
              success: true,
              campaign: data.clone
            })
          } else {
            results.push({
              targetAdAccountId: accountId,
              success: false,
              error: data.error || 'Erro desconhecido'
            })
          }
        } catch (error) {
          results.push({
            targetAdAccountId: accountId,
            success: false,
            error: 'Erro de rede'
          })
        }
      }

      setCloneResults(results)
      const successCount = results.filter(r => r.success).length
      toast.success(`Campanha clonada para ${successCount} de ${selectedAccounts.length} contas`)
    } catch (error) {
      console.error('Clone error:', error)
      toast.error('Erro ao clonar campanha')
    } finally {
      setIsCloning(false)
    }
  }

  const handleClose = () => {
    setSelectedAccounts([])
    setCloneResults([])
    onClose()
  }

  if (!campaign) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                  <Copy className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Clonar Campanha
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {campaign.name}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Campaign Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Informações da Campanha
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Nome:</span>
                    <p className="font-medium">{campaign.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Objetivo:</span>
                    <p className="font-medium">{campaign.objective}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Orçamento:</span>
                    <p className="font-medium">${campaign.budget.amount}/dia</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <p className="font-medium">{campaign.status}</p>
                  </div>
                </div>
              </div>

              {/* Account Selection */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  Selecione as contas de destino
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {accounts.map((account) => (
                    <label
                      key={account.id}
                      className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAccounts.includes(account.id)}
                        onChange={() => handleAccountToggle(account.id)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {account.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {account.businessManagerName}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        account.status === 'active' 
                          ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                          : 'text-red-600 bg-red-50 dark:bg-red-900/20'
                      }`}>
                        {account.status}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clone Results */}
              {cloneResults.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                    Resultados da Clonagem
                  </h3>
                  <div className="space-y-2">
                    {cloneResults.map((result, index) => {
                      const account = accounts.find(a => a.id === result.targetAdAccountId)
                      return (
                        <div
                          key={index}
                          className={`flex items-center space-x-3 p-3 rounded-lg ${
                            result.success
                              ? 'bg-green-50 dark:bg-green-900/20'
                              : 'bg-red-50 dark:bg-red-900/20'
                          }`}
                        >
                          {result.success ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {account?.name || result.targetAdAccountId}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {result.success 
                                ? 'Campanha clonada com sucesso'
                                : result.error || 'Erro ao clonar'
                              }
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleClose}
                  className="flex-1 btn-secondary"
                  disabled={isCloning}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClone}
                  disabled={isCloning || selectedAccounts.length === 0}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2"
                >
                  {isCloning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Clonando...</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Clonar Campanha</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 