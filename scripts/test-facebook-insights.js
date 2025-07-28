const https = require('https')

async function testFacebookInsightsAPI() {
  console.log('🔍 Testando Facebook Insights API...')
  
  try {
    // Simular uma chamada para a API do Facebook (sem token válido para ver a estrutura de erro)
    const mockAccountId = 'act_864904627876681'
    const mockToken = 'invalid_token'
    
    const url = `https://graph.facebook.com/v23.0/${mockAccountId}/insights?fields=campaign_id,campaign_name,impressions,clicks,spend,reach,frequency,cpm,cpc,ctr&date_preset=last_7d&level=campaign&access_token=${mockToken}`
    
    console.log('🔍 URL da requisição:', url.replace(mockToken, '***'))
    
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        console.log('📊 Status da resposta Facebook:', res.statusCode)
        console.log('📊 Headers da resposta:', res.headers)
        
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const jsonData = JSON.parse(data)
              console.log('✅ Dados Facebook recebidos:', JSON.stringify(jsonData, null, 2))
              
              if (jsonData.data && jsonData.data.length > 0) {
                console.log('📊 Primeiro insight:', jsonData.data[0])
                console.log('📊 Campos disponíveis:', Object.keys(jsonData.data[0]))
                console.log('📊 Estrutura esperada vs real:')
                console.log('  - campaign_id:', jsonData.data[0].campaign_id)
                console.log('  - campaign_name:', jsonData.data[0].campaign_name)
                console.log('  - impressions:', jsonData.data[0].impressions)
                console.log('  - clicks:', jsonData.data[0].clicks)
                console.log('  - spend:', jsonData.data[0].spend)
              } else {
                console.log('⚠️ Nenhum insight encontrado')
              }
            } else {
              console.log('❌ Erro Facebook:', data)
              
              // Tentar fazer parse do erro para entender melhor
              try {
                const errorData = JSON.parse(data)
                console.log('📊 Estrutura do erro:', errorData)
              } catch (e) {
                console.log('📊 Erro não é JSON válido')
              }
            }
            resolve()
          } catch (error) {
            console.error('❌ Erro ao processar resposta:', error)
            reject(error)
          }
        })
      }).on('error', (error) => {
        console.error('❌ Erro ao fazer requisição:', error)
        reject(error)
      })
    })
  } catch (error) {
    console.error('❌ Erro ao testar Facebook API:', error.message)
  }
}

async function testMockInsightsStructure() {
  console.log('🔍 Testando estrutura de insights simulados...')
  
  // Simular a estrutura que deveria vir da API do Facebook
  const mockInsights = [
    {
      campaign_id: '123456789',
      campaign_name: 'Campanha Teste 1',
      impressions: '1000',
      clicks: '50',
      spend: '100.50',
      reach: '800',
      frequency: '1.25',
      cpm: '100.50',
      cpc: '2.01',
      ctr: '5.00'
    }
  ]
  
  console.log('📊 Estrutura simulada:', mockInsights[0])
  console.log('📊 Campos disponíveis:', Object.keys(mockInsights[0]))
  
  // Testar se os campos estão sendo acessados corretamente
  const testFields = ['campaign_id', 'campaign_name', 'impressions', 'clicks', 'spend']
  
  testFields.forEach(field => {
    const value = mockInsights[0][field]
    console.log(`📊 Campo ${field}:`, value, 'Tipo:', typeof value)
  })
}

async function main() {
  console.log('🚀 Iniciando testes de Facebook Insights...')
  
  await testFacebookInsightsAPI()
  console.log('---')
  await testMockInsightsStructure()
  
  console.log('✅ Testes concluídos!')
}

main().catch(console.error) 