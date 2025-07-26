#!/usr/bin/env node

/**
 * Script para configurar arquivo .env.local
 * Execute: node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Configuração do arquivo .env.local\n');

const envPath = path.join(process.cwd(), '.env.local');

// Verificar se já existe
if (fs.existsSync(envPath)) {
  console.log('⚠️  Arquivo .env.local já existe!');
  rl.question('Deseja sobrescrever? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      createEnvFile();
    } else {
      console.log('❌ Operação cancelada');
      rl.close();
    }
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  console.log('\n📝 Configure suas credenciais do Facebook:\n');
  
  rl.question('Facebook App ID: ', (appId) => {
    rl.question('Facebook App Secret: ', (appSecret) => {
      rl.question('Facebook Config ID (obrigatório para Login para Empresas): ', (configId) => {
        rl.question('URL do App (ex: http://localhost:3000): ', (appUrl) => {
          rl.question('Nome do App (ex: AdCloner Pro): ', (appName) => {
            
            const envContent = `# Facebook App Configuration (Login para Empresas)
NEXT_PUBLIC_FACEBOOK_APP_ID=${appId}
FACEBOOK_APP_SECRET=${appSecret}
NEXT_PUBLIC_FACEBOOK_CONFIG_ID=${configId}

# App Configuration
NEXT_PUBLIC_APP_URL=${appUrl}
NEXT_PUBLIC_APP_NAME=${appName}

# Para produção, use:
# NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app

# Supabase Configuration (opcional)
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth Configuration (opcional)
# NEXTAUTH_SECRET=your_nextauth_secret_key
# NEXTAUTH_URL=http://localhost:3000
`;

            try {
              fs.writeFileSync(envPath, envContent);
              console.log('\n✅ Arquivo .env.local criado com sucesso!');
              console.log('\n📋 Próximos passos:');
              console.log('1. Configure o app no Facebook Developers');
              console.log('2. Adicione as permissões necessárias');
              console.log('3. Execute: npm run dev');
              console.log('4. Teste a integração');
            } catch (error) {
              console.error('❌ Erro ao criar arquivo:', error.message);
            }
            
            rl.close();
          });
        });
      });
    });
  });
}

rl.on('close', () => {
  console.log('\n✨ Configuração concluída!');
}); 