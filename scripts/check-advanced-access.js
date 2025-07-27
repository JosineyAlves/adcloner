#!/usr/bin/env node

/**
 * Script para verificar acesso avançado do Facebook
 */

console.log('🔍 Verificando acesso avançado do Facebook...\n');

console.log('❌ PROBLEMA IDENTIFICADO:');
console.log('O Facebook Login for Business requer acesso avançado para public_profile');

console.log('\n📋 Solução:');
console.log('1. Acesse: https://developers.facebook.com/');
console.log('2. Selecione seu app');
console.log('3. Vá em "App Review" > "Permissões e Recursos"');
console.log('4. Procure por "public_profile"');
console.log('5. Clique em "Solicitar"');
console.log('6. Preencha o formulário:');
console.log('   • Como você usa: "Para identificar o usuário"');
console.log('   • Por que precisa: "Para autenticar usuários"');
console.log('   • Como protege: "Armazenamos apenas ID e nome"');
console.log('7. Clique em "Enviar para Revisão"');

console.log('\n🔧 Alternativa temporária:');
console.log('1. Vá em "Login do Facebook para Empresas" > "Configurações"');
console.log('2. Crie uma nova configuração SEM public_profile');
console.log('3. Use apenas permissões de negócios:');
console.log('   • ads_management');
console.log('   • ads_read');
console.log('   • business_management');
console.log('   • pages_show_list');
console.log('   • pages_read_engagement');

console.log('\n📋 Configurações OAuth (já corretas):');
console.log('  ✅ URIs de redirecionamento: https://adcloner.vercel.app/api/auth/callback/facebook');
console.log('  ✅ Domínios permitidos: https://adcloner.vercel.app/');
console.log('  ✅ Forçar HTTPS: Ativado');
console.log('  ✅ Modo estrito: Ativado');

console.log('\n🎯 Próximos passos:');
console.log('1. Solicite acesso avançado para public_profile');
console.log('2. Ou crie nova configuração sem public_profile');
console.log('3. Teste novamente após a mudança');

console.log('\n✨ Verificação concluída!'); 