const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createDefaultUser() {
  try {
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: {
        email: 'alvesjosiney@yahoo.com.br'
      }
    })

    if (existingUser) {
      console.log('✅ Usuário já existe:', existingUser.email)
      return existingUser
    }

    // Criar usuário padrão
    const user = await prisma.user.create({
      data: {
        email: 'alvesjosiney@yahoo.com.br',
        name: 'Josiney Alves'
      }
    })

    console.log('✅ Usuário criado com sucesso:', user.email)
    return user
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createDefaultUser()
    .then(() => {
      console.log('✅ Script executado com sucesso')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erro no script:', error)
      process.exit(1)
    })
}

module.exports = { createDefaultUser } 