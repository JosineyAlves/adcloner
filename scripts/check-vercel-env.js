#!/usr/bin/env node

/**
 * Script para verificar variáveis do Vercel
 * Execute: node scripts/check-vercel-env.js
 */

console.log('🔍 Verificando variáveis do Vercel...\n');

console.log('📋 Variáveis necessárias:');
console.log('  • NEXT_PUBLIC_FACEBOOK_APP_ID = 4146589882096422 ✅');
console.log('  • FACEBOOK_APP_SECRET = [precisa configurar] ❌');
console.log('  • NEXT_PUBLIC_FACEBOOK_CONFIG_ID = 621387444316240 ✅');
console.log('  • NEXT_PUBLIC_APP_URL = https://adcloner.vercel.app ✅');

console.log('\n🔧 Como configurar no Vercel:');
console.log('1. Acesse: https://vercel.com/dashboard');
console.log('2. Selecione o projeto "adcloner"');
console.log('3. Vá em "Settings" > "Environment Variables"');
console.log('4. Adicione as variáveis:');
console.log('');
console.log('   Nome: FACEBOOK_APP_SECRET');
console.log('   Valor: [seu_app_secret_do_facebook_developers]');
console.log('   Environment: Production');
console.log('');
console.log('   Nome: NEXT_PUBLIC_FACEBOOK_CONFIG_ID');
console.log('   Valor: 621387444316240');
console.log('   Environment: Production');
console.log('');
console.log('   Nome: NEXT_PUBLIC_APP_URL');
console.log('   Valor: https://adcloner.vercel.app');
console.log('   Environment: Production');

console.log('\n🔗 URLs para verificar no Facebook Developers:');
console.log('  • URL de Política de Privacidade: https://adcloner.vercel.app/privacy-policy.html');
console.log('  • URL de Termos de Serviço: https://adcloner.vercel.app/terms-of-service.html');
console.log('  • URLs de Redirecionamento OAuth: https://adcloner.vercel.app/api/auth/callback/facebook');
console.log('  • URL do Site: https://adcloner.vercel.app/');

console.log('\n📋 Checklist para resolver:');
console.log('  1. ✅ Configurar FACEBOOK_APP_SECRET no Vercel');
console.log('  2. ✅ Verificar URLs no Facebook Developers');
console.log('  3. ✅ Confirmar que o app está ativo');
console.log('  4. ✅ Testar novamente');

console.log('\n✨ Verificação concluída!'); 