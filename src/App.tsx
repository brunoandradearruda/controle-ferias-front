import { useState } from 'react';
import { TabelaFerias } from './components/TabelaFerias';
import { FormularioFerias } from './components/FormularioFerias';
import { FormularioServidor } from './components/FormularioServidor';
import { QuadroLotacao } from './components/QuadroLotacao';
import { 
  LayoutDashboard, 
  CalendarDays, 
  FilePlus, 
  UserPlus, 
  Building2, 
  LogOut 
} from 'lucide-react';

export default function App() {
  // Estado que controla qual tela está ativa. Começamos pelo 'painel'
  const [telaAtiva, setTelaAtiva] = useState('painel');

  // Função que decide qual componente renderizar no lado direito
  const renderizarTela = () => {
    switch (telaAtiva) {
      case 'painel':
        return <TabelaFerias />;
      case 'solicitar_ferias':
        return <FormularioFerias />;
      case 'cadastrar_servidor':
        return <FormularioServidor />;
      case 'lotacao':
        return <QuadroLotacao />;
      default:
        return <TabelaFerias />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* ================= BARRA LATERAL (SIDEBAR) ================= */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col shadow-xl z-10 hidden md:flex">
        
        {/* Cabeçalho / Logo do Sistema */}
        <div className="p-6 flex flex-col items-center border-b border-indigo-800">
          <div className="bg-white p-3 rounded-full mb-3 shadow-sm">
            <LayoutDashboard className="text-indigo-900" size={28} />
          </div>
          <h1 className="text-xl font-bold tracking-wide">SEPLAG PB</h1>
          <p className="text-indigo-300 text-xs mt-1 font-medium">Controle de Férias</p>
        </div>

        {/* Menu de Navegação Interativo */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          
          {/* Item 1: Painel Geral de Pedidos */}
          <button
            onClick={() => setTelaAtiva('painel')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm
              ${telaAtiva === 'painel' 
                ? 'bg-indigo-700 text-white shadow-md' 
                : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'}`}
          >
            <CalendarDays size={20} />
            Painel de Férias
          </button>

          {/* Item 2: Lançar Novo Pedido de Férias */}
          <button
            onClick={() => setTelaAtiva('solicitar_ferias')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm
              ${telaAtiva === 'solicitar_ferias' 
                ? 'bg-indigo-700 text-white shadow-md' 
                : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'}`}
          >
            <FilePlus size={20} />
            Solicitar Férias
          </button>

          {/* Item 3: Adicionar Novo Servidor ao Banco */}
          <button
            onClick={() => setTelaAtiva('cadastrar_servidor')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm
              ${telaAtiva === 'cadastrar_servidor' 
                ? 'bg-indigo-700 text-white shadow-md' 
                : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'}`}
          >
            <UserPlus size={20} />
            Cadastrar Servidor
          </button>

          {/* Item 4: Visão de Lotações e Desligamento */}
          <button
            onClick={() => setTelaAtiva('lotacao')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm
              ${telaAtiva === 'lotacao' 
                ? 'bg-indigo-700 text-white shadow-md' 
                : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'}`}
          >
            <Building2 size={20} />
            Quadro de Lotação
          </button>

        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-indigo-800">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-indigo-300 hover:text-white hover:bg-indigo-800 rounded-lg transition-colors text-sm font-medium">
            <LogOut size={18} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* ================= ÁREA DE CONTEÚDO (DIREITA) ================= */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Cabeçalho Fixo Superior */}
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-8 shadow-sm flex-shrink-0">
          <h2 className="text-gray-700 font-semibold text-lg">
            {telaAtiva === 'painel' && 'Gestão de Solicitações e Relatórios'}
            {telaAtiva === 'solicitar_ferias' && 'Lançar Pedido de Férias'}
            {telaAtiva === 'cadastrar_servidor' && 'Inclusão de Novo Servidor'}
            {telaAtiva === 'lotacao' && 'Visão Executiva de Pessoal'}
          </h2>
          
          {/* Perfil fictício do usuário logado */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex justify-center items-center text-indigo-700 font-bold text-sm">
              RH
            </div>
            <span className="text-sm font-medium text-gray-600 hidden sm:block">Recursos Humanos</span>
          </div>
        </header>

        {/* Conteúdo Dinâmico (Rolagem independente) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderizarTela()}
          </div>
        </div>

      </main>
    </div>
  );
}