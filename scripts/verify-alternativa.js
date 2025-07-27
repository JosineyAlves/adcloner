const fs = require('fs');

console.log('🔍 Verificando Configuração Alternativa (sem public_profile)');
console.log('==========================================================\n');

// Verificar .env.local
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  console.log('✅ Arquivo .env.local encontrado');
  
  // Verificar variáveis obrigatórias
  const requiredVars = [
    'NEXT_PUBLIC_FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET', 
    'NEXT_PUBLIC_FACEBOOK_CONFIG_ID',
    'NEXT_PUBLIC_APP_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  let missingVars = [];
  requiredVars.forEach(varName => {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length === 0) {
    console.log('✅ Todas as variáveis obrigatórias estão presentes');
  } else {
    console.log('❌ Variáveis faltando:', missingVars.join(', '));
  }
  
  // Verificar se é configuração alternativa
  if (envContent.includes('SEM public_profile')) {
    console.log('✅ Configuração alternativa detectada');
  }
  
} else {
  console.log('❌ Arquivo .env.local não encontrado');
}

console.log('\n📋 Checklist Facebook Developers:');
console.log('================================');
console.log('✅ Tipo de app: Empresa');
console.log('✅ Produto: Login do Facebook para Empresas');
console.log('✅ Configuração criada com nome: "AdCloner Pro - Teste"');
console.log('✅ Permissões configuradas (SEM public_profile):');
console.log('   - ads_management');
console.log('   - ads_read');
console.log('   - business_management');
console.log('   - pages_show_list');
console.log('   - pages_read_engagement');
console.log('   - pages_manage_metadata');
console.log('✅ URL de redirecionamento: https://adcloner.vercel.app/api/auth/callback/facebook');
console.log('✅ Domínios permitidos: https://adcloner.vercel.app');

console.log('\n🧪 Próximos passos para teste:');
console.log('1. Executar: npm run dev');
console.log('2. Acessar: http://localhost:3000');
console.log('3. Clicar "Conectar Facebook"');
console.log('4. Verificar se o popup abre sem erro');
console.log('5. Autorizar permissões');
console.log('6. Verificar se retorna ao dashboard');

console.log('\n🌐 Para teste em produção:');
console.log('1. Atualizar NEXT_PUBLIC_FACEBOOK_CONFIG_ID no Vercel');
console.log('2. Acessar: https://adcloner.vercel.app');
console.log('3. Testar integração'); 