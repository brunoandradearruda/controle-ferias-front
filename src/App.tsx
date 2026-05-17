import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, UserPlus } from 'lucide-react';
import { FormularioFerias } from "./components/FormularioFerias";
import { TabelaFerias } from "./components/TabelaFerias";
import { FormularioServidor } from "./components/FormularioServidor";
import { DashboardCards } from "./components/DashboardCards"; // <-- Importamos os Cards

function PainelFerias() {
  return (
    <div>
      <header className="mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Painel de Férias</h2>
        <p className="text-gray-500 mt-2">Gerencie as solicitações e o histórico da SEPLAG.</p>
      </header>

      {/* ---> NOSSOS CARDS ENTRAM AQUI! <--- */}
      <DashboardCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1"><FormularioFerias /></div>
        <div className="lg:col-span-2"><TabelaFerias /></div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        
        <nav className="bg-blue-800 text-white shadow-md">
          <div className="container mx-auto px-4 max-w-7xl flex justify-between items-center h-16">
            <div className="flex items-center gap-2 font-bold text-xl tracking-wider">
              <CalendarDays className="text-blue-300" size={28} />
              <span>SEPLAG<span className="font-light text-blue-300">/PB</span></span>
            </div>
            
            <div className="flex space-x-6">
              <Link to="/" className="flex items-center gap-2 hover:text-blue-200 font-medium transition">
                <LayoutDashboard size={18} />
                <span>Painel</span>
              </Link>
              <Link to="/servidores" className="flex items-center gap-2 hover:text-blue-200 font-medium transition">
                <UserPlus size={18} />
                <span>Novo Servidor</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Routes>
            <Route path="/" element={<PainelFerias />} />
            <Route path="/servidores" element={<FormularioServidor />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;