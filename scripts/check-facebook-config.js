#!/usr/bin/env node

/**
 * Script para verificar configurações do Facebook
 * Execute: node scripts/check-facebook-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configurações do Facebook...\n');

// Verificar arquivo .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

console.log('📁 Arquivo .env.local:', envExists ? '✅ Encontrado' : '❌ Não encontrado');

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Verificar variáveis obrigatórias
  const requiredVars = [
    'NEXT_PUBLIC_FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET',
    'NEXT_PUBLIC_FACEBOOK_CONFIG_ID', // NOVO: Config ID obrigatório para Login para Empresas
    'NEXT_PUBLIC_APP_URL'
  ];
  
  console.log('\n🔧 Variáveis de ambiente:');
  requiredVars.forEach(varName => {
    const hasVar = envContent.includes(varName);
    console.log(`  ${varName}: ${hasVar ? '✅ Configurada' : '❌ Não configurada'}`);
  });
  
  // Verificar se APP_ID não é placeholder
  const appIdMatch = envContent.match(/NEXT_PUBLIC_FACEBOOK_APP_ID=([^\n]+)/);
  if (appIdMatch) {
    const appId = appIdMatch[1];
    const isValidAppId = appId && appId !== 'your_facebook_app_id' && appId.length > 10;
    console.log(`  App ID válido: ${isValidAppId ? '✅ Sim' : '❌ Não'}`);
  }
}

// Verificar arquivos de configuração
const configFiles = [
  'app/api/auth/facebook/route.ts',
  'app/api/auth/callback/facebook/route.ts',
  'lib/facebook-api.ts'
];

console.log('\n📄 Arquivos de configuração:');
configFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${file}: ${exists ? '✅ Existe' : '❌ Não existe'}`);
});

// Verificar package.json
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log('\n📦 Dependências do projeto:');
  console.log(`  Next.js: ${packageJson.dependencies?.next ? '✅ Instalado' : '❌ Não instalado'}`);
  console.log(`  React: ${packageJson.dependencies?.react ? '✅ Instalado' : '❌ Não instalado'}`);
}

console.log('\n📋 Checklist de configuração do Facebook App (Login para Empresas):');
console.log('  ⬜ Criar app do tipo "Empresa" no Facebook Developers');
console.log('  ⬜ Adicionar Login do Facebook para Empresas');
console.log('  ⬜ Criar configuração com Config ID');
console.log('  ⬜ Adicionar permissões compatíveis');
console.log('  ⬜ Configurar URLs de redirecionamento');
console.log('  ⬜ Configurar App ID, Secret e Config ID');
console.log('  ⬜ Testar integração');

console.log('\n🔗 Links úteis:');
console.log('  • Facebook Developers: https://developers.facebook.com/');
console.log('  • App Review Guidelines: https://developers.facebook.com/docs/app-review/');
console.log('  • OAuth Documentation: https://developers.facebook.com/docs/facebook-login/');

console.log('\n💡 Próximos passos:');
if (!envExists) {
  console.log('  1. Crie o arquivo .env.local com suas credenciais');
}
console.log('  2. Configure o app no Facebook Developers');
console.log('  3. Adicione todas as permissões necessárias');
console.log('  4. Teste a integração com: npm run dev');

console.log('\n✨ Verificação concluída!'); 