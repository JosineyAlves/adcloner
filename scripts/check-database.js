const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Verificando conexão com o banco de dados...')
    
    // Testar conexão
    await prisma.$connect()
    console.log('✅ Conexão com banco de dados estabelecida!')
    
    // Verificar se as tabelas existem
    const userCount = await prisma.user.count()
    console.log('📊 Total de usuários:', userCount)
    
    const settingsCount = await prisma.userSettings.count()
    console.log('⚙️ Total de configurações:', settingsCount)
    
    const accountsCount = await prisma.facebookAccount.count()
    console.log('📱 Total de contas Facebook:', accountsCount)
    
    console.log('✅ Banco de dados funcionando corretamente!')
    
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error)
    console.log('💡 Verifique se:')
    console.log('   1. A variável DATABASE_URL está configurada')
    console.log('   2. O banco PostgreSQL está rodando')
    console.log('   3. As tabelas foram criadas (npm run db:push)')
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase() 