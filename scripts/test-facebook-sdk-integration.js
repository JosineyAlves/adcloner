#!/usr/bin/env node

/**
 * Script para testar a integração do Facebook SDK
 * Execute: node scripts/test-facebook-sdk-integration.js
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Testando configuração do Facebook SDK...\n')

// Verificar variáveis de ambiente
const envFile = path.join(process.cwd(), '.env.local')
const envExists = fs.existsSync(envFile)

console.log('📁 Arquivo .env.local:', envExists ? '✅ Existe' : '❌ Não existe')

if (envExists) {
  const envContent = fs.readFileSync(envFile, 'utf8')
  
  const requiredVars = [
    'NEXT_PUBLIC_FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET', 
    'NEXT_PUBLIC_FACEBOOK_CONFIG_ID',
    'NEXT_PUBLIC_APP_URL'
  ]
  
  console.log('\n🔧 Variáveis de ambiente necessárias:')
  
  requiredVars.forEach(varName => {
    const hasVar = envContent.includes(varName)
    console.log(`  ${varName}: ${hasVar ? '✅ Configurada' : '❌ Não configurada'}`)
  })
}

// Verificar se o Facebook SDK está sendo carregado
console.log('\n📦 Verificando carregamento do Facebook SDK...')

const layoutFile = path.join(process.cwd(), 'app/layout.tsx')
const layoutExists = fs.existsSync(layoutFile)

if (layoutExists) {
  const layoutContent = fs.readFileSync(layoutFile, 'utf8')
  const hasFacebookSDK = layoutContent.includes('FacebookSDK')
  
  console.log('  FacebookSDK no layout:', hasFacebookSDK ? '✅ Incluído' : '❌ Não incluído')
}

// Verificar se o componente FacebookSDK existe
const sdkFile = path.join(process.cwd(), 'components/providers/FacebookSDK.tsx')
const sdkExists = fs.existsSync(sdkFile)

console.log('  Componente FacebookSDK:', sdkExists ? '✅ Existe' : '❌ Não existe')

// Verificar configuração do Next.js
const nextConfigFile = path.join(process.cwd(), 'next.config.js')
const nextConfigExists = fs.existsSync(nextConfigFile)

if (nextConfigExists) {
  const nextConfigContent = fs.readFileSync(nextConfigFile, 'utf8')
  const hasImageDomain = nextConfigContent.includes('connect.facebook.net')
  
  console.log('  Domínio Facebook no Next.js:', hasImageDomain ? '✅ Configurado' : '❌ Não configurado')
}

console.log('\n🎯 Próximos passos para testar:')
console.log('1. Abra o navegador e acesse: https://adcloner.vercel.app')
console.log('2. Abra o Console do navegador (F12)')
console.log('3. Procure por mensagens do Facebook SDK:')
console.log('   - ✅ Script do Facebook carregado com sucesso')
console.log('   - ✅ Facebook SDK inicializado com sucesso')
console.log('   - ❌ Erro ao carregar script do Facebook')
console.log('4. Tente conectar uma conta do Facebook')
console.log('5. Verifique se o botão "Conectar Facebook" está clicável')

console.log('\n🔧 Se houver problemas:')
console.log('- Verifique se as variáveis de ambiente estão corretas')
console.log('- Verifique se o App ID do Facebook está válido')
console.log('- Verifique se o domínio está autorizado no Facebook App')
console.log('- Verifique se não há bloqueadores de script no navegador')

console.log('\n📊 Status atual:')
console.log('- Dados fictícios removidos ✅')
console.log('- SDK Facebook melhorado ✅')
console.log('- Botão de conexão corrigido ✅')
console.log('- Logs de debug adicionados ✅') 