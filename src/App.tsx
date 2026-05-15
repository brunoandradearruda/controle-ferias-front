import { FormularioFerias } from "./components/FormularioFerias";
import { TabelaFerias } from "./components/TabelaFerias";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Cabeçalho */}
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            SEPLAG-PB
          </h1>
          <p className="text-gray-500 mt-2">Sistema Integrado de Controle de Férias</p>
        </header>
        
        {/* Layout Principal em Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna da Esquerda: Formulário (Ocupa 1 parte) */}
          <div className="lg:col-span-1">
            <FormularioFerias />
          </div>

          {/* Coluna da Direita: Tabela (Ocupa 2 partes) */}
          <div className="lg:col-span-2">
            <TabelaFerias />
          </div>

        </div>

      </div>
    </div>
  );
}

export default App;