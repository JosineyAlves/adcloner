// Script para testar diretamente a API do Meta com métricas de conversão
// Execute com: node test-conversion-api.js

const https = require('https');

// Substitua pelo seu token de acesso real
const ACCESS_TOKEN = 'SEU_TOKEN_AQUI';

// ID da campanha que você quer testar
const CAMPAIGN_ID = '120226070874190406';

// Campos específicos de conversão para testar
const CONVERSION_FIELDS = [
  'conversions',
  'conversion_values', 
  'cost_per_conversion',
  'results',
  'impressions',
  'clicks',
  'spend'
].join(',');

// URL da API do Meta
const url = `https://graph.facebook.com/v23.0/${CAMPAIGN_ID}/insights?fields=${CONVERSION_FIELDS}&level=campaign&date_preset=maximum`;

console.log('🔍 Testando API do Meta para métricas de conversão...');
console.log('📋 URL:', url);
console.log('🎯 Campos solicitados:', CONVERSION_FIELDS);
console.log('');

// Função para fazer requisição HTTPS
function makeRequest(url, token) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Erro ao parsear JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Função principal de teste
async function testConversionAPI() {
  try {
    console.log('🚀 Fazendo requisição para a API do Meta...');
    
    const response = await makeRequest(url, ACCESS_TOKEN);
    
    console.log('✅ Resposta recebida:');
    console.log(JSON.stringify(response, null, 2));
    
    // Analisar especificamente as métricas de conversão
    if (response.data && response.data.length > 0) {
      const insights = response.data[0];
      
      console.log('\n📊 ANÁLISE DAS MÉTRICAS DE CONVERSÃO:');
      console.log('=====================================');
      
      console.log('🔄 Conversions:', insights.conversions);
      console.log('💰 Conversion Values:', insights.conversion_values);
      console.log('💵 Cost per Conversion:', insights.cost_per_conversion);
      console.log('🎯 Results:', insights.results);
      
      // Verificar se são arrays
      console.log('\n🔍 VERIFICAÇÃO DE TIPOS:');
      console.log('conversions é array?', Array.isArray(insights.conversions));
      console.log('conversion_values é array?', Array.isArray(insights.conversion_values));
      console.log('results é array?', Array.isArray(insights.results));
      
      // Se forem arrays, mostrar estrutura
      if (Array.isArray(insights.conversions)) {
        console.log('\n📋 Estrutura de conversions:');
        insights.conversions.forEach((conv, index) => {
          console.log(`  ${index + 1}. Action Type: ${conv.action_type}`);
          console.log(`     Value: ${conv.value}`);
          console.log(`     Tipo do value: ${typeof conv.value}`);
        });
      }
      
      if (Array.isArray(insights.conversion_values)) {
        console.log('\n📋 Estrutura de conversion_values:');
        insights.conversion_values.forEach((conv, index) => {
          console.log(`  ${index + 1}. Action Type: ${conv.action_type}`);
          console.log(`     Value: ${conv.value}`);
          console.log(`     Tipo do value: ${typeof conv.value}`);
        });
      }
      
      if (Array.isArray(insights.results)) {
        console.log('\n📋 Estrutura de results:');
        insights.results.forEach((result, index) => {
          console.log(`  ${index + 1}. Value: ${result.value}`);
          console.log(`     Tipo do value: ${typeof result.value}`);
        });
      }
      
    } else {
      console.log('❌ Nenhum dado de insights encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    
    if (error.message.includes('access token')) {
      console.log('\n💡 SOLUÇÃO:');
      console.log('1. Substitua "SEU_TOKEN_AQUI" pelo seu token de acesso real');
      console.log('2. Você pode obter o token de acesso através da interface do AdCloner');
      console.log('3. Ou através do Graph API Explorer: https://developers.facebook.com/tools/explorer/');
    }
  }
}

// Verificar se o token foi configurado
if (ACCESS_TOKEN === 'SEU_TOKEN_AQUI') {
  console.log('❌ ERRO: Token de acesso não configurado!');
  console.log('');
  console.log('📝 INSTRUÇÕES:');
  console.log('1. Abra o arquivo test-conversion-api.js');
  console.log('2. Substitua "SEU_TOKEN_AQUI" pelo seu token de acesso real');
  console.log('3. Execute novamente: node test-conversion-api.js');
  console.log('');
  console.log('🔑 Como obter o token:');
  console.log('- Através da interface do AdCloner (Network tab do navegador)');
  console.log('- Ou através do Graph API Explorer');
  console.log('- Ou através do Meta Business Manager');
} else {
  testConversionAPI();
}
