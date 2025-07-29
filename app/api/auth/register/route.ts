import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validações básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 400 }
      )
    }

    // Criptografar senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null
      }
    })

    // Criar configurações padrão do usuário
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
          }
        ],
        datePreset: 'today'
      }
    })

    return NextResponse.json(
      { 
        message: 'Usuário criado com sucesso',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao registrar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 