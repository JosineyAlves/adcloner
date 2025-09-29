export default function TestCSSPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Teste de CSS
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Card Teste
            </h2>
            <p className="text-gray-600 mb-4">
              Este é um teste para verificar se o CSS está funcionando corretamente.
            </p>
            <button className="btn-primary">
              Botão Primário
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Card Alternativo
            </h2>
            <p className="text-gray-600 mb-4">
              Teste com classes Tailwind diretas.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">
              Botão Azul
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
