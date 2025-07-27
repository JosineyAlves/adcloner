#!/usr/bin/env node

/**
 * Script para verificar e corrigir configuração do Facebook SDK
 * Execute: node scripts/check-facebook-sdk.js
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Verificando configuração do Facebook SDK...')

// Verificar se o arquivo .env.local existe
const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.log('❌ Arquivo .env.local não encontrado!')
  console.log('📝 Criando arquivo .env.local...')
  
  const envContent = `# Facebook App Configuration
NEXT_PUBLIC_FACEBOOK_APP_ID=seu_app_id_aqui
FACEBOOK_APP_SECRET=seu_app_secret_aqui

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=AdCloner Pro

# Facebook SDK Configuration
NEXT_PUBLIC_FACEBOOK_CONFIG_ID=seu_config_id_aqui
`
  
  fs.writeFileSync(envPath, envContent)
  console.log('✅ Arquivo .env.local criado!')
  console.log('⚠️  Configure suas credenciais do Facebook no arquivo .env.local')
} else {
  console.log('✅ Arquivo .env.local encontrado')
  
  // Verificar conteúdo
  const envContent = fs.readFileSync(envPath, 'utf8')
  const lines = envContent.split('\n')
  
  let hasAppId = false
  let hasAppSecret = false
  let hasAppUrl = false
  
  lines.forEach(line => {
    if (line.includes('NEXT_PUBLIC_FACEBOOK_APP_ID=') && !line.includes('seu_app_id_aqui')) {
      hasAppId = true
    }
    if (line.includes('FACEBOOK_APP_SECRET=') && !line.includes('seu_app_secret_aqui')) {
      hasAppSecret = true
    }
    if (line.includes('NEXT_PUBLIC_APP_URL=') && !line.includes('seu_app_url_aqui')) {
      hasAppUrl = true
    }
  })
  
  console.log(`📋 Configuração:`)
  console.log(`   App ID: ${hasAppId ? '✅' : '❌'}`)
  console.log(`   App Secret: ${hasAppSecret ? '✅' : '❌'}`)
  console.log(`   App URL: ${hasAppUrl ? '✅' : '❌'}`)
  
  if (!hasAppId || !hasAppSecret || !hasAppUrl) {
    console.log('\n⚠️  Configure as variáveis de ambiente no arquivo .env.local')
    console.log('📖 Siga o guia: FACEBOOK_APP_SETUP.md')
  }
}

// Verificar se o modal está configurado corretamente
const modalPath = path.join(process.cwd(), 'components/accounts/ConnectFacebookModal.tsx')
if (fs.existsSync(modalPath)) {
  console.log('\n🔍 Verificando ConnectFacebookModal...')
  
  const modalContent = fs.readFileSync(modalPath, 'utf8')
  
  // Verificar se o SDK está sendo inicializado corretamente
  if (modalContent.includes('window.FB.init')) {
    console.log('✅ Facebook SDK inicialização encontrada')
  } else {
    console.log('❌ Facebook SDK inicialização não encontrada')
  }
  
  // Verificar se há tratamento de erro
  if (modalContent.includes('userInfo.error')) {
    console.log('✅ Tratamento de erro encontrado')
  } else {
    console.log('❌ Tratamento de erro não encontrado')
  }
  
  // Verificar se não há window.location.reload()
  if (modalContent.includes('window.location.reload()')) {
    console.log('⚠️  window.location.reload() encontrado - pode causar problemas')
  } else {
    console.log('✅ Sem window.location.reload() - correto')
  }
}

console.log('\n🎯 Próximos passos:')
console.log('1. Configure suas credenciais no arquivo .env.local')
console.log('2. Execute: npm run dev')
console.log('3. Teste a conexão com o Facebook')
console.log('4. Verifique o console do navegador para erros')

console.log('\n📚 Documentação:')
console.log('- FACEBOOK_APP_SETUP.md - Configuração completa')
console.log('- SOLUCAO_RAPIDA.md - Solução rápida')
console.log('- FACEBOOK_LOGIN_EMPRESAS.md - Login para empresas') 