const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    console.log('🔧 Criando usuário de teste...')
    
    // Dados do usuário de teste
    const testUser = {
      email: 'teste@adcloner.com',
      password: '123456',
      name: 'Usuário Teste'
    }
    
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: testUser.email }
    })
    
    if (existingUser) {
      console.log('✅ Usuário de teste já existe!')
      console.log('📧 Email:', testUser.email)
      console.log('🔑 Senha:', testUser.password)
      return
    }
    
    // Criptografar senha
    const hashedPassword = await bcrypt.hash(testUser.password, 12)
    
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        password: hashedPassword,
        name: testUser.name
      }
    })
    
    // Criar configurações padrão
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        mainMetrics: [
          {
            id: 'impressions',
            label: 'Impressões',
            visible: true,
            order: 1
          },
          {
            id: 'clicks',
            label: 'Cliques',
            visible: true,
            order: 2
          },
          {
            id: 'spend',
            label: 'Gasto',
            visible: true,
            order: 3
          },
          {
            id: 'reach',
            label: 'Alcance',
            visible: true,
            order: 4
          },
          {
            id: 'frequency',
            label: 'Frequência',
            visible: true,
            order: 5
          },
          {
            id: 'cpm',
            label: 'CPM',
            visible: true,
            order: 6
          },
          {
            id: 'cpc',
            label: 'CPC',
            visible: true,
            order: 7
          },
          {
            id: 'ctr',
            label: 'CTR',
            visible: true,
            order: 8
          }
        ],
        datePreset: 'today'
      }
    })
    
    console.log('✅ Usuário de teste criado com sucesso!')
    console.log('📧 Email:', testUser.email)
    console.log('🔑 Senha:', testUser.password)
    console.log('👤 Nome:', testUser.name)
    console.log('🆔 ID:', user.id)
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser() 