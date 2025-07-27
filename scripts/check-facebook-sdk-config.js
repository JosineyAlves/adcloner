#!/usr/bin/env node

/**
 * Script para verificar configuração do Facebook SDK
 * Verifica se todas as variáveis necessárias estão configuradas
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Verificando configuração do Facebook SDK...\n')

// Verificar se .env.local existe
const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.log('❌ Arquivo .env.local não encontrado')
  console.log('📝 Crie o arquivo .env.local com as seguintes variáveis:')
  console.log('')
  console.log('NEXT_PUBLIC_FACEBOOK_APP_ID=seu_app_id_aqui')
  console.log('FACEBOOK_APP_SECRET=seu_app_secret_aqui')
  console.log('NEXT_PUBLIC_FACEBOOK_CONFIG_ID=seu_config_id_aqui')
  console.log('NEXT_PUBLIC_APP_URL=https://adcloner.vercel.app')
  console.log('')
  process.exit(1)
}

// Ler arquivo .env.local
const envContent = fs.readFileSync(envPath, 'utf8')

// Verificar variáveis obrigatórias
const requiredVars = [
  'NEXT_PUBLIC_FACEBOOK_APP_ID',
  'FACEBOOK_APP_SECRET', 
  'NEXT_PUBLIC_FACEBOOK_CONFIG_ID',
  'NEXT_PUBLIC_APP_URL'
]

const missingVars = []
const foundVars = []

requiredVars.forEach(varName => {
  const regex = new RegExp(`^${varName}=(.+)$`, 'm')
  const match = envContent.match(regex)
  
  if (match) {
    const value = match[1].trim()
    if (value && value !== 'undefined' && !value.includes('seu_')) {
      foundVars.push({ name: varName, value: value.substring(0, 10) + '...' })
    } else {
      missingVars.push(varName)
    }
  } else {
    missingVars.push(varName)
  }
})

// Exibir resultados
console.log('📋 Variáveis encontradas:')
foundVars.forEach(({ name, value }) => {
  console.log(`  ✅ ${name} = ${value}`)
})

if (missingVars.length > 0) {
  console.log('\n❌ Variáveis faltando:')
  missingVars.forEach(varName => {
    console.log(`  ❌ ${varName}`)
  })
  
  console.log('\n📝 Adicione as variáveis faltando ao arquivo .env.local:')
  missingVars.forEach(varName => {
    console.log(`${varName}=valor_aqui`)
  })
  
  process.exit(1)
}

console.log('\n✅ Todas as variáveis estão configuradas!')
console.log('\n🔧 Próximos passos:')
console.log('1. Verifique se o app do Facebook é do tipo "Empresa"')
console.log('2. Confirme se o Login do Facebook para Empresas está ativo')
console.log('3. Verifique se a configuração (config_id) foi criada')
console.log('4. Teste a integração no navegador')

// Verificar configuração específica do Login para Empresas
console.log('\n📋 Configuração do Login para Empresas:')
console.log('- App deve ser do tipo "Empresa"')
console.log('- Produto: Login do Facebook para Empresas')
console.log('- Configuração criada com config_id')
console.log('- Permissões: ads_read, ads_management, public_profile, email')
console.log('- URLs de redirecionamento configuradas')

console.log('\n🎯 Para testar:')
console.log('1. Execute: npm run dev')
console.log('2. Acesse: http://localhost:3000')
console.log('3. Clique em "Conectar Facebook"')
console.log('4. Verifique o console do navegador para logs') 