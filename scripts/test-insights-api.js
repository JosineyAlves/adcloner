const fetch = require('node-fetch')

async function testInsightsAPI() {
  console.log('🔍 Testando API de Insights...')
  
  try {
    // Simular uma requisição para a API de insights
    const response = await fetch('http://localhost:3000/api/insights?accountId=act_864904627876681&datePreset=last_7d')
    
    console.log('📊 Status da resposta:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Dados recebidos:', JSON.stringify(data, null, 2))
      
      if (data.insights && data.insights.length > 0) {
        console.log('📊 Primeiro insight:', data.insights[0])
        console.log('📊 Campos disponíveis:', Object.keys(data.insights[0]))
      } else {
        console.log('⚠️ Nenhum insight encontrado')
      }
    } else {
      const errorText = await response.text()
      console.log('❌ Erro:', errorText)
    }
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message)
  }
}

async function testFacebookAPI() {
  console.log('🔍 Testando Facebook API diretamente...')
  
  try {
    // Simular uma chamada para a API do Facebook (sem token válido)
    const mockAccountId = 'act_864904627876681'
    const mockToken = 'invalid_token'
    
    const response = await fetch(`https://graph.facebook.com/v23.0/${mockAccountId}/insights?fields=impressions,clicks,spend&date_preset=last_7d&access_token=${mockToken}`)
    
    console.log('📊 Status da resposta Facebook:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Dados Facebook recebidos:', data)
    } else {
      const errorText = await response.text()
      console.log('❌ Erro Facebook:', errorText)
    }
  } catch (error) {
    console.error('❌ Erro ao testar Facebook API:', error.message)
  }
}

async function main() {
  console.log('🚀 Iniciando testes de debug...')
  
  await testInsightsAPI()
  console.log('---')
  await testFacebookAPI()
  
  console.log('✅ Testes concluídos!')
}

main().catch(console.error) 