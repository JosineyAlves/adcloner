const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Configurando SQLite para AdCloner...')

try {
  // 1. Copiar schema SQLite
  const sqliteSchema = path.join(__dirname, '../prisma/schema.sqlite.prisma')
  const mainSchema = path.join(__dirname, '../prisma/schema.prisma')
  
  if (fs.existsSync(sqliteSchema)) {
    fs.copyFileSync(sqliteSchema, mainSchema)
    console.log('✅ Schema SQLite copiado')
  }
  
  // 2. Criar .env se não existir
  const envPath = path.join(__dirname, '../.env')
  if (!fs.existsSync(envPath)) {
    const envContent = `# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="adcloner-secret-key-2024"
NEXTAUTH_URL="http://localhost:3000"

# Facebook App
NEXT_PUBLIC_FACEBOOK_APP_ID="4146589882096422"
NEXT_PUBLIC_FACEBOOK_CONFIG_ID="621387444316240"
FACEBOOK_APP_SECRET="7c850da81330320a1d09376f1d4adf7f"
NEXT_PUBLIC_APP_NAME="AdCloner Pro"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
`
    fs.writeFileSync(envPath, envContent)
    console.log('✅ Arquivo .env criado')
  }
  
  // 3. Gerar cliente Prisma
  console.log('📦 Gerando cliente Prisma...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  
  // 4. Criar banco SQLite
  console.log('🗄️ Criando banco SQLite...')
  execSync('npx prisma db push', { stdio: 'inherit' })
  
  // 5. Criar usuário de teste
  console.log('👤 Criando usuário de teste...')
  execSync('node scripts/create-test-user.js', { stdio: 'inherit' })
  
  console.log('✅ SQLite configurado com sucesso!')
  console.log('🎉 Próximos passos:')
  console.log('   1. Execute: npm run dev')
  console.log('   2. Acesse: http://localhost:3000/login')
  console.log('   3. Use: teste@adcloner.com / 123456')
  
} catch (error) {
  console.error('❌ Erro ao configurar SQLite:', error.message)
  console.log('💡 Verifique se o Node.js está instalado')
} 