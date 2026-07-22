import { 
  PieChart, 
  Users, 
  CalendarDays, 
  ShieldAlert, 
  PlusSquare, 
  UserPlus, 
  LogOut 
} from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 hidden lg:flex">
      
      {/* CABEÇALHO COM A LOGO DO GOVERNO DA PARAÍBA */}
      <div className="p-6 flex flex-col items-center border-b border-slate-100">
        <img 
          src="/logo-pb.png" 
          alt="Governo da Paraíba" 
          className="w-full max-w-[180px] object-contain mb-4" 
        />
        <h1 className="text-[11px] font-bold text-slate-400 tracking-[0.2em] text-center uppercase">
          SEPLAG • Controle de Férias
        </h1>
      </div>

      {/* NAVEGAÇÃO DOS MÓDULOS */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
        
        <div>
          <h3 className="text-xs font-bold text-slate-400 mb-3 ml-3 uppercase tracking-wider">Gerencial</h3>
          <ul className="space-y-1">
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-[#005aa9] transition-colors font-medium text-sm">
                <PieChart size={18} />
                Visão Executiva
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-[#005aa9] transition-colors font-medium text-sm">
                <Users size={18} />
                Quadro de Lotação
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 mb-3 ml-3 uppercase tracking-wider">Operação</h3>
          <ul className="space-y-1">
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-[#005aa9] transition-colors font-medium text-sm">
                <CalendarDays size={18} />
                Painel de Férias
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-[#005aa9] transition-colors font-medium text-sm">
                <ShieldAlert size={18} />
                Auditoria de Risco
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 mb-3 ml-3 uppercase tracking-wider">Lançamentos</h3>
          <ul className="space-y-1">
            <li>
              {/* O Menu Agendar Férias ganha o foco com a cor oficial */}
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#005aa9]/10 text-[#005aa9] font-bold text-sm">
                <PlusSquare size={18} />
                Agendar Férias
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-[#005aa9] transition-colors font-medium text-sm">
                <UserPlus size={18} />
                Novo Servidor
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* RODAPÉ: SAIR */}
      <div className="p-4 border-t border-slate-100">
        <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors font-medium text-sm">
          <LogOut size={18} />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}