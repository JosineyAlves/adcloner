#!/usr/bin/env node

/**
 * Script para criar arquivo .env.local
 * Execute: node scripts/create-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Criando arquivo .env.local...\n');

const envPath = path.join(process.cwd(), '.env.local');

const envContent = `# Facebook App Configuration (Login para Empresas)
NEXT_PUBLIC_FACEBOOK_APP_ID=4146589882096422
FACEBOOK_APP_SECRET=seu_app_secret_aqui
NEXT_PUBLIC_FACEBOOK_CONFIG_ID=seu_config_id_aqui

# App Configuration
NEXT_PUBLIC_APP_URL=https://adcloner.vercel.app
NEXT_PUBLIC_APP_NAME=AdCloner Pro

# Para desenvolvimento, use:
# NEXT_PUBLIC_APP_URL=http://localhost:3000

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
  console.log('✅ Arquivo .env.local criado com sucesso!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Edite o arquivo .env.local e adicione:');
  console.log('   - FACEBOOK_APP_SECRET (do Facebook Developers)');
  console.log('   - NEXT_PUBLIC_FACEBOOK_CONFIG_ID (da configuração criada)');
  console.log('2. Faça commit e push para o GitHub');
  console.log('3. Teste a integração em: https://adcloner.vercel.app/');
} catch (error) {
  console.error('❌ Erro ao criar arquivo:', error.message);
}

console.log('\n✨ Configuração concluída!'); 