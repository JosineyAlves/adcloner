#!/usr/bin/env node

/**
 * Script para testar a configuração do Facebook SDK
 * Simula o carregamento do SDK e verifica se está funcionando
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Testando configuração do Facebook SDK...\n')

// Verificar variáveis de ambiente
const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.log('❌ Arquivo .env.local não encontrado')
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf8')

// Extrair valores
const appIdMatch = envContent.match(/NEXT_PUBLIC_FACEBOOK_APP_ID=([^\n]+)/)
const configIdMatch = envContent.match(/NEXT_PUBLIC_FACEBOOK_CONFIG_ID=([^\n]+)/)

const appId = appIdMatch ? appIdMatch[1].trim() : null
const configId = configIdMatch ? configIdMatch[1].trim() : null

console.log('📋 Configuração encontrada:')
console.log(`  App ID: ${appId ? '✅ Configurado' : '❌ Não configurado'}`)
console.log(`  Config ID: ${configId ? '✅ Configurado' : '❌ Não configurado'}`)

if (!appId || !configId) {
  console.log('\n❌ Configuração incompleta')
  console.log('📝 Configure as variáveis no arquivo .env.local:')
  console.log('NEXT_PUBLIC_FACEBOOK_APP_ID=seu_app_id_aqui')
  console.log('NEXT_PUBLIC_FACEBOOK_CONFIG_ID=seu_config_id_aqui')
  process.exit(1)
}

console.log('\n✅ Configuração básica OK')

// Simular teste de SDK
console.log('\n🔧 Teste de SDK:')
console.log('1. Verifique se o script está sendo carregado no navegador')
console.log('2. Abra o console e digite: console.log(window.FB)')
console.log('3. Deve retornar um objeto, não undefined')

console.log('\n🎯 Para testar no navegador:')
console.log('1. Execute: npm run dev')
console.log('2. Acesse: http://localhost:3000')
console.log('3. Abra o console (F12)')
console.log('4. Verifique se aparece: "Facebook SDK inicializado"')
console.log('5. Digite: console.log(window.FB)')

console.log('\n📋 Logs esperados:')
console.log('- "Script do Facebook carregado"')
console.log('- "Facebook SDK inicializado"')
console.log('- "✅ Facebook SDK carregado com sucesso"')

console.log('\n🚨 Se houver erros:')
console.log('- Verifique se o app do Facebook está configurado corretamente')
console.log('- Confirme se o Login para Empresas está ativo')
console.log('- Verifique se o config_id está correto')
console.log('- Teste em modo incógnito para evitar cache')

console.log('\n🔗 URLs de teste:')
console.log('- Local: http://localhost:3000')
console.log('- Vercel: https://adcloner.vercel.app') 