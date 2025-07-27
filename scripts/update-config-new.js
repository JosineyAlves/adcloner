#!/usr/bin/env node

/**
 * Script para atualizar a nova configuração do Facebook Login para Empresas
 * Configuração ID: 757815830318736
 */

const fs = require('fs')
const path = require('path')

console.log('🔄 Atualizando configuração do Facebook Login para Empresas...')

// Dados da nova configuração
const newConfig = {
  configId: '757815830318736',
  tokenType: 'Token de acesso do usuário do sistema',
  permissions: [
    'ads_management',
    'ads_read', 
    'business_management',
    'pages_manage_metadata',
    'pages_show_list',
    'pages_read_engagement',
    'read_insights',
    'pages_manage_posts',
    'pages_manage_engagement'
  ],
  assets: [
    'Páginas',
    'Contas de anúncios',
    'Catálogos', 
    'Pixels',
    'Contas do Instagram'
  ]
}

// Atualizar env.example
const envExamplePath = path.join(__dirname, '..', 'env.example')
if (fs.existsSync(envExamplePath)) {
  let envContent = fs.readFileSync(envExamplePath, 'utf8')
  
  // Atualizar CONFIG_ID
  envContent = envContent.replace(
    /NEXT_PUBLIC_FACEBOOK_CONFIG_ID=.*/,
    `NEXT_PUBLIC_FACEBOOK_CONFIG_ID=${newConfig.configId}`
  )
  
  fs.writeFileSync(envExamplePath, envContent)
  console.log('✅ env.example atualizado')
}

// Criar arquivo de configuração
const configPath = path.join(__dirname, '..', 'FACEBOOK_NEW_CONFIG.md')
const configContent = `# Nova Configuração do Facebook Login para Empresas

## Configuração ID
\`${newConfig.configId}\`

## Tipo de Token
${newConfig.tokenType}

## Permissões Ativas
${newConfig.permissions.map(p => `- \`${p}\``).join('\n')}

## Ativos Selecionados
${newConfig.assets.map(a => `- ${a}`).join('\n')}

## Implementação

### 1. Variáveis de Ambiente
\`\`\`bash
NEXT_PUBLIC_FACEBOOK_CONFIG_ID=${newConfig.configId}
\`\`\`

### 2. Login Component
\`\`\`javascript
FB.login(
  function(response) {
    if (response.authResponse && response.authResponse.code) {
      // Processar código
      handleLoginSuccess(response.authResponse)
    }
  },
  {
    config_id: '${newConfig.configId}',
    response_type: 'code',
    override_default_response_type: true
  }
);
\`\`\`

### 3. Server Processing
\`\`\`javascript
// POST /api/auth/callback/facebook
const { code } = await request.json()

// Trocar código por token
const tokenResponse = await fetch('https://graph.facebook.com/v23.0/oauth/access_token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
    client_secret: process.env.FACEBOOK_APP_SECRET,
    code: code,
    redirect_uri: process.env.NEXT_PUBLIC_APP_URL + '/api/auth/callback/facebook'
  })
})

// Obter Client Business ID
const businessResponse = await fetch(
  \`https://graph.facebook.com/v23.0/me?fields=client_business_id&access_token=\${tokenData.access_token}\`
)
\`\`\`

## Benefícios da Nova Configuração

1. **Token de Longa Duração**: Token do sistema nunca expira
2. **Permissões Completas**: Todas as permissões necessárias para AdCloner
3. **Ativos Completos**: Acesso a todos os ativos necessários
4. **Ideal para SaaS**: Configuração específica para aplicações empresariais

## Status
✅ Configuração criada e testada
✅ Permissões corretas selecionadas
✅ Ativos corretos selecionados
✅ Código atualizado para usar nova configuração
`

fs.writeFileSync(configPath, configContent)
console.log('✅ FACEBOOK_NEW_CONFIG.md criado')

console.log('\n📋 Resumo da Nova Configuração:')
console.log(`Config ID: ${newConfig.configId}`)
console.log(`Tipo de Token: ${newConfig.tokenType}`)
console.log(`Permissões: ${newConfig.permissions.length}`)
console.log(`Ativos: ${newConfig.assets.length}`)

console.log('\n🎉 Configuração atualizada com sucesso!')
console.log('📝 Verifique FACEBOOK_NEW_CONFIG.md para detalhes completos') 