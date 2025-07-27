const fs = require('fs');

console.log('🔧 Criando arquivo .env.local');
console.log('==============================\n');

// Configurações baseadas no que você informou anteriormente
const envContent = `# Facebook App Configuration
NEXT_PUBLIC_FACEBOOK_APP_ID=4146589882096422
FACEBOOK_APP_SECRET=7c850da81330320a1d09376f1d4adf7f
NEXT_PUBLIC_FACEBOOK_CONFIG_ID=621387444316240
NEXT_PUBLIC_APP_URL=https://adcloner.vercel.app
NEXT_PUBLIC_APP_NAME=AdCloner Pro

# NextAuth Configuration
NEXTAUTH_SECRET=976aa11c09a812a2a29e08fdd1a6bea8
NEXTAUTH_URL=https://adcloner.vercel.app

# Configuração atual - verificar se public_profile está ativo
# Se estiver, remover da configuração no Facebook Developers
`;

// Escrever .env.local
fs.writeFileSync('.env.local', envContent);

console.log('✅ Arquivo .env.local criado!');
console.log('📋 Config ID: 621387444316240');
console.log('📱 App ID: 4146589882096422');

console.log('\n📝 Próximos passos:');
console.log('1. Verificar se o Config ID está correto no Facebook Developers');
console.log('2. Verificar se public_profile NÃO está ativo na configuração');
console.log('3. Testar integração: npm run dev');
console.log('4. Acessar: http://localhost:3000');
console.log('5. Clicar "Conectar Facebook"');

console.log('\n🔍 Para verificar no Facebook Developers:');
console.log('1. Acesse: https://developers.facebook.com/apps/4146589882096422/fb-login/settings/');
console.log('2. Clique na configuração com Config ID: 621387444316240');
console.log('3. Verifique se public_profile NÃO está na lista de permissões'); 