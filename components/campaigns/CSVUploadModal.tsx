import React, { useState } from 'react'
import { X, Upload, FileText, Settings, Play, Download } from 'lucide-react'

interface CSVUploadModalProps {
  isOpen: boolean
  onClose: () => void
  accounts: any[]
}

interface AccountConfig {
  accountId: string
  accountName: string
  pageId: string
  pixelId: string
  customUrl: string
  enabled: boolean
}

export default function CSVUploadModal({ isOpen, onClose, accounts }: CSVUploadModalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [processedData, setProcessedData] = useState<any[]>([])
  const [accountConfigs, setAccountConfigs] = useState<AccountConfig[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const [step, setStep] = useState<'upload' | 'config' | 'review' | 'cloning'>('upload')

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    setIsProcessing(true)

    try {
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split('\t')
      const data = lines.slice(1).map(line => {
        const values = line.split('\t')
        const row: any = {}
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || ''
        })
        return row
      })

      setCsvData(data)
      setProcessedData(processCSVData(data))
      setStep('config')
    } catch (error) {
      console.error('Error processing CSV:', error)
      alert('Erro ao processar arquivo CSV')
    } finally {
      setIsProcessing(false)
    }
  }

  const processCSVData = (data: any[]) => {
    // Remover IDs que impedem a clonagem
    return data.map(row => {
      const processedRow = { ...row }
      
      // Remover IDs específicos
      delete processedRow['Campaign ID']
      delete processedRow['Ad Set ID']
      delete processedRow['Ad ID']
      delete processedRow['Creation Package Config ID']
      delete processedRow['Story ID']
      delete processedRow['Video ID']
      delete processedRow['Image Hash']
      delete processedRow['Instagram Platform Image Hash']
      
      return processedRow
    })
  }

  const initializeAccountConfigs = () => {
    const configs = accounts.map(account => ({
      accountId: account.id,
      accountName: account.name,
      pageId: '',
      pixelId: '',
      customUrl: '',
      enabled: true
    }))
    setAccountConfigs(configs)
  }

  const handleConfigChange = (accountId: string, field: keyof AccountConfig, value: string | boolean) => {
    setAccountConfigs(prev => prev.map(config => 
      config.accountId === accountId 
        ? { ...config, [field]: value }
        : config
    ))
  }

  const handleStartCloning = async () => {
    setIsCloning(true)
    setStep('cloning')

    try {
      const enabledConfigs = accountConfigs.filter(config => config.enabled)
      
      for (const config of enabledConfigs) {
        console.log(`🚀 Clonando para conta: ${config.accountName}`)
        
        const response = await fetch('/api/campaigns/clone-csv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            csvData: processedData,
            accountConfig: config
          })
        })

        if (response.ok) {
          const result = await response.json()
          console.log(`✅ Clonagem bem-sucedida para ${config.accountName}:`, result)
        } else {
          const error = await response.json()
          console.error(`❌ Erro na clonagem para ${config.accountName}:`, error)
        }
      }

      alert('Clonagem concluída! Verifique as contas de destino.')
      onClose()
    } catch (error) {
      console.error('Error during cloning:', error)
      alert('Erro durante a clonagem')
    } finally {
      setIsCloning(false)
    }
  }

  const downloadTemplate = () => {
    const template = [
      'Campaign Name\tCampaign Status\tCampaign Objective\tCampaign Daily Budget\tAd Set Name\tAd Set Daily Budget\tAd Name\tTitle\tBody\tLink',
      'Minha Campanha\tPAUSED\tOUTCOME_SALES\t50\tMeu Ad Set\t50\tMeu Anúncio\tTítulo do Anúncio\tDescrição do anúncio\thttps://example.com'
    ].join('\n')

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-campanha.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Clonar Campanha via CSV
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Upload do CSV da Campanha
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Faça upload do arquivo CSV exportado do Facebook Ads Manager
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={downloadTemplate}
                  className="btn-secondary flex items-center mx-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Template
                </button>
                
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Clique para selecionar arquivo CSV
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Configuration */}
        {step === 'config' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Settings className="w-5 h-5 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Configuração por Conta
              </h3>
            </div>

            <div className="space-y-4">
              {accountConfigs.map((config, index) => (
                <div key={config.accountId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {config.accountName}
                    </h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => handleConfigChange(config.accountId, 'enabled', e.target.checked)}
                        className="mr-2"
                      />
                      Ativar
                    </label>
                  </div>

                  {config.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Página do Facebook
                        </label>
                        <input
                          type="text"
                          value={config.pageId}
                          onChange={(e) => handleConfigChange(config.accountId, 'pageId', e.target.value)}
                          placeholder="ID da página"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Pixel
                        </label>
                        <input
                          type="text"
                          value={config.pixelId}
                          onChange={(e) => handleConfigChange(config.accountId, 'pixelId', e.target.value)}
                          placeholder="ID do pixel"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          URL Personalizada
                        </label>
                        <input
                          type="text"
                          value={config.customUrl}
                          onChange={(e) => handleConfigChange(config.accountId, 'customUrl', e.target.value)}
                          placeholder="https://example.com"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setStep('upload')}
                className="btn-secondary"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep('review')}
                className="btn-primary"
              >
                Revisar e Clonar
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Revisão da Clonagem
              </h3>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Resumo:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Arquivo CSV processado: {csvData.length} linhas</li>
                  <li>• Contas selecionadas: {accountConfigs.filter(c => c.enabled).length}</li>
                  <li>• IDs removidos automaticamente</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Contas de Destino:</h4>
                {accountConfigs.filter(c => c.enabled).map(config => (
                  <div key={config.accountId} className="text-sm text-gray-600 dark:text-gray-400">
                    • {config.accountName} - Página: {config.pageId || 'Não definida'}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setStep('config')}
                className="btn-secondary"
              >
                Voltar
              </button>
              <button
                onClick={handleStartCloning}
                className="btn-primary flex items-center"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Clonagem
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Cloning */}
        {step === 'cloning' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Clonando Campanhas...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Aguarde enquanto processamos as campanhas para cada conta.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 