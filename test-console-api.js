// Script para testar a API do Meta diretamente no console do navegador
// Cole este código no console do navegador (F12 -> Console)

async function testMetaConversionAPI(accessToken, campaignId = '120226070874190406') {
    console.log('🔍 Testando API do Meta para métricas de conversão...');
    
    if (!accessToken) {
        console.error('❌ Token de acesso é obrigatório!');
        console.log('💡 Use: testMetaConversionAPI("SEU_TOKEN_AQUI")');
        return;
    }
    
    // Campos específicos de conversão
    const fields = [
        'results',
        'cost_per_conversion',
        'impressions',
        'clicks',
        'spend'
    ].join(',');
    
    const url = `https://graph.facebook.com/v23.0/${campaignId}/insights?fields=${fields}&level=campaign&date_preset=maximum`;
    
    console.log('📋 URL:', url);
    console.log('🎯 Campos solicitados:', fields);
    
    try {
        console.log('🚀 Fazendo requisição...');
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        console.log('✅ Resposta recebida:', data);
        
        if (data.error) {
            console.error('❌ Erro da API:', data.error);
            return;
        }
        
        // Analisar métricas de conversão
        if (data.data && data.data.length > 0) {
            const insights = data.data[0];
            
            console.log('\n📊 ANÁLISE DAS MÉTRICAS DE CONVERSÃO:');
            console.log('=====================================');
            
            console.log('💵 Cost per Conversion:', insights.cost_per_conversion);
            console.log('🎯 Results:', insights.results);
            
            // Verificar se são arrays
            console.log('\n🔍 VERIFICAÇÃO DE TIPOS:');
            console.log('results é array?', Array.isArray(insights.results));
            
            // Se for array, mostrar estrutura
            if (Array.isArray(insights.results)) {
                console.log('\n📋 Estrutura de results:');
                insights.results.forEach((result, index) => {
                    console.log(`  ${index + 1}. Indicator: ${result.indicator}`);
                    if (result.values && Array.isArray(result.values)) {
                        result.values.forEach((value, valueIndex) => {
                            console.log(`     ${valueIndex + 1}. Value: ${value.value}`);
                            console.log(`        Tipo do value: ${typeof value.value}`);
                        });
                    }
                });
            }
            
            // Testar processamento
            console.log('\n🧪 TESTE DE PROCESSAMENTO:');
            console.log('========================');
            
            // Simular o processamento que fazemos no código
            function processConversionMetric(resultsMetric) {
                if (!resultsMetric) return 0;
                
                if (Array.isArray(resultsMetric)) {
                    console.log(`📊 Processando array de resultados com ${resultsMetric.length} itens:`, resultsMetric);
                    return resultsMetric.reduce((total, result) => {
                        if (result.values && Array.isArray(result.values)) {
                            const resultValue = result.values.reduce((sum, valueObj) => {
                                const value = parseFloat(valueObj.value || '0');
                                console.log(`  - Indicator: ${result.indicator}, Value: ${value}`);
                                return sum + value;
                            }, 0);
                            return total + resultValue;
                        }
                        return total;
                    }, 0);
                }
                
                return parseFloat(resultsMetric.toString() || '0');
            }
            
            function processResultsMetric(resultsMetric) {
                if (!resultsMetric) return 0;
                
                if (Array.isArray(resultsMetric)) {
                    console.log(`📊 Processando array de resultados com ${resultsMetric.length} itens:`, resultsMetric);
                    return resultsMetric.reduce((total, result) => {
                        if (result.values && Array.isArray(result.values)) {
                            const resultValue = result.values.reduce((sum, valueObj) => {
                                const value = parseInt(valueObj.value || '0');
                                console.log(`  - Indicator: ${result.indicator}, Value: ${value}`);
                                return sum + value;
                            }, 0);
                            return total + resultValue;
                        }
                        return total;
                    }, 0);
                }
                
                return parseInt(resultsMetric.toString() || '0');
            }
            
            const processedConversions = processConversionMetric(insights.results);
            const processedConversionValues = processConversionMetric(insights.results);
            const processedResults = processResultsMetric(insights.results);
            
            console.log('\n📊 RESULTADOS DO PROCESSAMENTO:');
            console.log('==============================');
            console.log('Processed Conversions:', processedConversions);
            console.log('Processed Conversion Values:', processedConversionValues);
            console.log('Processed Results:', processedResults);
            
        } else {
            console.log('❌ Nenhum dado de insights encontrado');
        }
        
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
    }
}

// Instruções de uso
console.log('📝 INSTRUÇÕES DE USO:');
console.log('====================');
console.log('1. Execute: testMetaConversionAPI("SEU_TOKEN_AQUI")');
console.log('2. Ou com ID específico: testMetaConversionAPI("SEU_TOKEN_AQUI", "120226070874190406")');
console.log('');
console.log('💡 Como obter o token:');
console.log('- Abra o AdCloner e vá para a aba Network (F12)');
console.log('- Faça uma requisição para /api/meta-business/campaigns');
console.log('- Procure pelo header "Authorization: Bearer TOKEN"');
console.log('- Copie o TOKEN e cole no parâmetro da função');

// Exemplo de uso (descomente e substitua pelo seu token):
// testMetaConversionAPI("SEU_TOKEN_AQUI");
