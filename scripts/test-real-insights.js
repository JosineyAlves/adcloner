const https = require('https')

async function testRealInsightsAPI() {
  console.log('🔍 Testando API de Insights Real...')
  
  try {
    // Simular uma chamada para a API de insights real
    const response = await fetch('http://localhost:3000/api/insights?accountId=act_864904627876681&datePreset=last_7d')
    
    console.log('📊 Status da resposta:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Dados recebidos:', JSON.stringify(data, null, 2))
      
      if (data.insights && data.insights.length > 0) {
        console.log('📊 Primeiro insight:', data.insights[0])
        console.log('📊 Campos disponíveis:', Object.keys(data.insights[0]))
        
        // Verificar se os campos esperados estão presentes
        const expectedFields = ['campaign_id', 'campaign_name', 'impressions', 'clicks', 'spend']
        expectedFields.forEach(field => {
          const value = data.insights[0][field]
          console.log(`📊 Campo ${field}:`, value, 'Tipo:', typeof value)
        })
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

async function testTestInsightsAPI() {
  console.log('🔍 Testando API de Insights de Teste...')
  
  try {
    // Testar a API de teste
    const response = await fetch('http://localhost:3000/api/insights/test?accountId=act_864904627876681&datePreset=last_7d')
    
    console.log('📊 Status da resposta:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Dados de teste recebidos:', JSON.stringify(data, null, 2))
      
      if (data.insights && data.insights.length > 0) {
        console.log('📊 Primeiro insight de teste:', data.insights[0])
        console.log('📊 Campos disponíveis:', Object.keys(data.insights[0]))
      } else {
        console.log('⚠️ Nenhum insight de teste encontrado')
      }
    } else {
      const errorText = await response.text()
      console.log('❌ Erro:', errorText)
    }
  } catch (error) {
    console.error('❌ Erro ao testar API de teste:', error.message)
  }
}

async function main() {
  console.log('🚀 Iniciando testes de APIs de Insights...')
  
  await testRealInsightsAPI()
  console.log('---')
  await testTestInsightsAPI()
  
  console.log('✅ Testes concluídos!')
}

main().catch(console.error) 