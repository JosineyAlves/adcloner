const https = require('https')

async function testFacebookPermissions() {
  console.log('🔍 Testando permissões da API do Facebook...')
  
  try {
    // Simular uma chamada para verificar permissões
    const mockAccountId = 'act_1747681305822566'
    const mockToken = 'invalid_token'
    
    const url = `https://graph.facebook.com/v23.0/${mockAccountId}?fields=id,name,account_status&access_token=${mockToken}`
    
    console.log('🔍 URL da requisição:', url.replace(mockToken, '***'))
    
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        console.log('📊 Status da resposta:', res.statusCode)
        console.log('📊 Headers da resposta:', res.headers)
        
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const jsonData = JSON.parse(data)
              console.log('✅ Dados da conta recebidos:', JSON.stringify(jsonData, null, 2))
            } else {
              console.log('❌ Erro:', data)
              
              try {
                const errorData = JSON.parse(data)
                console.log('📊 Estrutura do erro:', errorData)
                
                if (errorData.error) {
                  console.log('📊 Código do erro:', errorData.error.code)
                  console.log('📊 Tipo do erro:', errorData.error.type)
                  console.log('📊 Mensagem do erro:', errorData.error.message)
                }
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
    console.error('❌ Erro ao testar permissões:', error.message)
  }
}

async function testInsightsPermissions() {
  console.log('🔍 Testando permissões de insights...')
  
  try {
    const mockAccountId = 'act_1747681305822566'
    const mockToken = 'invalid_token'
    
    const url = `https://graph.facebook.com/v23.0/${mockAccountId}/insights?fields=impressions,clicks,spend&date_preset=last_7d&access_token=${mockToken}`
    
    console.log('🔍 URL da requisição insights:', url.replace(mockToken, '***'))
    
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        console.log('📊 Status da resposta insights:', res.statusCode)
        
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const jsonData = JSON.parse(data)
              console.log('✅ Insights recebidos:', JSON.stringify(jsonData, null, 2))
            } else {
              console.log('❌ Erro insights:', data)
              
              try {
                const errorData = JSON.parse(data)
                console.log('📊 Estrutura do erro insights:', errorData)
              } catch (e) {
                console.log('📊 Erro insights não é JSON válido')
              }
            }
            resolve()
          } catch (error) {
            console.error('❌ Erro ao processar resposta insights:', error)
            reject(error)
          }
        })
      }).on('error', (error) => {
        console.error('❌ Erro ao fazer requisição insights:', error)
        reject(error)
      })
    })
  } catch (error) {
    console.error('❌ Erro ao testar permissões de insights:', error.message)
  }
}

async function main() {
  console.log('🚀 Iniciando testes de permissões...')
  
  await testFacebookPermissions()
  console.log('---')
  await testInsightsPermissions()
  
  console.log('✅ Testes de permissões concluídos!')
}

main().catch(console.error) 