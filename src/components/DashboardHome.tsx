import { useEffect, useState } from 'react';
import { Users, AlertTriangle, CalendarCheck, TrendingUp, X, CalendarClock, MousePointerClick } from 'lucide-react';
import { api } from '../services/api';

// Interface para estruturar os dados do Modal
interface ModalState {
  isOpen: boolean;
  titulo: string;
  icone: any;
  corHeader: string; 
  dados: any[];
}

export function DashboardHome() {
  const [metricas, setMetricas] = useState({
    totalServidores: 0,
    ativos: 0,
    emRisco: 0,
    emGozoAtual: 0,
    agendadasFuturas: 0
  });

  const [dadosSetor, setDadosSetor] = useState<any[]>([]);
  const [dadosProjecao, setDadosProjecao] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Listas reais armazenadas para o Drill-down (Modal)
  const [listaEfetivo, setListaEfetivo] = useState<any[]>([]);
  const [listaRisco, setListaRisco] = useState<any[]>([]);
  const [listaGozo, setListaGozo] = useState<any[]>([]);
  const [listaAgendadas, setListaAgendadas] = useState<any[]>([]);

  // Estado que controla o Modal de Detalhamento
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    titulo: '',
    icone: null,
    corHeader: '',
    dados: []
  });

  // Paleta de cores corporativa para os Setores
  const CORES_SETOR = [
    'bg-[#005aa9]',   // Azul PB
    'bg-blue-400',    // Azul secundário
    'bg-slate-600',   // Slate escuro
    'bg-emerald-500', // Esmeralda
    'bg-amber-500',   // Âmbar
    'bg-slate-400'    // Slate claro
  ];

  useEffect(() => {
    const carregarDadosReais = async () => {
      try {
        setLoading(true);
        
        // Chamada simultânea para as 3 fontes de dados do sistema
        const [resServidores, resSolicitacoes, resAlertas] = await Promise.all([
          api.get('/servidores').catch(() => ({ data: [] })),
          api.get('/solicitacoes').catch(() => ({ data: [] })),
          api.get('/alertas-risco').catch(() => ({ data: [] }))
        ]);

        const servidores = resServidores.data || [];
        const solicitacoes = resSolicitacoes.data || [];
        const alertas = resAlertas.data || [];

        // 1. DADOS DO EFETIVO E SETORES
        const total = servidores.length;
        const ativos = servidores.filter((s: any) => s.ativo).length;
        
        const contagemSetor: Record<string, number> = {};
        servidores.forEach((s: any) => {
          const setor = s.lotacao || 'Não Informada';
          contagemSetor[setor] = (contagemSetor[setor] || 0) + 1;
        });

        const formatadoSetor = Object.keys(contagemSetor)
          .map(key => ({ 
            name: key, 
            value: contagemSetor[key],
            percentual: total > 0 ? Math.round((contagemSetor[key] / total) * 100) : 0
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

        // 2. MATEMÁTICA DE DATAS (GOZO ATUAL E AGENDADAS) E PROJEÇÃO INTERATIVA
        const hojeDate = new Date();
        const hojeStr = new Date(hojeDate.getTime() - (hojeDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        const gozoArr: any[] = [];
        const agendadasArr: any[] = [];
        
        // Array base para a projeção dos próximos 6 meses (Agora guardando a lista de servidores em cada mês)
        const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const projecaoMap: Record<string, { count: number, listaServidores: any[] }> = {};
        const chavesMeses: string[] = [];
        
        for(let i = 0; i < 6; i++) {
          const m = new Date(hojeDate.getFullYear(), hojeDate.getMonth() + i, 1);
          const chave = `${m.getFullYear()}-${m.getMonth()}`;
          chavesMeses.push(chave);
          projecaoMap[chave] = { count: 0, listaServidores: [] };
        }

        solicitacoes.forEach((sol: any) => {
          if (sol.status === 'APROVADA' && sol.modalidade === 'GOZO') {
            const inicio = sol.dataInicioGozo;
            
            // Calculando data Fim
            const [a, m, d] = inicio.split('-').map(Number);
            const fimDate = new Date(a, m - 1, d);
            fimDate.setDate(fimDate.getDate() + sol.diasSolicitados - 1);
            const fimStr = fimDate.toISOString().split('T')[0];

            // Monta o objeto formatado para o modal
            const objParaModal = {
              ...sol,
              nome: sol.servidorNome,
              extraStr: `Início: ${inicio.split('-').reverse().join('/')}`,
              corExtra: 'bg-[#005aa9]/10 text-[#005aa9]'
            };

            // Verificação de Status
            if (inicio <= hojeStr && fimStr >= hojeStr) {
              gozoArr.push({ ...sol, nome: sol.servidorNome, dataFimFormatada: fimDate.toLocaleDateString('pt-BR'), extraStr: `Até ${fimDate.toLocaleDateString('pt-BR')}`, corExtra: 'bg-emerald-100 text-emerald-700' });
            } else if (inicio > hojeStr) {
              agendadasArr.push(objParaModal);
              
              // Incrementa a Projeção se cair nos próximos 6 meses
              const chaveAgendamento = `${a}-${m - 1}`;
              if (projecaoMap[chaveAgendamento]) {
                projecaoMap[chaveAgendamento].count++;
                projecaoMap[chaveAgendamento].listaServidores.push(objParaModal);
              }
            }
          }
        });

        // Formatando Projeção Visual Final
        let maxAgendadas = 10;
        Object.values(projecaoMap).forEach(val => { if (val.count > maxAgendadas) maxAgendadas = val.count; });
        
        const projecaoFinal = chavesMeses.map(chave => {
          const [anoStr, mesStr] = chave.split('-');
          return {
            mes: `${mesesNomes[Number(mesStr)]}/${anoStr.substring(2)}`,
            agendadas: projecaoMap[chave].count,
            maximo: maxAgendadas + 5,
            servidores: projecaoMap[chave].listaServidores
          };
        });

        // 3. ATUALIZANDO OS ESTADOS
        setListaEfetivo(servidores.map((s: any) => ({ ...s, extraStr: s.ativo ? 'Ativo' : 'Inativo', corExtra: s.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600' })));
        setListaRisco(alertas.map((a: any) => ({ ...a, nome: a.servidorNome, extraStr: a.nivelRisco, corExtra: a.nivelRisco === 'VERMELHO' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-300' })));
        setListaGozo(gozoArr);
        setListaAgendadas(agendadasArr);

        setDadosSetor(formatadoSetor);
        setDadosProjecao(projecaoFinal);
        
        setMetricas({
          totalServidores: total,
          ativos: ativos,
          emRisco: alertas.length, 
          emGozoAtual: gozoArr.length,
          agendadasFuturas: agendadasArr.length
        });

      } catch (error) {
        console.error('Erro ao processar dados do Dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosReais();
  }, []);

  // Abre Modal Padronizado dos Cards Superiores
  const abrirDetalhes = (tipo: 'EFETIVO' | 'RISCO' | 'GOZO' | 'AGENDADAS') => {
    switch (tipo) {
      case 'EFETIVO':
        if (listaEfetivo.length === 0) return;
        setModal({ isOpen: true, titulo: 'Detalhamento do Efetivo Total', icone: <Users size={22} />, corHeader: 'bg-[#005aa9]', dados: listaEfetivo });
        break;
      case 'RISCO':
        if (listaRisco.length === 0) return;
        setModal({ isOpen: true, titulo: 'Servidores em Risco (Art. 79)', icone: <AlertTriangle size={22} />, corHeader: 'bg-red-600', dados: listaRisco });
        break;
      case 'GOZO':
        if (listaGozo.length === 0) return;
        setModal({ isOpen: true, titulo: 'Servidores Atualmente em Férias', icone: <CalendarCheck size={22} />, corHeader: 'bg-emerald-600', dados: listaGozo });
        break;
      case 'AGENDADAS':
        if (listaAgendadas.length === 0) return;
        setModal({ isOpen: true, titulo: 'Férias Futuras Agendadas', icone: <CalendarClock size={22} />, corHeader: 'bg-indigo-500', dados: listaAgendadas });
        break;
    }
  };

  // Abre Modal Específico do Gráfico de Projeção
  const abrirDetalhesProjecaoMes = (mes: string, servidoresDoMes: any[]) => {
    if (servidoresDoMes.length === 0) return;
    setModal({ 
      isOpen: true, 
      titulo: `Férias Agendadas para ${mes}`, 
      icone: <CalendarClock size={22} />, 
      corHeader: 'bg-indigo-500', 
      dados: servidoresDoMes 
    });
  };

  const fecharModal = () => setModal({ ...modal, isOpen: false });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-32 flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#005aa9]"></div>
        <p className="text-slate-500 font-medium">Analisando histórico e calculando projeções da secretaria...</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-8">
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Visão Executiva</h1>
        <p className="text-slate-500 font-medium mt-1">Acompanhamento estatístico e panorama geral de férias</p>
      </div>

      {/* ================= CARDS SUPERIORES ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* EFETIVO */}
        <div 
          onClick={() => abrirDetalhes('EFETIVO')}
          className={`bg-white rounded-2xl p-6 border shadow-sm flex items-start gap-4 transition-all duration-200 ${metricas.totalServidores > 0 ? 'hover:shadow-md hover:border-[#005aa9]/30 hover:scale-[1.02] cursor-pointer border-slate-200 group' : 'border-slate-200 opacity-80 cursor-default'}`}
        >
          <div className="p-3 bg-[#005aa9]/10 rounded-xl text-[#005aa9] group-hover:bg-[#005aa9] group-hover:text-white transition-colors">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Efetivo Total</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1 leading-none">{metricas.totalServidores}</h3>
            <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">
              <TrendingUp size={14} /> {metricas.ativos} ativos
            </p>
          </div>
        </div>

        {/* RISCO */}
        <div 
          onClick={() => abrirDetalhes('RISCO')}
          className={`bg-white rounded-2xl p-6 border shadow-sm flex items-start gap-4 transition-all duration-200 ${metricas.emRisco > 0 ? 'hover:shadow-md hover:border-red-300 hover:scale-[1.02] cursor-pointer border-slate-200 group' : 'border-slate-200 opacity-80 cursor-default'}`}
        >
          <div className="p-3 bg-red-50 rounded-xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Risco (Art. 79)</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1 leading-none">{metricas.emRisco}</h3>
            <p className={`text-xs font-bold mt-2 ${metricas.emRisco > 0 ? 'text-red-500' : 'text-slate-400'}`}>Atenção recomendada</p>
          </div>
        </div>

        {/* EM GOZO ATUAL */}
        <div 
          onClick={() => abrirDetalhes('GOZO')}
          className={`bg-white rounded-2xl p-6 border shadow-sm flex items-start gap-4 transition-all duration-200 ${metricas.emGozoAtual > 0 ? 'hover:shadow-md hover:border-emerald-300 hover:scale-[1.02] cursor-pointer border-slate-200 group' : 'border-slate-200 opacity-80 cursor-default'}`}
        >
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <CalendarCheck size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Em Gozo Atual</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1 leading-none">{metricas.emGozoAtual}</h3>
            <p className="text-xs font-bold text-slate-500 mt-2">Férias ativas hoje</p>
          </div>
        </div>

        {/* AGENDADAS GERAIS */}
        <div 
          onClick={() => abrirDetalhes('AGENDADAS')}
          className={`bg-white rounded-2xl p-6 border shadow-sm flex items-start gap-4 transition-all duration-200 ${metricas.agendadasFuturas > 0 ? 'hover:shadow-md hover:border-indigo-300 hover:scale-[1.02] cursor-pointer border-slate-200 group' : 'border-slate-200 opacity-80 cursor-default'}`}
        >
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
            <CalendarClock size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Férias Futuras</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1 leading-none">{metricas.agendadasFuturas}</h3>
            <p className="text-xs font-bold text-slate-500 mt-2">Todos os períodos</p>
          </div>
        </div>

      </div>

      {/* ================= ÁREA DOS GRÁFICOS ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* GRÁFICO PROJEÇÃO DOS PRÓXIMOS 6 MESES COM CLIQUE */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm xl:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-slate-800">Projeção de Saídas (Próximos 6 meses)</h3>
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><MousePointerClick size={14}/> Clique na barra para detalhar</span>
          </div>
          <div className="space-y-3">
            {dadosProjecao.map((dado, index) => {
              const largura = Math.round((dado.agendadas / dado.maximo) * 100);
              const temGente = dado.agendadas > 0;
              
              return (
                <div 
                  key={index} 
                  onClick={() => abrirDetalhesProjecaoMes(dado.mes, dado.servidores)}
                  className={`flex items-center gap-4 py-2 px-3 rounded-xl transition-all duration-200 ${temGente ? 'cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-200 group' : 'opacity-80 border border-transparent'}`}
                >
                  <span className="w-20 text-sm font-bold text-slate-500 text-right group-hover:text-slate-800">{dado.mes}</span>
                  <div className="flex-1 h-7 bg-slate-100 rounded-full overflow-hidden flex items-center">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-3 ${temGente ? 'bg-[#005aa9] group-hover:bg-[#004785]' : 'bg-slate-200'}`}
                      style={{ width: `${largura}%` }}
                    >
                      {largura > 10 && <span className="text-white text-xs font-bold">{dado.agendadas}</span>}
                    </div>
                  </div>
                  <span className={`w-8 text-sm font-black ${temGente ? 'text-slate-800' : 'text-slate-300'}`}>{dado.agendadas}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRÁFICO SETORES */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-8">Distribuição por Setor</h3>
          <div className="space-y-6">
            {dadosSetor.length > 0 ? (
              dadosSetor.map((lot, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-slate-600 truncate pr-2" title={lot.name}>
                      {lot.name}
                    </span>
                    <span className="text-sm font-black text-slate-800">{lot.value} <span className="text-slate-400 font-medium ml-1">({lot.percentual}%)</span></span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${CORES_SETOR[idx % CORES_SETOR.length]}`}
                      style={{ width: `${lot.percentual}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-slate-400 font-medium mb-1">Nenhum servidor cadastrado.</p>
                <p className="text-slate-400 text-xs">Adicione servidores para gerar estatísticas.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ================= MODAL DE DETALHAMENTO ================= */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200">
            
            {/* Header do Modal Padronizado */}
            <div className={`px-6 py-5 flex items-center justify-between text-white ${modal.corHeader}`}>
              <h3 className="text-lg font-bold flex items-center gap-2">
                {modal.icone}
                {modal.titulo}
              </h3>
              <button 
                onClick={fecharModal}
                className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabela de Dados */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Matrícula</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Servidor</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lotação</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Situação / Período</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modal.dados.map((linha, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-mono font-bold text-slate-400">{linha.matricula || '-'}</td>
                      <td className="py-4 px-4 text-sm font-bold text-slate-800">{linha.nome}</td>
                      <td className="py-4 px-4 text-sm font-medium text-slate-600">{linha.lotacao || 'Não informada'}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg border shadow-sm ${linha.corExtra}`}>
                          {linha.extraStr}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200/60 flex justify-end">
              <button 
                onClick={fecharModal}
                className="bg-slate-100 text-slate-600 border border-slate-300 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors shadow-sm"
              >
                Fechar Painel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}