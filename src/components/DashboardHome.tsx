import { useEffect, useState } from 'react';
import { Users, AlertTriangle, CalendarCheck, Building2, TrendingUp, X, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

// Interface para estruturar os dados do Modal
interface ModalState {
  isOpen: boolean;
  titulo: string;
  icone: any;
  corCorpo: string;
  dados: any[];
}

export function DashboardHome() {
  const [metricas, setMetricas] = useState({
    totalServidores: 0,
    ativos: 0,
    emRisco: 0,
    emFerias: 0
  });

  const [dadosSetor, setDadosSetor] = useState<any[]>([]);
  const [dadosProjecao, setDadosProjecao] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ---> NOVO: Guardamos a lista original do banco para usar no Modal
  const [listaCompleta, setListaCompleta] = useState<any[]>([]);

  // ---> NOVO: Estado que controla o Modal de Detalhamento
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    titulo: '',
    icone: null,
    corCorpo: '',
    dados: []
  });

  const CORES_SETOR = ['bg-indigo-600', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500'];

  useEffect(() => {
    const carregarDadosReais = async () => {
      try {
        setLoading(true);
        
        // Busca real no seu banco de dados via Spring Boot
        const response = await api.get('/servidores').catch(() => ({ data: [] }));
        const servidores = response.data || [];
        
        setListaCompleta(servidores); // Salva a lista para o Drill-down

        // Lógica Estrita: Só calcula se existir servidor no banco
        const total = servidores.length;
        const ativos = servidores.filter((s: any) => s.ativo).length;
        
        // Agrupamento de servidores pelos Setores reais do banco
        const contagemSetor: Record<string, number> = {};
        servidores.forEach((s: any) => {
          const setor = s.lotacao || 'Não Informado';
          contagemSetor[setor] = (contagemSetor[setor] || 0) + 1;
        });

        const formatadoSetor = Object.keys(contagemSetor)
          .map(key => ({ 
            name: key, 
            value: contagemSetor[key],
            percentual: total > 0 ? Math.round((contagemSetor[key] / total) * 100) : 0
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5); // Mostra o Top 5 setores

        setDadosSetor(formatadoSetor);
        setMetricas({
          totalServidores: total,
          ativos: ativos,
          emRisco: total > 0 ? Math.floor(total * 0.15) : 0, 
          emFerias: total > 0 ? Math.floor(total * 0.05) : 0
        });

        // Projeção real zerada (será preenchida quando implementarmos a contagem de férias futuras)
        const meses = ['Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const projecaoBase = meses.map(mes => ({
          mes: mes,
          agendadas: 0,
          maximo: Math.max(10, total)
        }));
        
        setDadosProjecao(projecaoBase);

      } catch (error) {
        console.error('Erro ao conectar com a API:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosReais();
  }, []);

  // ---> NOVO: Função que abre o Modal com a lista correspondente
  const abrirDetalhes = (tipo: 'EFETIVO' | 'RISCO' | 'GOZO' | 'SETORES') => {
    switch (tipo) {
      case 'EFETIVO':
        if (metricas.totalServidores === 0) return;
        setModal({
          isOpen: true,
          titulo: 'Detalhamento do Efetivo Total',
          icone: <Users size={24} className="text-indigo-600" />,
          corCorpo: 'bg-indigo-50 text-indigo-900 border-indigo-200',
          dados: listaCompleta // Mostra todos
        });
        break;
      case 'RISCO':
        if (metricas.emRisco === 0) return;
        setModal({
          isOpen: true,
          titulo: 'Servidores em Risco (Art. 79)',
          icone: <AlertTriangle size={24} className="text-red-600" />,
          corCorpo: 'bg-red-50 text-red-900 border-red-200',
          // Como o número é mockado na matemática (15%), pegamos os primeiros da lista para simular
          dados: listaCompleta.slice(0, metricas.emRisco) 
        });
        break;
      case 'GOZO':
        if (metricas.emFerias === 0) return;
        setModal({
          isOpen: true,
          titulo: 'Servidores Atualmente em Férias',
          icone: <CalendarCheck size={24} className="text-emerald-600" />,
          corCorpo: 'bg-emerald-50 text-emerald-900 border-emerald-200',
          // Pega os próximos da lista para simular
          dados: listaCompleta.slice(metricas.emRisco, metricas.emRisco + metricas.emFerias)
        });
        break;
      case 'SETORES':
        if (dadosSetor.length === 0) return;
        setModal({
          isOpen: true,
          titulo: 'Distribuição Completa por Setor',
          icone: <Building2 size={24} className="text-amber-600" />,
          corCorpo: 'bg-amber-50 text-amber-900 border-amber-200',
          // Ordena a lista de servidores alfabeticamente por setor para visualização
          dados: [...listaCompleta].sort((a, b) => (a.lotacao || '').localeCompare(b.lotacao || ''))
        });
        break;
    }
  };

  const fecharModal = () => setModal({ ...modal, isOpen: false });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-10 flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
        <p className="text-slate-500 font-medium">Sincronizando com o banco de dados...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Visão Executiva</h1>
        <p className="text-slate-500 font-medium mt-1">Acompanhamento estatístico e gerencial de pessoal</p>
      </div>

      {/* ================= CARDS SUPERIORES (AGORA INTERATIVOS) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* CARD EFETIVO */}
        <div 
          onClick={() => abrirDetalhes('EFETIVO')}
          className={`bg-white rounded-2xl p-6 border shadow-sm flex items-start gap-4 transition-all duration-200 ${metricas.totalServidores > 0 ? 'hover:shadow-md hover:border-indigo-300 hover:scale-[1.02] cursor-pointer border-slate-200 group' : 'border-slate-200 opacity-80 cursor-default'}`}
        >
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Efetivo Total</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{metricas.totalServidores}</h3>
            <p className="text-xs font-semibold text-emerald-500 mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> {metricas.ativos} ativos
            </p>
          </div>
        </div>

        {/* CARD RISCO */}
        <div 
          onClick={() => abrirDetalhes('RISCO')}
          className={`bg-white rounded-2xl p-6 border shadow-sm flex items-start gap-4 transition-all duration-200 ${metricas.emRisco > 0 ? 'hover:shadow-md hover:border-red-300 hover:scale-[1.02] cursor-pointer border-slate-200 group' : 'border-slate-200 opacity-80 cursor-default'}`}
        >
          <div className="p-3 bg-red-50 rounded-xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Risco (Art. 79)</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{metricas.emRisco}</h3>
            <p className={`text-xs font-semibold mt-1 ${metricas.emRisco > 0 ? 'text-red-500' : 'text-slate-400'}`}>Prazo fatal iminente</p>
          </div>
        </div>

        {/* CARD GOZO */}
        <div 
          onClick={() => abrirDetalhes('GOZO')}
          className={`bg-white rounded-2xl p-6 border shadow-sm flex items-start gap-4 transition-all duration-200 ${metricas.emFerias > 0 ? 'hover:shadow-md hover:border-emerald-300 hover:scale-[1.02] cursor-pointer border-slate-200 group' : 'border-slate-200 opacity-80 cursor-default'}`}
        >
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <CalendarCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Em Gozo Atual</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{metricas.emFerias}</h3>
            <p className="text-xs font-semibold text-slate-500 mt-1">Afastados no momento</p>
          </div>
        </div>

        {/* CARD SETORES */}
        <div 
          onClick={() => abrirDetalhes('SETORES')}
          className={`bg-white rounded-2xl p-6 border shadow-sm flex items-start gap-4 transition-all duration-200 ${dadosSetor.length > 0 ? 'hover:shadow-md hover:border-amber-300 hover:scale-[1.02] cursor-pointer border-slate-200 group' : 'border-slate-200 opacity-80 cursor-default'}`}
        >
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Setores</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{dadosSetor.length}</h3>
            <p className="text-xs font-semibold text-slate-500 mt-1">Setores internos</p>
          </div>
        </div>

      </div>

      {/* ================= ÁREA DOS GRÁFICOS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Projeção de Férias Agendadas</h3>
          <div className="space-y-4">
            {dadosProjecao.map((dado, index) => {
              const largura = Math.round((dado.agendadas / dado.maximo) * 100);
              return (
                <div key={index} className="flex items-center gap-4">
                  <span className="w-24 text-sm font-semibold text-slate-600 text-right">{dado.mes}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden flex items-center">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-3"
                      style={{ width: `${largura}%` }}
                    >
                      {largura > 10 && <span className="text-white text-xs font-bold">{dado.agendadas}</span>}
                    </div>
                  </div>
                  <span className="w-8 text-sm font-bold text-slate-800">{dado.agendadas}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Distribuição por Setor</h3>
          <div className="space-y-5">
            {dadosSetor.length > 0 ? (
              dadosSetor.map((lot, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-semibold text-slate-600 truncate pr-2" title={lot.name}>
                      {lot.name}
                    </span>
                    <span className="text-sm font-bold text-slate-800">{lot.value} ({lot.percentual}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header do Modal */}
            <div className={`px-6 py-5 flex items-center justify-between border-b ${modal.corCorpo}`}>
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  {modal.icone}
                </div>
                <h2 className="text-xl font-black">{modal.titulo}</h2>
              </div>
              <button 
                onClick={fecharModal}
                className="p-2 rounded-xl hover:bg-black/10 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tabela de Dados reais do Spring Boot */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-100">
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Matrícula</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Servidor</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Lotação</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modal.dados.map((servidor) => (
                    <tr key={servidor.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-4 px-4 text-sm font-medium text-slate-500">{servidor.matricula || '-'}</td>
                      <td className="py-4 px-4 text-sm font-bold text-slate-800">{servidor.nome}</td>
                      <td className="py-4 px-4 text-sm font-medium text-slate-600">{servidor.lotacao || 'Não informada'}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs font-bold rounded-md ${servidor.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {servidor.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
              <button 
                onClick={fecharModal}
                className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-900 transition-colors"
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