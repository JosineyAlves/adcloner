const fetch = require('node-fetch')

async function testInsightsAPI() {
  console.log('🔍 Testando API de Insights...')
  
  try {
    // Testar se a API está respondendo
    const response = await fetch('http://localhost:3000/api/insights?accountId=test&datePreset=last_7d')
    
    console.log('📊 Status da resposta:', response.status)
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Dados recebidos:', data)
    } else {
      const errorText = await response.text()
      console.log('❌ Erro:', errorText)
    }
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message)
  }
}

async function testFacebookAPI() {
  console.log('🔍 Testando Facebook API...')
  
  try {
    // Simular uma chamada para a API do Facebook
    const mockToken = 'test_token'
    const mockAccountId = 'act_test'
    
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