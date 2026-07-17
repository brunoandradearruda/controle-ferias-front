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
        onClick={() => setTelaAtiva(id)}
        title={!sidebarExpandida ? texto : ""}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
          ${sidebarExpandida ? 'justify-start' : 'justify-center'}
          ${isAtivo 
            ? 'bg-indigo-50 text-indigo-700 shadow-sm font-bold' 
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 font-medium'
          } ${extraClasses}`}
      >
        <Icone 
          size={20} 
          className={`shrink-0 transition-colors duration-200 
            ${isAtivo ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} 
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

      {/* ================= BARRA LATERAL (SIDEBAR MODERNA LIGHT) ================= */}
      <aside 
        className={`bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 ease-in-out hidden md:flex relative
          ${sidebarExpandida ? 'w-64' : 'w-20'}
        `}
      >
        {/* Botão Flutuante para Encolher/Expandir */}
        <button 
          onClick={() => setSidebarExpandida(!sidebarExpandida)}
          className="absolute -right-3 top-7 bg-white border border-slate-200 shadow-sm p-1 rounded-full text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all z-50"
        >
          {sidebarExpandida ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Logo Section */}
        <div className="h-20 flex items-center justify-center border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-sm shadow-indigo-200">
              <LayoutDashboard className="text-white" size={24} />
            </div>
            {sidebarExpandida && (
              <div className="flex flex-col animate-in fade-in duration-300">
                <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none mt-1">SEPLAG PB</h1>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">Férias</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          
          {/* Seção: GERENCIAL */}
          <div>
            {sidebarExpandida && <p className="px-3 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Gerencial</p>}
            <div className="space-y-1">
              {renderizarMenuItem('inicio', PieChart, 'Visão Executiva')}
              {renderizarMenuItem('lotacao', Building2, 'Quadro de Lotação')}
            </div>
          </div>

          {/* Seção: OPERAÇÃO & RISCO */}
          <div>
            {sidebarExpandida && <p className="px-3 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Operação</p>}
            <div className="space-y-1">
              {renderizarMenuItem('painel', CalendarDays, 'Painel de Férias')}
              
              {/* O Painel de Risco recebe uma cor diferenciada */}
              {renderizarMenuItem('painel_risco', ShieldAlert, 'Auditoria de Risco', telaAtiva !== 'painel_risco' ? 'hover:bg-red-50 hover:text-red-700' : 'bg-red-50 text-red-700')}
            </div>
          </div>

          {/* Seção: LANÇAMENTOS */}
          <div>
            {sidebarExpandida && <p className="px-3 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Lançamentos</p>}
            <div className="space-y-1">
              {renderizarMenuItem('solicitar_ferias', FilePlus, 'Agendar Férias')}
              {renderizarMenuItem('cadastrar_servidor', UserPlus, 'Novo Servidor')}
            </div>
          </div>

        </nav>

        {/* Rodapé da Sidebar (User Mini-Profile & Logout) */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors font-medium text-sm group ${sidebarExpandida ? 'justify-start' : 'justify-center'}`}>
            <LogOut size={20} className="group-hover:text-red-500 transition-colors" />
            {sidebarExpandida && <span>Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      {/* ================= ÁREA DE CONTEÚDO (DIREITA) ================= */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50/50">
        
        {/* Cabeçalho Superior Minimalista */}
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
            </p>
          </div>
          
          {/* Perfil Pílula Flutuante */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-sm py-1.5 px-2 rounded-full cursor-pointer hover:shadow-md transition-all">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex justify-center items-center">
              <UserCircle size={20} className="text-indigo-600" />
            </div>
            <div className="hidden sm:block pr-3">
              <span className="block text-xs font-bold text-slate-700 leading-none">Bruno Arruda</span>
              <span className="block text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">CGGP</span>
            </div>
          </div>
        </header>

        {/* Conteúdo Dinâmico */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {renderizarTela()}
          </div>
        </div>

      </main>
    </div>
  );
}