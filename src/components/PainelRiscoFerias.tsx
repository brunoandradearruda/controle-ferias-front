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
    <div className="max-w-7xl mx-auto mt-6">
      
      {/* CABEÇALHO MACRO (Identidade PB: Dark & Crimson) */}
      <div className="bg-slate-900 border-b-4 border-red-600 px-8 py-7 text-white rounded-t-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 p-3 rounded-xl border border-slate-700/50 shadow-inner">
            <ShieldAlert className="text-red-500" size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Painel de Risco (Art. 79)</h2>
            <p className="text-slate-400 text-sm mt-1 font-medium">
              Monitoramento de períodos aquisitivos vencidos ou próximos do limite legal de 24 meses.
            </p>
          </div>
        </div>

        {/* CARDS DE CONTAGEM */}
        <div className="flex gap-4 w-full md:w-auto">
          <div className="bg-slate-800/80 border border-red-900/50 rounded-xl p-4 flex items-center gap-4 min-w-[160px]">
            <div className="bg-red-500/10 p-2 rounded-lg text-red-500">
              <AlertOctagon size={24} />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{totalVermelho}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vencidos</p>
            </div>
          </div>
          <div className="bg-slate-800/80 border border-amber-900/30 rounded-xl p-4 flex items-center gap-4 min-w-[160px]">
            <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-3xl font-black text-white">{totalAmarelo}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">No 23º Mês</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 border-t-0 rounded-b-2xl shadow-sm p-6 min-h-[500px]">
        
        {/* BARRA DE PESQUISA */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search size={18} className="absolute inset-y-0 left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por servidor, matrícula ou setor..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-sm font-medium text-slate-700"
            />
          </div>
        </div>

        {/* LISTAGEM DE ALERTAS AGRUPADOS */}
        {carregando ? (
          <div className="flex flex-col justify-center items-center py-20 text-slate-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mb-4"></div>
            <p className="font-medium text-sm">Analisando prazos legais...</p>
          </div>
        ) : alertasFiltrados.length === 0 ? (
          <div className="text-center py-24 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <CalendarClock className="mx-auto h-14 w-14 text-emerald-300 mb-4" />
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
                <div key={setor} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  
                  {/* CABEÇALHO DO ACORDEÃO (SETOR) */}
                  <div 
                    onClick={() => toggleSetor(setor)}
                    className="bg-slate-50 hover:bg-slate-100/70 px-6 py-4 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-slate-200 text-slate-600 rounded-xl">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800">{setor}</h3>
                        <div className="flex gap-3 mt-1">
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
                    <div className="bg-white border-t border-slate-200 p-2">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Servidor</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Referência</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Saldo</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Data Limite Legal</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Situação</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {listaAlertas.map((alerta, index) => {
                              const isVermelho = alerta.nivelRisco === 'VERMELHO';
                              
                              return (
                                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-3.5">
                                    <div className="text-sm font-bold text-slate-800">{alerta.servidorNome}</div>
                                    <div className="text-xs font-medium text-slate-500 mt-0.5">Mat: {alerta.matricula}</div>
                                  </td>
                                  
                                  <td className="px-4 py-3.5 text-center">
                                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold font-mono">
                                      {alerta.anoReferencia - 1}/{alerta.anoReferencia}
                                    </span>
                                  </td>
                                  
                                  <td className="px-4 py-3.5 text-center">
                                    <span className="text-sm font-black text-slate-700">{alerta.saldoDias} dias</span>
                                  </td>

                                  <td className="px-4 py-3.5 text-center">
                                    <div className={`flex items-center justify-center gap-1.5 text-sm font-bold ${isVermelho ? 'text-red-600' : 'text-amber-600'}`}>
                                      <Clock size={14} />
                                      {formatarData(alerta.dataLimiteGozo)}
                                    </div>
                                  </td>

                                  <td className="px-4 py-3.5 text-center">
                                    {isVermelho ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-red-100 text-red-800 border border-red-200">
                                        <AlertOctagon size={14} /> ACUMULADA
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                        <AlertTriangle size={14} /> 23º MÊS
                                      </span>
                                    )}
                                  </td>

                                  <td className="px-4 py-3.5 text-center">
                                    <button 
                                      onClick={() => alert(`Funcionalidade futura: Redirecionar para tela de notificação da chefia para o servidor ${alerta.servidorNome}.`)}
                                      className="inline-flex items-center justify-center gap-1 w-full bg-white border border-slate-300 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold py-2 px-3 rounded-lg transition-all shadow-sm"
                                    >
                                      Cobrar
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