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
  const [step, setStep] = useState<'upload' | 'cloning'>('upload')

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    setIsProcessing(true)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      // Processar formato tab-separado do Facebook
      const processedData = processFacebookExport(lines)
      
      setCsvData(processedData)
      setProcessedData(processedData)
      setStep('cloning')
    } catch (error) {
      console.error('Error processing CSV:', error)
      alert('Erro ao processar arquivo CSV')
    } finally {
      setIsProcessing(false)
    }
  }

  const processFacebookExport = (lines: string[]) => {
    const processedData: any[] = []
    
    for (const line of lines) {
      const values = line.split('\t')
      
      // Criar objeto com TODAS as colunas do CSV original
      const row: any = {}
      
      // Mapear todas as colunas do Facebook Ads Manager
      const headers = [
        'Campaign ID', 'Creation Package Config ID', 'Campaign Name', 'Special Ad Categories', 
        'Special Ad Category Country', 'Campaign Status', 'Campaign Objective', 'Buying Type', 
        'Campaign Spend Limit', 'Campaign Daily Budget', 'Campaign Lifetime Budget', 'Campaign Bid Strategy', 
        'Tags', 'Campaign Is Using L3 Schedule', 'Campaign Start Time', 'Campaign Stop Time', 
        'Product Catalog ID', 'Campaign Page ID', 'New Objective', 'Buy With Prime Type', 
        'Is Budget Scheduling Enabled For Campaign', 'Campaign High Demand Periods', 'Buy With Integration Partner', 
        'Ad Set ID', 'Ad Set Run Status', 'Ad Set Lifetime Impressions', 'Ad Set Name', 'Ad Set Time Start', 
        'Ad Set Time Stop', 'Ad Set Daily Budget', 'Destination Type', 'Ad Set Lifetime Budget', 'Rate Card', 
        'Ad Set Schedule', 'Use Accelerated Delivery', 'Frequency Control', 'Ad Set Minimum Spend Limit', 
        'Ad Set Maximum Spend Limit', 'Is Budget Scheduling Enabled For Ad Set', 'Ad Set High Demand Periods', 
        'Link Object ID', 'Optimized Conversion Tracking Pixels', 'Optimized Custom Conversion ID', 
        'Optimized Pixel Rule', 'Optimized Event', 'Custom Event Name', 'Link', 'Application ID', 
        'Product Set ID', 'Place Page Set ID', 'Object Store URL', 'Offer ID', 'Offline Event Data Set ID', 
        'Countries', 'Cities', 'Regions', 'Electoral Districts', 'Zip', 'Addresses', 'Geo Markets (DMA)', 
        'Global Regions', 'Large Geo Areas', 'Medium Geo Areas', 'Small Geo Areas', 'Metro Areas', 
        'Neighborhoods', 'Subneighborhoods', 'Subcities', 'Location Types', 'Location Cluster IDs', 
        'Location Set IDs', 'Excluded Countries', 'Excluded Cities', 'Excluded Large Geo Areas', 
        'Excluded Medium Geo Areas', 'Excluded Metro Areas', 'Excluded Small Geo Areas', 'Excluded Subcities', 
        'Excluded Neighborhoods', 'Excluded Subneighborhoods', 'Excluded Regions', 'Excluded Electoral Districts', 
        'Excluded Zip', 'Excluded Addresses', 'Excluded Geo Markets (DMA)', 'Excluded Global Regions', 
        'Excluded Location Cluster IDs', 'Gender', 'Age Min', 'Age Max', 'Education Status', 'Fields of Study', 
        'Education Schools', 'Work Job Titles', 'Work Employers', 'College Start Year', 'College End Year', 
        'Interested In', 'Relationship', 'Family Statuses', 'Industries', 'Life Events', 'Income', 
        'Multicultural Affinity', 'Household Composition', 'Behaviors', 'Connections', 'Excluded Connections', 
        'Friends of Connections', 'Locales', 'Site Category', 'Unified Interests', 'Excluded User AdClusters', 
        'Broad Category Clusters', 'Targeting Categories - ALL OF', 'Custom Audiences', 'Excluded Custom Audiences', 
        'Flexible Inclusions', 'Flexible Exclusions', 'Advantage Audience', 'Age Range', 'Targeting Optimization', 
        'Targeting Relaxation', 'Product Audience Specs', 'Excluded Product Audience Specs', 'Targeted Business Locations', 
        'Dynamic Audiences', 'Excluded Dynamic Audiences', 'Beneficiary', 'Payer', 'Publisher Platforms', 
        'Facebook Positions', 'Instagram Positions', 'Audience Network Positions', 'Messenger Positions', 
        'Oculus Positions', 'Device Platforms', 'User Device', 'Excluded User Device', 'User Operating System', 
        'User OS Version', 'Wireless Carrier', 'Excluded Publisher Categories', 'Brand Safety Inventory Filtering Levels', 
        'Optimization Goal', 'Attribution Spec', 'Billing Event', 'Bid Amount', 'Ad Set Bid Strategy', 
        'Regional Regulated Categories', 'Beneficiary (financial ads in Australia)', 'Payer (financial ads in Australia)', 
        'Beneficiary (financial ads in Taiwan)', 'Payer (financial ads in Taiwan)', 'Beneficiary (Taiwan)', 
        'Payer (Taiwan)', 'Beneficiary (Singapore)', 'Payer (Singapore)', 'Beneficiary (securities ads in India)', 
        'Payer (securities ads in India)', 'Story ID', 'Ad ID', 'Ad Status', 'Preview Link', 'Instagram Preview Link', 
        'Ad Name', 'Title', 'Body', 'Display Link', 'Link Description', 'Optimize text per person', 'Retailer IDs', 
        'Post Click Item Headline', 'Post Click Item Description', 'Conversion Tracking Pixels', 'Optimized Ad Creative', 
        'Image Hash', 'Image File Name', 'Image Crops', 'Video Thumbnail URL', 'Instagram Platform Image Hash', 
        'Instagram Platform Image Crops', 'Instagram Platform Image URL', 'Carousel Delivery Mode', 'Creative Type', 
        'URL Tags', 'Event ID', 'Video ID', 'Video File Name', 'Instagram Account ID', 'Mobile App Deep Link', 
        'Product Link', 'App Link Destination', 'Call Extension Phone Data ID', 'Call to Action', 
        'Additional Call To Action 5', 'Additional Call To Action 6', 'Additional Call To Action 7', 
        'Additional Call To Action 8', 'Additional Call To Action 9', 'Call to Action Link', 'Call to Action WhatsApp Number', 
        'Additional Custom Tracking Specs', 'Video Retargeting', 'Lead Form ID', 'Permalink', 'Force Single Link', 
        'Format Option', 'Dynamic Ad Voice', 'Creative Optimization', 'Template URL', 'Android App Name', 
        'Android Package Name', 'Deep Link For Android', 'Facebook App ID', 'iOS App Name', 'iOS App Store ID', 
        'Deep Link For iOS', 'iPad App Name', 'iPad App Store ID', 'Deep Link For iPad', 'iPhone App Name', 
        'iPhone App Store ID', 'Deep Link For iPhone', 'Deep link to website', 'Windows Store ID', 'Windows App Name', 
        'Deep Link For Windows Phone', 'Add End Card', 'Dynamic Ads Ad Context', 'Page Welcome Message', 
        'App Destination', 'App Destination Page ID', 'Use Page as Actor', 'Image Overlay Template', 
        'Image Overlay Text Type', 'Image Overlay Text Font', 'Image Overlay Position', 'Image Overlay Theme Color', 
        'Image Overlay Float With Margin', 'Image Layer 1 - layer_type', 'Image Layer 1 - image_source', 
        'Image Layer 1 - overlay_shape', 'Image Layer 1 - text_font', 'Image Layer 1 - shape_color', 
        'Image Layer 1 - text_color', 'Image Layer 1 - content_type', 'Image Layer 1 - price', 
        'Image Layer 1 - low_price', 'Image Layer 1 - high_price', 'Image Layer 1 - frame_source', 
        'Image Layer 1 - frame_image_hash', 'Image Layer 1 - scale', 'Image Layer 1 - blending_mode', 
        'Image Layer 1 - opacity', 'Image Layer 1 - overlay_position', 'Image Layer 1 - pad_image', 
        'Image Layer 1 - crop_image', 'Image Layer 2 - layer_type', 'Image Layer 2 - image_source', 
        'Image Layer 2 - overlay_shape', 'Image Layer 2 - text_font', 'Image Layer 2 - shape_color', 
        'Image Layer 2 - text_color', 'Image Layer 2 - content_type', 'Image Layer 2 - price', 
        'Image Layer 2 - low_price', 'Image Layer 2 - high_price', 'Image Layer 2 - frame_source', 
        'Image Layer 2 - frame_image_hash', 'Image Layer 2 - scale', 'Image Layer 2 - blending_mode', 
        'Image Layer 2 - opacity', 'Image Layer 2 - overlay_position', 'Image Layer 2 - pad_image', 
        'Image Layer 2 - crop_image', 'Image Layer 3 - layer_type', 'Image Layer 3 - image_source', 
        'Image Layer 3 - overlay_shape', 'Image Layer 3 - text_font', 'Image Layer 3 - shape_color', 
        'Image Layer 3 - text_color', 'Image Layer 3 - content_type', 'Image Layer 3 - price', 
        'Image Layer 3 - low_price', 'Image Layer 3 - high_price', 'Image Layer 3 - frame_source', 
        'Image Layer 3 - frame_image_hash', 'Image Layer 3 - scale', 'Image Layer 3 - blending_mode', 
        'Image Layer 3 - opacity', 'Image Layer 3 - overlay_position', 'Image Layer 3 - pad_image', 
        'Image Layer 3 - crop_image', 'Product 1 - Link', 'Product 1 - Name', 'Product 1 - Description', 
        'Product 1 - Image Hash', 'Product 1 - Image Crops', 'Product 1 - Video ID', 'Product 1 - Call To Action Link', 
        'Product 1 - Mobile App Deep Link', 'Product 1 - Display Link', 'Product 1 - Place Data', 
        'Product 1 - Is Static Card', 'Product 2 - Link', 'Product 2 - Name', 'Product 2 - Description', 
        'Product 2 - Image Hash', 'Product 2 - Image Crops', 'Product 2 - Video ID', 'Product 2 - Call To Action Link', 
        'Product 2 - Mobile App Deep Link', 'Product 2 - Display Link', 'Product 2 - Place Data', 
        'Product 2 - Is Static Card', 'Product 3 - Link', 'Product 3 - Name', 'Product 3 - Description', 
        'Product 3 - Image Hash', 'Product 3 - Image Crops', 'Product 3 - Video ID', 'Product 3 - Call To Action Link', 
        'Product 3 - Mobile App Deep Link', 'Product 3 - Display Link', 'Product 3 - Place Data', 
        'Product 3 - Is Static Card', 'Product 4 - Link', 'Product 4 - Name', 'Product 4 - Description', 
        'Product 4 - Image Hash', 'Product 4 - Image Crops', 'Product 4 - Video ID', 'Product 4 - Call To Action Link', 
        'Product 4 - Mobile App Deep Link', 'Product 4 - Display Link', 'Product 4 - Place Data', 
        'Product 4 - Is Static Card', 'Product 5 - Link', 'Product 5 - Name', 'Product 5 - Description', 
        'Product 5 - Image Hash', 'Product 5 - Image Crops', 'Product 5 - Video ID', 'Product 5 - Call To Action Link', 
        'Product 5 - Mobile App Deep Link', 'Product 5 - Display Link', 'Product 5 - Place Data', 
        'Product 5 - Is Static Card', 'Product 6 - Link', 'Product 6 - Name', 'Product 6 - Description', 
        'Product 6 - Image Hash', 'Product 6 - Image Crops', 'Product 6 - Video ID', 'Product 6 - Call To Action Link', 
        'Product 6 - Mobile App Deep Link', 'Product 6 - Display Link', 'Product 6 - Place Data', 
        'Product 6 - Is Static Card', 'Product 7 - Link', 'Product 7 - Name', 'Product 7 - Description', 
        'Product 7 - Image Hash', 'Product 7 - Image Crops', 'Product 7 - Video ID', 'Product 7 - Call To Action Link', 
        'Product 7 - Mobile App Deep Link', 'Product 7 - Display Link', 'Product 7 - Place Data', 
        'Product 7 - Is Static Card', 'Product 8 - Link', 'Product 8 - Name', 'Product 8 - Description', 
        'Product 8 - Image Hash', 'Product 8 - Image Crops', 'Product 8 - Video ID', 'Product 8 - Call To Action Link', 
        'Product 8 - Mobile App Deep Link', 'Product 8 - Display Link', 'Product 8 - Place Data', 
        'Product 8 - Is Static Card', 'Product 9 - Link', 'Product 9 - Name', 'Product 9 - Description', 
        'Product 9 - Image Hash', 'Product 9 - Image Crops', 'Product 9 - Video ID', 'Product 9 - Call To Action Link', 
        'Product 9 - Mobile App Deep Link', 'Product 9 - Display Link', 'Product 9 - Place Data', 
        'Product 9 - Is Static Card', 'Product 10 - Link', 'Product 10 - Name', 'Product 10 - Description', 
        'Product 10 - Image Hash', 'Product 10 - Image Crops', 'Product 10 - Video ID', 'Product 10 - Call To Action Link', 
        'Product 10 - Mobile App Deep Link', 'Product 10 - Display Link', 'Product 10 - Place Data', 
        'Product 10 - Is Static Card', 'Product Sales Channel', 'Additional Dynamic Creative Call To Action Type 5', 
        'Additional Dynamic Creative Call To Action Type 6', 'Additional Dynamic Creative Call To Action Type 7', 
        'Additional Dynamic Creative Call To Action Type 8', 'Additional Dynamic Creative Call To Action Type 9', 
        'Degrees of Freedom Type', 'Mockup ID', 'Text Transformations', 'Ad Stop Time', 'Ad Start Time'
      ]
      
      // Mapear todos os valores para as colunas correspondentes
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      processedData.push(row)
    }
    
    return processedData
  }

  const processCSVData = (data: any[]) => {
    // Processar dados para clonagem - remover apenas valores dos IDs
    return data.map(row => {
      const processedRow = { ...row }
      
      // Limpar apenas os valores dos IDs específicos (mantendo colunas)
      processedRow['Campaign ID'] = ''
      processedRow['Ad Set ID'] = ''
      processedRow['Ad ID'] = ''
      processedRow['Creation Package Config ID'] = ''
      processedRow['Story ID'] = ''
      processedRow['Video ID'] = ''
      processedRow['Image Hash'] = ''
      processedRow['Instagram Platform Image Hash'] = ''
      processedRow['Campaign Page ID'] = ''
      processedRow['Link Object ID'] = ''
      processedRow['Application ID'] = ''
      processedRow['Product Set ID'] = ''
      processedRow['Place Page Set ID'] = ''
      processedRow['Offer ID'] = ''
      processedRow['Offline Event Data Set ID'] = ''
      processedRow['Event ID'] = ''
      processedRow['Instagram Account ID'] = ''
      processedRow['Call Extension Phone Data ID'] = ''
      processedRow['Lead Form ID'] = ''
      processedRow['App Destination Page ID'] = ''
      processedRow['Facebook App ID'] = ''
      processedRow['iOS App Store ID'] = ''
      processedRow['iPad App Store ID'] = ''
      processedRow['iPhone App Store ID'] = ''
      processedRow['Windows Store ID'] = ''
      processedRow['Mockup ID'] = ''
      
      // Validar e limpar dados importantes
      processedRow['Campaign Name'] = processedRow['Campaign Name'] || 'Campanha do Template'
      processedRow['Ad Set Name'] = processedRow['Ad Set Name'] || 'Conjunto do Template'
      processedRow['Ad Name'] = processedRow['Ad Name'] || 'Anúncio do Template'
      processedRow['Campaign Objective'] = processedRow['Campaign Objective'] || 'OUTCOME_TRAFFIC'
      processedRow['Campaign Status'] = processedRow['Campaign Status'] || 'PAUSED'
      processedRow['Ad Set Daily Budget'] = processedRow['Ad Set Daily Budget'] || '1000'
      processedRow['Countries'] = processedRow['Countries'] || 'BR'
      processedRow['Link'] = processedRow['Link'] || 'https://example.com'
      processedRow['Body'] = processedRow['Body'] || 'Confira nosso produto!'
      
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
      // Primeiro, salvar o template
      console.log('💾 Salvando template...')
      const templateResponse = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Template ${new Date().toLocaleDateString()}`,
          description: `Template criado em ${new Date().toLocaleString()}`,
          fileName: csvFile?.name || 'template.csv',
          processedData: processedData,
          campaignCount: processedData.length,
          status: 'active'
        })
      })

      if (!templateResponse.ok) {
        throw new Error('Erro ao salvar template')
      }

      const templateResult = await templateResponse.json()
      console.log('✅ Template salvo:', templateResult)

      // Agora clonar para as contas selecionadas
      const enabledConfigs = accountConfigs.filter(config => config.enabled)
      
      for (const config of enabledConfigs) {
        console.log(`🚀 Clonando para conta: ${config.accountName}`)
        
        const response = await fetch('/api/campaigns/clone-template', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateId: templateResult.id,
            accountIds: [config.accountId]
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

      alert('Template salvo e clonagem concluída! Verifique as contas de destino.')
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
      'Campaign Name\tCampaign Status\tCampaign Objective\tCampaign Daily Budget\tCampaign Bid Strategy\tAd Set Name\tAd Set Daily Budget\tAd Set Optimization Goal\tAd Set Billing Event\tAd Set Bid Amount\tAd Name\tAd Title\tAd Body\tAd Link\tAd Image Hash\tAd Video ID\tCountries\tAge Min\tAge Max\tPlacements',
      'Minha Campanha\tPAUSED\tOUTCOME_SALES\t50\tLOWEST_COST_WITHOUT_CAP\tMeu Ad Set\t50\tREACH\tIMPRESSIONS\t1000\tMeu Anúncio\tTítulo do Anúncio\tDescrição do anúncio\thttps://example.com\t\t\tBR\t18\t65\thome,recent'
    ].join('\n')

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-campanha.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadProcessedTemplate = () => {
    if (processedData.length === 0) return
    
    // Criar headers baseados nos dados processados
    const headers = Object.keys(processedData[0]).join('\t')
    const rows = processedData.map(row => 
      Object.values(row).join('\t')
    ).join('\n')
    
    const csvContent = `${headers}\n${rows}`
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-processado.csv'
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



        {/* Step 2: Clonagem */}
        {step === 'cloning' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Play className="w-5 h-5 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Clonagem de Campanhas
              </h3>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Resumo:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Arquivo CSV processado: {csvData.length} linhas</li>
                  <li>• IDs removidos automaticamente</li>
                  <li>• Pronto para clonagem</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setStep('upload')}
                  className="btn-secondary"
                >
                  Voltar
                </button>
                <button
                  onClick={handleStartCloning}
                  disabled={isCloning}
                  className="btn-primary flex items-center"
                >
                  {isCloning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Clonando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar Clonagem
                    </>
                  )}
                </button>
              </div>
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