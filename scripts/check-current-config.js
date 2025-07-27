const fs = require('fs');

console.log('🔍 Verificando Configuração Atual do Facebook App');
console.log('================================================\n');

// Verificar se existe .env.local
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  console.log('✅ Arquivo .env.local encontrado');
  
  // Extrair Config ID
  const configIdMatch = envContent.match(/NEXT_PUBLIC_FACEBOOK_CONFIG_ID=([^\n]+)/);
  if (configIdMatch) {
    console.log(`📋 Config ID atual: ${configIdMatch[1]}`);
  } else {
    console.log('❌ NEXT_PUBLIC_FACEBOOK_CONFIG_ID não encontrado');
  }
  
  // Extrair App ID
  const appIdMatch = envContent.match(/NEXT_PUBLIC_FACEBOOK_APP_ID=([^\n]+)/);
  if (appIdMatch) {
    console.log(`📱 App ID: ${appIdMatch[1]}`);
  }
  
} else {
  console.log('❌ Arquivo .env.local não encontrado');
}

console.log('\n📋 Checklist de Verificação:');
console.log('============================');
console.log('1. Acesse: https://developers.facebook.com/apps/4146589882096422/fb-login/settings/');
console.log('2. Clique na configuração "AdCloner Pro Config"');
console.log('3. Verifique quais permissões estão ativas:');
console.log('   - ads_management');
console.log('   - ads_read');
console.log('   - business_management');
console.log('   - pages_show_list');
console.log('   - pages_read_engagement');
console.log('   - pages_manage_metadata');
console.log('   - public_profile (se estiver, remover)');
console.log('   - email (se estiver, remover)');

console.log('\n🔧 URLs de Redirecionamento:');
console.log('============================');
console.log('✅ https://adcloner.vercel.app/api/auth/callback/facebook');

console.log('\n🌐 Domínios Permitidos:');
console.log('=======================');
console.log('✅ https://adcloner.vercel.app');

console.log('\n🧪 Teste de Integração:');
console.log('=======================');
console.log('1. npm run dev');
console.log('2. Acessar: http://localhost:3000');
console.log('3. Clicar "Conectar Facebook"');
console.log('4. Verificar se o popup abre');
console.log('5. Verificar se autoriza sem erro');

console.log('\n❓ Se ainda der erro, me informe:');
console.log('- Qual erro aparece exatamente?');
console.log('- Qual URL aparece no popup?');
console.log('- O popup abre ou não?'); 