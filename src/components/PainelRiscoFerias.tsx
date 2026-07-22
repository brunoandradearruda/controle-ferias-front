import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Building2, 
  CalendarClock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AlertaFerias {
  servidorNome: string;
  matricula: string;
  lotacao: string;
  anoReferencia: number;
  saldoDias: number;
  dataLimiteGozo: string;
  nivelRisco: 'AMARELO' | 'VERMELHO';
}

export function PainelRiscoFerias() {
  const [alertas, setAlertas] = useState<AlertaFerias[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [setoresExpandidos, setSetoresExpandidos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    buscarAlertas();
  }, []);

  const buscarAlertas = async () => {
    try {
      setCarregando(true);
      const response = await api.get('/alertas-risco');
      setAlertas(response.data);
      
      // Expande automaticamente todos os setores ao carregar a tela inicial
      const setoresIniciais: Record<string, boolean> = {};
      response.data.forEach((alerta: AlertaFerias) => {
        const setor = alerta.lotacao || 'Sem Lotação';
        setoresIniciais[setor] = true;
      });
      setSetoresExpandidos(setoresIniciais);

    } catch (error) {
      console.error("Erro ao buscar alertas de risco:", error);
      toast.error("Erro ao carregar o painel de risco.");
    } finally {
      setCarregando(false);
    }
  };

  const toggleSetor = (setor: string) => {
    setSetoresExpandidos(prev => ({ ...prev, [setor]: !prev[setor] }));
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '--/--/----';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // Filtragem
  const alertasFiltrados = alertas.filter(alerta => 
    alerta.servidorNome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    alerta.matricula.toLowerCase().includes(termoBusca.toLowerCase()) ||
    (alerta.lotacao || '').toLowerCase().includes(termoBusca.toLowerCase())
  );

  // Agrupamento por Lotação
  const alertasAgrupados = alertasFiltrados.reduce((acc, alerta) => {
    const setor = alerta.lotacao || 'Sem Lotação';
    if (!acc[setor]) acc[setor] = [];
    acc[setor].push(alerta);
    return acc;
  }, {} as Record<string, AlertaFerias[]>);

  // Contadores para o painel superior
  const totalVermelho = alertas.filter(a => a.nivelRisco === 'VERMELHO').length;
  const totalAmarelo = alertas.filter(a => a.nivelRisco === 'AMARELO').length;

  return (
    // Removido max-w-7xl e mx-auto para manter a fluidez total da tela
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8 relative">
      
      {/* CABEÇALHO AZUL OFICIAL DA PB */}
      <div className="bg-[#005aa9] px-8 py-6 text-white transition-colors duration-500">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-blue-100" size={32} />
          <div>
            <h2 className="text-2xl font-black tracking-tight">Auditoria de Risco (Art. 79)</h2>
            <p className="text-blue-100/90 text-sm mt-1 font-medium">
              Monitoramento de períodos aquisitivos vencidos ou próximos do limite legal de 24 meses.
            </p>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS E MÉTRICAS DE RISCO */}
      <div className="px-8 py-5 border-b border-slate-200 bg-slate-50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        
        {/* BARRA DE PESQUISA */}
        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute inset-y-0 left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por servidor, matrícula ou setor..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-[#005aa9]/20 focus:border-[#005aa9] outline-none transition-all text-sm font-medium text-slate-700 shadow-sm"
          />
        </div>

        {/* CARDS DE CONTAGEM */}
        <div className="flex gap-4 w-full xl:w-auto">
          <div className="bg-white border border-red-200 shadow-sm rounded-xl px-4 py-2.5 flex items-center gap-3 min-w-[160px]">
            <div className="bg-red-50 p-2.5 rounded-lg text-red-600">
              <AlertOctagon size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 leading-none">{totalVermelho}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Vencidos</p>
            </div>
          </div>
          <div className="bg-white border border-amber-200 shadow-sm rounded-xl px-4 py-2.5 flex items-center gap-3 min-w-[160px]">
            <div className="bg-amber-50 p-2.5 rounded-lg text-amber-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 leading-none">{totalAmarelo}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">No 23º Mês</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-50/50 min-h-[500px]">
        
        {/* LISTAGEM DE ALERTAS AGRUPADOS */}
        {carregando ? (
          <div className="flex flex-col justify-center items-center py-20 text-slate-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#005aa9] mb-4"></div>
            <p className="font-medium text-sm">Analisando prazos legais...</p>
          </div>
        ) : alertasFiltrados.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm">
            <CalendarClock className="mx-auto h-14 w-14 text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">Tudo Regularizado!</h3>
            <p className="text-slate-500 text-sm mt-1">Nenhum servidor com férias na zona de risco no momento.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(alertasAgrupados).map(([setor, listaAlertas]) => {
              const isExpandido = setoresExpandidos[setor];
              const setorVermelhos = listaAlertas.filter(a => a.nivelRisco === 'VERMELHO').length;
              const setorAmarelos = listaAlertas.filter(a => a.nivelRisco === 'AMARELO').length;

              return (
                <div key={setor} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                  
                  {/* CABEÇALHO DO ACORDEÃO (SETOR) */}
                  <div 
                    onClick={() => toggleSetor(setor)}
                    className="bg-slate-50 hover:bg-slate-100/70 px-6 py-4 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white border border-slate-200 shadow-sm text-slate-600 rounded-xl">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800">{setor}</h3>
                        <div className="flex gap-3 mt-1.5">
                          {setorVermelhos > 0 && (
                            <span className="text-[10px] font-bold text-red-600 flex items-center gap-1"><AlertOctagon size={12}/> {setorVermelhos} Vencidos</span>
                          )}
                          {setorAmarelos > 0 && (
                            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1"><AlertTriangle size={12}/> {setorAmarelos} no 23º Mês</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-400">
                      {isExpandido ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </div>
                  </div>

                  {/* CORPO DO ACORDEÃO (LISTA DE SERVIDORES) */}
                  {isExpandido && (
                    <div className="bg-white border-t border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50/50">
                            <tr>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Servidor</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Referência</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Saldo</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Data Limite Legal</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Situação</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {listaAlertas.map((alerta, index) => {
                              const isVermelho = alerta.nivelRisco === 'VERMELHO';
                              
                              return (
                                <tr key={index} className="hover:bg-[#005aa9]/5 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-slate-800">{alerta.servidorNome}</div>
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Mat: {alerta.matricula}</div>
                                  </td>
                                  
                                  <td className="px-6 py-4 text-center">
                                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold font-mono">
                                      {alerta.anoReferencia - 1}/{alerta.anoReferencia}
                                    </span>
                                  </td>
                                  
                                  <td className="px-6 py-4 text-center">
                                    <span className="text-sm font-black text-slate-700">{alerta.saldoDias} dias</span>
                                  </td>

                                  <td className="px-6 py-4 text-center">
                                    <div className={`flex items-center justify-center gap-1.5 text-sm font-bold ${isVermelho ? 'text-red-600' : 'text-amber-600'}`}>
                                      <Clock size={16} />
                                      {formatarData(alerta.dataLimiteGozo)}
                                    </div>
                                  </td>

                                  <td className="px-6 py-4 text-center">
                                    {isVermelho ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black bg-red-100 text-red-800 border border-red-200 shadow-sm">
                                        <AlertOctagon size={14} /> ACUMULADA
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">
                                        <AlertTriangle size={14} /> 23º MÊS
                                      </span>
                                    )}
                                  </td>

                                  <td className="px-6 py-4 text-center">
                                    <button 
                                      onClick={() => toast('Funcionalidade em desenvolvimento: O servidor será notificado por email.', { icon: '📩' })}
                                      className="inline-flex items-center justify-center gap-1.5 w-full bg-white border border-slate-300 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-sm"
                                    >
                                      Cobrar Chefia
                                      <ArrowRight size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}