#!/usr/bin/env node

/**
 * Script para diagnosticar o erro "e is not iterable" no useState
 * Execute: node scripts/debug-usestate-error.js
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Diagnosticando erro "e is not iterable" no useState...\n')

// Verificar versões do React
const packageJsonPath = path.join(process.cwd(), 'package.json')
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  
  console.log('📦 Versões do React:')
  console.log(`  React: ${packageJson.dependencies.react}`)
  console.log(`  React DOM: ${packageJson.dependencies['react-dom']}`)
  console.log(`  Next.js: ${packageJson.dependencies.next}`)
  console.log(`  TypeScript: ${packageJson.dependencies.typescript}`)
}

// Verificar configuração do TypeScript
const tsConfigPath = path.join(process.cwd(), 'tsconfig.json')
if (fs.existsSync(tsConfigPath)) {
  const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'))
  
  console.log('\n⚙️ Configuração do TypeScript:')
  console.log(`  Target: ${tsConfig.compilerOptions?.target}`)
  console.log(`  JSX: ${tsConfig.compilerOptions?.jsx}`)
  console.log(`  Strict: ${tsConfig.compilerOptions?.strict}`)
}

// Verificar se há problemas conhecidos
console.log('\n🚨 Problemas conhecidos que podem causar "e is not iterable":')

console.log('\n1. **React 18 Strict Mode**:')
console.log('   - O Strict Mode pode causar problemas com useState')
console.log('   - Solução: Verificar se está habilitado no layout')

console.log('\n2. **Tipagem implícita no useState**:')
console.log('   - useState() sem tipagem explícita pode causar problemas')
console.log('   - Solução: Usar useState<boolean>(false) em vez de useState(false)')

console.log('\n3. **Conflito de versões**:')
console.log('   - Múltiplas versões do React no bundle')
console.log('   - Solução: Verificar node_modules e package-lock.json')

console.log('\n4. **Problema de build**:')
console.log('   - Build corrompido ou cache inválido')
console.log('   - Solução: Limpar cache e rebuild')

// Verificar se há useState sem tipagem
console.log('\n🔍 Verificando useState sem tipagem explícita...')

const searchPatterns = [
  'useState(true)',
  'useState(false)',
  'useState(0)',
  'useState("")',
  'useState([])',
  'useState({})'
]

const filesToCheck = [
  'app/dashboard/page.tsx',
  'app/accounts/page.tsx',
  'app/campaigns/page.tsx',
  'app/templates/page.tsx',
  'app/settings/page.tsx',
  'components/accounts/ConnectFacebookModal.tsx',
  'components/accounts/AccountCard.tsx',
  'components/providers/FacebookSDK.tsx'
]

let foundIssues = false

filesToCheck.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath)
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8')
    
    searchPatterns.forEach(pattern => {
      if (content.includes(pattern)) {
        console.log(`  ❌ ${filePath}: ${pattern}`)
        foundIssues = true
      }
    })
  }
})

if (!foundIssues) {
  console.log('  ✅ Todos os useState estão com tipagem explícita')
}

// Soluções recomendadas
console.log('\n💡 Soluções recomendadas:')

console.log('\n1. **Limpar cache e rebuild**:')
console.log('   rm -rf .next')
console.log('   rm -rf node_modules/.cache')
console.log('   npm run build')

console.log('\n2. **Verificar Strict Mode**:')
console.log('   - Verificar se React.StrictMode está no layout')
console.log('   - Temporariamente desabilitar para teste')

console.log('\n3. **Verificar versões do React**:')
console.log('   npm ls react react-dom')

console.log('\n4. **Testar em modo de desenvolvimento**:')
console.log('   npm run dev')
console.log('   - Verificar console do navegador')
console.log('   - Procurar por warnings do React')

console.log('\n5. **Verificar se o erro ocorre em produção**:')
console.log('   npm run build')
console.log('   npm start')
console.log('   - Testar em modo de produção')

console.log('\n🎯 Próximos passos:')
console.log('1. Execute: npm run build')
console.log('2. Verifique se há erros de build')
console.log('3. Teste em modo de produção')
console.log('4. Verifique o console do navegador')
console.log('5. Se persistir, considere downgrade temporário do React 18') 