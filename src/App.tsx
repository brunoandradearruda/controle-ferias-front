import { useState } from 'react';
import { Toaster } from 'react-hot-toast'; 
import { TabelaFerias } from './components/TabelaFerias';
import { FormularioFerias } from './components/FormularioFerias';
import { FormularioServidor } from './components/FormularioServidor';
import { QuadroLotacao } from './components/QuadroLotacao';
import { PainelRiscoFerias } from './components/PainelRiscoFerias'; 
import { DashboardHome } from './components/DashboardHome'; 
import { 
  LayoutDashboard, 
  CalendarDays, 
  FilePlus, 
  UserPlus, 
  Building2, 
  LogOut,
  ShieldAlert,
  PieChart,
  ChevronLeft,
  ChevronRight,
  UserCircle
} from 'lucide-react';

export default function App() {
  const [telaAtiva, setTelaAtiva] = useState('inicio');
  const [sidebarExpandida, setSidebarExpandida] = useState(true);

  const renderizarTela = () => {
    switch (telaAtiva) {
      case 'inicio': return <DashboardHome />;
      case 'painel': return <TabelaFerias />;
      case 'painel_risco': return <PainelRiscoFerias />;
      case 'solicitar_ferias': return <FormularioFerias />;
      case 'cadastrar_servidor': return <FormularioServidor />;
      case 'lotacao': return <QuadroLotacao />;
      default: return <DashboardHome />;
    }
  };

  const renderizarMenuItem = (id: string, Icone: any, texto: string, extraClasses: string = "") => {
    const isAtivo = telaAtiva === id;
    return (
      <button
        type="button" // <-- Trava de segurança para evitar comportamentos inesperados
        onClick={() => setTelaAtiva(id)}
        title={!sidebarExpandida ? texto : ""}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
          ${sidebarExpandida ? 'justify-start' : 'justify-center'}
          ${isAtivo 
            ? 'bg-blue-50 text-blue-700 shadow-sm font-bold' // <-- Substituído por cores padrão do Tailwind
            : 'text-slate-500 hover:bg-slate-100 hover:text-blue-700 font-medium'
          } ${extraClasses}`}
      >
        <Icone 
          size={20} 
          className={`shrink-0 transition-colors duration-200 
            ${isAtivo ? 'text-blue-700' : 'text-slate-400 group-hover:text-blue-600'}`} 
        />
        {sidebarExpandida && (
          <span className="truncate whitespace-nowrap">{texto}</span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontWeight: 'bold', borderRadius: '12px' },
          success: { style: { background: '#ecfdf5', color: '#047857', border: '1px solid #10b981' } },
          error: { style: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #ef4444' } },
        }}
      />

      {/* ================= BARRA LATERAL (SIDEBAR) ================= */}
      <aside 
        className={`bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 ease-in-out hidden md:flex relative shrink-0
          ${sidebarExpandida ? 'w-64' : 'w-20'} 
        `}
      >
        {/* Botão Flutuante */}
        <button 
          type="button"
          onClick={() => setSidebarExpandida(prev => !prev)} // <-- Melhoria no React State para evitar congelamento
          className="absolute -right-3 top-7 bg-white border border-slate-200 shadow-sm p-1 rounded-full text-slate-400 hover:text-blue-700 hover:border-blue-300 transition-all z-50 cursor-pointer"
        >
          {sidebarExpandida ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Logo Section */}
        <div className="h-24 flex items-center justify-center border-b border-slate-100 shrink-0 p-4 transition-all duration-300">
          {sidebarExpandida ? (
            <div className="flex flex-col items-center animate-in fade-in duration-500 w-full">
              <img 
                src="/logo-pb.png" 
                alt="Governo da Paraíba" 
                className="w-full max-w-[150px] object-contain mb-2" 
              />
              <h1 className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] text-center">
                SEPLAG • Férias
              </h1>
            </div>
          ) : (
            <div className="bg-blue-700 p-2.5 rounded-xl shadow-sm shadow-blue-900/20 flex items-center justify-center">
              <LayoutDashboard className="text-white" size={22} />
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          
          <div>
            {sidebarExpandida && <p className="px-3 text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Gerencial</p>}
            <div className="space-y-1">
              {renderizarMenuItem('inicio', PieChart, 'Visão Executiva')}
              {renderizarMenuItem('lotacao', Building2, 'Quadro de Lotação')}
            </div>
          </div>

          <div>
            {sidebarExpandida && <p className="px-3 text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Operação</p>}
            <div className="space-y-1">
              {renderizarMenuItem('painel', CalendarDays, 'Painel de Férias')}
              {renderizarMenuItem('painel_risco', ShieldAlert, 'Auditoria de Risco', telaAtiva !== 'painel_risco' ? 'hover:bg-red-50 hover:text-red-700' : 'bg-red-50 text-red-700')}
            </div>
          </div>

          <div>
            {sidebarExpandida && <p className="px-3 text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Lançamentos</p>}
            <div className="space-y-1">
              {renderizarMenuItem('solicitar_ferias', FilePlus, 'Agendar Férias')}
              {renderizarMenuItem('cadastrar_servidor', UserPlus, 'Novo Servidor')}
            </div>
          </div>

        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button type="button" className={`w-full flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors font-medium text-sm group ${sidebarExpandida ? 'justify-start' : 'justify-center'}`}>
            <LogOut size={20} className="group-hover:text-red-500 transition-colors shrink-0" />
            {sidebarExpandida && <span className="truncate">Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      {/* ================= ÁREA DE CONTEÚDO (DIREITA) ================= */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50/50">
        
        {/* Cabeçalho Superior */}
        <header className="bg-white/80 backdrop-blur-md h-20 border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10 sticky top-0">
          
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {telaAtiva === 'inicio' && 'Visão Executiva'}
              {telaAtiva === 'painel' && 'Painel de Férias'}
              {telaAtiva === 'painel_risco' && 'Auditoria de Risco (Art. 79)'}
              {telaAtiva === 'solicitar_ferias' && 'Agendamento de Férias'}
              {telaAtiva === 'cadastrar_servidor' && 'Cadastro de Servidor'}
              {telaAtiva === 'lotacao' && 'Quadro de Lotação'}
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              {telaAtiva === 'inicio' && 'Métricas e acompanhamento geral do efetivo.'}
              {telaAtiva === 'painel' && 'Consulte as solicitações e histórico da folha.'}
              {telaAtiva === 'solicitar_ferias' && 'Preencha os dados para uma nova concessão.'}
              {telaAtiva === 'painel_risco' && 'Atenção aos prazos fatais iminentes.'}
              {telaAtiva === 'cadastrar_servidor' && 'Registre um novo servidor no sistema.'}
              {telaAtiva === 'lotacao' && 'Gestão de lotação por secretaria.'}
            </p>
          </div>
          
          {/* Perfil Pílula Flutuante */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-sm py-1.5 px-3 rounded-full cursor-pointer hover:shadow-md transition-all">
            <div className="bg-blue-50 p-1.5 rounded-full text-blue-700">
              <UserCircle size={22} />
            </div>
            <div className="hidden sm:flex flex-col pr-2">
              <span className="text-sm font-bold text-slate-700 leading-none mb-0.5">Bruno Arruda</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CGGP</span>
            </div>
          </div>
        </header>

        {/* Conteúdo Dinâmico (Removido o max-w-7xl fixo, agora com max-w-screen-2xl) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-screen-2xl mx-auto animate-in fade-in duration-500">
            {renderizarTela()}
          </div>
        </div>

      </main>
    </div>
  );
}