#!/usr/bin/env node

/**
 * Script para testar o callback do Facebook
 */

console.log('🔍 Testando callback do Facebook...\n');

// Simular os parâmetros que o Facebook envia
const testCode = 'test_code_123';
const appId = '4146589882096422';
const appSecret = '7c850da81330320a1d09376f1d4adf7f';
const redirectUri = 'https://adcloner.vercel.app/api/auth/callback/facebook';

console.log('📋 Parâmetros de teste:');
console.log(`  • App ID: ${appId}`);
console.log(`  • App Secret: ${appSecret}`);
console.log(`  • Redirect URI: ${redirectUri}`);
console.log(`  • Test Code: ${testCode}`);

console.log('\n🔗 URL de troca de código por token:');
const tokenUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${testCode}&redirect_uri=${encodeURIComponent(redirectUri)}`;
console.log(`  ${tokenUrl}`);

console.log('\n📋 Problemas possíveis:');
console.log('  1. ❓ App Secret incorreto');
console.log('  2. ❓ Redirect URI não configurado no Facebook');
console.log('  3. ❓ App não está ativo');
console.log('  4. ❓ Configuração não foi criada');

console.log('\n🔧 Para testar manualmente:');
console.log('1. Acesse: https://adcloner.vercel.app/');
console.log('2. Abra DevTools (F12)');
console.log('3. Vá na aba "Console"');
console.log('4. Tente conectar com o Facebook');
console.log('5. Verifique se há erros no console');

console.log('\n📋 URLs para verificar no Facebook Developers:');
console.log('  • URL de Política de Privacidade: https://adcloner.vercel.app/privacy-policy.html');
console.log('  • URL de Termos de Serviço: https://adcloner.vercel.app/terms-of-service.html');
console.log('  • URLs de Redirecionamento OAuth: https://adcloner.vercel.app/api/auth/callback/facebook');
console.log('  • URL do Site: https://adcloner.vercel.app/');

console.log('\n🎯 Próximo passo:');
console.log('Verifique se TODAS as URLs acima estão configuradas no Facebook Developers');

console.log('\n✨ Debug concluído!'); 