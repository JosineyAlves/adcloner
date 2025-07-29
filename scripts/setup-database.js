const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Configurando banco de dados do AdCloner...')

try {
  // Verificar se o .env existe
  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) {
    console.log('❌ Arquivo .env não encontrado!')
    console.log('📝 Copie o arquivo env.example para .env e configure as variáveis:')
    console.log('   cp env.example .env')
    console.log('')
    console.log('🔧 Configure as seguintes variáveis no .env:')
    console.log('   - DATABASE_URL (URL do PostgreSQL)')
    console.log('   - NEXTAUTH_SECRET (chave secreta para NextAuth)')
    console.log('   - NEXTAUTH_URL (URL da aplicação)')
    process.exit(1)
  }

  console.log('📦 Gerando cliente do Prisma...')
  execSync('npx prisma generate', { stdio: 'inherit' })

  console.log('🗄️ Executando migrações do banco...')
  execSync('npx prisma db push', { stdio: 'inherit' })

  console.log('✅ Banco de dados configurado com sucesso!')
  console.log('')
  console.log('🎉 Próximos passos:')
  console.log('   1. Configure as variáveis do Facebook no .env')
  console.log('   2. Execute: npm run dev')
  console.log('   3. Acesse: http://localhost:3000/register')
  console.log('   4. Crie sua primeira conta')

} catch (error) {
  console.error('❌ Erro ao configurar banco de dados:', error.message)
  console.log('')
  console.log('🔧 Verifique se:')
  console.log('   - PostgreSQL está instalado e rodando')
  console.log('   - DATABASE_URL está configurada corretamente')
  console.log('   - Todas as dependências estão instaladas (npm install)')
  process.exit(1)
} 