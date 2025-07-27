const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Atualizando Configuração Alternativa (sem public_profile)');
console.log('========================================================\n');

rl.question('Digite o NOVO Config ID da configuração alternativa: ', (configId) => {
  // Conteúdo do .env.local
  const envContent = `# Facebook App Configuration (Alternativa - sem public_profile)
NEXT_PUBLIC_FACEBOOK_APP_ID=4146589882096422
FACEBOOK_APP_SECRET=7c850da81330320a1d09376f1d4adf7f
NEXT_PUBLIC_FACEBOOK_CONFIG_ID=${configId}
NEXT_PUBLIC_APP_URL=https://adcloner.vercel.app
NEXT_PUBLIC_APP_NAME=AdCloner Pro

# NextAuth Configuration
NEXTAUTH_SECRET=976aa11c09a812a2a29e08fdd1a6bea8
NEXTAUTH_URL=https://adcloner.vercel.app

# Configuração Alternativa - SEM public_profile
# Permissões: ads_management, ads_read, business_management, pages_show_list, pages_read_engagement, pages_manage_metadata
`;

  // Escrever .env.local
  fs.writeFileSync('.env.local', envContent);
  
  console.log('\n✅ Arquivo .env.local atualizado!');
  console.log(`📋 Config ID: ${configId}`);
  console.log('\n📝 Próximos passos:');
  console.log('1. Atualizar variável no Vercel: NEXT_PUBLIC_FACEBOOK_CONFIG_ID');
  console.log('2. Testar integração local: npm run dev');
  console.log('3. Testar integração produção: https://adcloner.vercel.app');
  
  rl.close();
}); 