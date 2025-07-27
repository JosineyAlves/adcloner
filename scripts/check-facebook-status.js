#!/usr/bin/env node

/**
 * Script para verificar status do app no Facebook
 * Execute: node scripts/check-facebook-status.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando status do app no Facebook...\n');

// Verificar arquivo .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

console.log('📁 Configuração local:');
console.log(`  Arquivo .env.local: ${envExists ? '✅ Existe' : '❌ Não existe'}`);

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Verificar variáveis obrigatórias
  const requiredVars = [
    'NEXT_PUBLIC_FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET',
    'NEXT_PUBLIC_FACEBOOK_CONFIG_ID',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  console.log('\n🔧 Variáveis de ambiente:');
  requiredVars.forEach(varName => {
    const hasVar = envContent.includes(varName);
    const match = envContent.match(new RegExp(`${varName}=([^\\n]+)`));
    const value = match ? match[1] : 'Não configurado';
    const isValid = value && value !== 'seu_app_id_aqui' && value !== 'your_facebook_app_id';
    
    console.log(`  ${varName}: ${hasVar ? '✅ Configurada' : '❌ Não configurada'}`);
    if (hasVar) {
      console.log(`    Valor: ${isValid ? '✅ Válido' : '❌ Placeholder'}`);
    }
  });
}

console.log('\n🔗 URLs para verificar:');
console.log('  • Política de Privacidade: https://adcloner.vercel.app/privacy-policy.html');
console.log('  • Termos de Serviço: https://adcloner.vercel.app/terms-of-service.html');
console.log('  • App Principal: https://adcloner.vercel.app/');

console.log('\n📋 Checklist para resolver o problema:');
console.log('  1. ✅ Verificar se o app está ativo no Facebook Developers');
console.log('  2. ✅ Confirmar se é do tipo "Empresa"');
console.log('  3. ✅ Verificar se a configuração foi criada');
console.log('  4. ✅ Confirmar se todas as permissões foram adicionadas');
console.log('  5. ✅ Testar a URL de reautorização');
console.log('  6. ✅ Verificar se as URLs obrigatórias estão configuradas');

console.log('\n🚀 Próximos passos:');
console.log('  1. Acesse: https://developers.facebook.com/');
console.log('  2. Selecione seu app');
console.log('  3. Verifique se está ativo em "Configurações" > "Básico"');
console.log('  4. Confirme se é do tipo "Empresa"');
console.log('  5. Vá em "Login do Facebook para Empresas" > "Configurações"');
console.log('  6. Crie uma configuração se não existir');
console.log('  7. Adicione todas as permissões obrigatórias');
console.log('  8. Configure as URLs obrigatórias');
console.log('  9. Teste a integração em: https://adcloner.vercel.app/');

console.log('\n🔧 URL de reautorização criada:');
console.log('  • /api/auth/facebook/reauth - Força reautorização');

console.log('\n✨ Verificação concluída!'); 