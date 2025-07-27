const fetch = require('node-fetch');

console.log('🔍 Debug Detalhado do Callback Facebook');
console.log('=======================================\n');

// Simular o processo de troca de code por access_token
async function debugTokenExchange() {
  const appId = '4146589882096422';
  const appSecret = '7c850da81330320a1d09376f1d4adf7f';
  const redirectUri = 'https://adcloner.vercel.app/api/auth/callback/facebook';
  
  console.log('📋 Configurações:');
  console.log(`App ID: ${appId}`);
  console.log(`App Secret: ${appSecret.substring(0, 10)}...`);
  console.log(`Redirect URI: ${redirectUri}`);
  
  // URL para trocar code por access_token
  const tokenUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  console.log('\n🔗 URL para troca de token:');
  console.log(tokenUrl);
  console.log('\n⚠️  NOTA: Esta URL precisa do parâmetro "code" que vem do Facebook');
  console.log('   Exemplo completo:');
  console.log(`${tokenUrl}&code=CODIGO_AQUI`);
  
  console.log('\n📝 Para testar manualmente:');
  console.log('1. Faça login no Facebook');
  console.log('2. Copie o "code" da URL de callback');
  console.log('3. Cole o código na URL acima');
  console.log('4. Execute a requisição');
  
  console.log('\n🔍 Possíveis problemas:');
  console.log('- App Secret incorreto');
  console.log('- Redirect URI não corresponde exatamente');
  console.log('- Code já expirou (válido por poucos minutos)');
  console.log('- Permissões não configuradas corretamente');
  
  console.log('\n📋 Verificar no Facebook Developers:');
  console.log('1. Acesse: https://developers.facebook.com/apps/4146589882096422/fb-login/settings/');
  console.log('2. Verifique se a URL de redirecionamento está exatamente igual');
  console.log('3. Verifique se as permissões estão corretas');
  console.log('4. Verifique se o App Secret está correto');
}

debugTokenExchange(); 