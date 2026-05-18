import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  RefreshCw, Check, X, Clock, AlertTriangle, FileDown, 
  Search, CalendarCheck, ChevronLeft, ChevronRight 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Solicitacao {
  id: number;
  dataInicioGozo: string;
  diasSolicitados: number;
  status: string;
  servidorNome: string;
  numeroPbdoc: string;
  lotacao: string;
  matricula: string;
}

export function TabelaFerias() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'EM_FERIAS' | 'PENDENTES'>('EM_FERIAS');

  // ---> NOVOS ESTADOS PARA PAGINAÇÃO <---
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5; // Aqui você define quantos aparecem por tela (coloquei 5 para você ver funcionando rápido)

  const buscarHistoricoGeral = async () => {
    try {
      setCarregando(true);
      const response = await api.get('/solicitacoes'); 
      setSolicitacoes(response.data);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarHistoricoGeral();
  }, []);

  // ---> RESET DA PÁGINA: Se o usuário digitar algo na busca ou trocar de aba, volta pra página 1
  useEffect(() => {
    setPaginaAtual(1);
  }, [termoBusca, filtroStatus]);

  // Funções de ação (Aprovar, Rejeitar, Interromper) mantidas...
  const aprovarPedido = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja APROVAR estas férias?")) return;
    try { await api.put(`/solicitacoes/${id}/aprovar`); buscarHistoricoGeral(); } 
    catch (error) { alert("❌ Erro ao aprovar."); }
  };

  const rejeitarPedido = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja REJEITAR? O saldo será devolvido.")) return;
    try { await api.put(`/solicitacoes/${id}/rejeitar`); buscarHistoricoGeral(); } 
    catch (error) { alert("❌ Erro ao rejeitar."); }
  };

  const interromperPedido = async (id: number) => {
    const confirmacao = window.prompt("⚠️ INTERRUPÇÃO (Art. 81)\nDigite 'CONFIRMAR' se houver calamidade ou necessidade:");
    if (confirmacao !== 'CONFIRMAR') return;
    try { await api.put(`/solicitacoes/${id}/interromper`); alert("🚨 Férias interrompidas."); buscarHistoricoGeral(); } 
    catch (error) { alert("❌ Erro ao interromper."); }
  };

  const calcularDataExata = (dataString: string, diasSomar: number = 0) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-').map(Number);
    const dataCalculada = new Date(ano, mes - 1, dia);
    dataCalculada.setDate(dataCalculada.getDate() + diasSomar);
    return dataCalculada.toLocaleDateString('pt-BR');
  };

  const renderStatus = (status: string) => {
    if (status === 'APROVADA') return <span className="inline-flex justify-center items-center gap-1 px-2.5 py-1 w-28 text-xs font-bold rounded-full bg-green-100 text-green-800"><Check size={14}/> APROVADA</span>;
    if (status === 'REJEITADA') return <span className="inline-flex justify-center items-center gap-1 px-2.5 py-1 w-28 text-xs font-bold rounded-full bg-red-100 text-red-800"><X size={14}/> REJEITADA</span>;
    if (status === 'INTERROMPIDA') return <span className="inline-flex justify-center items-center gap-1 px-2.5 py-1 w-32 text-xs font-bold rounded-full bg-purple-100 text-purple-800"><AlertTriangle size={14}/> INTERROMPIDA</span>;
    return <span className="inline-flex justify-center items-center gap-1 px-2.5 py-1 w-28 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800"><Clock size={14}/> PENDENTE</span>;
  };

  // 1. Aplica o Filtro primeiro
  const solicitacoesFiltradas = solicitacoes.filter((item) => {
    const termo = termoBusca.toLowerCase();
    const passaBusca = item.servidorNome.toLowerCase().includes(termo) || 
                       (item.matricula || '').toLowerCase().includes(termo) || 
                       (item.numeroPbdoc || '').toLowerCase().includes(termo) || 
                       (item.lotacao || '').toLowerCase().includes(termo);
    
    let passaAba = true;
    if (filtroStatus === 'EM_FERIAS') passaAba = item.status === 'APROVADA';
    if (filtroStatus === 'PENDENTES') passaAba = item.status === 'PENDENTE_CHEFIA';

    return passaBusca && passaAba;
  });

  // ---> 2. LÓGICA MATEMÁTICA DA PAGINAÇÃO <---
  const totalItens = solicitacoesFiltradas.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  const indiceUltimoItem = paginaAtual * itensPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
  
  // Fatiamos a lista para mostrar apenas os itens da página atual!
  const itensAtuais = solicitacoesFiltradas.slice(indicePrimeiroItem, indiceUltimoItem);

  const exportarParaPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Férias - SEPLAG/PB", 14, 20);

    const dataHoje = new Date().toLocaleDateString('pt-BR');
    doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(100);
    doc.text(`Gerado em: ${dataHoje} | Controle de Gestão | Filtro: ${filtroStatus}`, 14, 28);

    const colunas = ["Servidor", "Matrícula", "Lotação", "PBDOC", "Qtd", "Início", "Fim", "Retorno", "Status"];
    
    // O PDF sempre exporta TODAS as linhas filtradas (ignorando a paginação)
    const linhas = solicitacoesFiltradas.map(item => [
      item.servidorNome, item.matricula || '-', item.lotacao || 'Não informada', item.numeroPbdoc || '-',
      item.diasSolicitados.toString(), calcularDataExata(item.dataInicioGozo, 0),
      calcularDataExata(item.dataInicioGozo, item.diasSolicitados - 1),
      calcularDataExata(item.dataInicioGozo, item.diasSolicitados), item.status
    ]);

    autoTable(doc, {
      head: [colunas], body: linhas, startY: 35, theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5 }, headStyles: { fillColor: [30, 64, 175] },
    });

    doc.save(`Ferias_SEPLAG_${dataHoje.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="bg-white p-6 border border-gray-100 rounded-xl shadow-sm">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <CalendarCheck className="text-blue-600" /> 
          Painel de Férias
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setFiltroStatus('EM_FERIAS')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${filtroStatus === 'EM_FERIAS' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Em Férias</button>
            <button onClick={() => setFiltroStatus('PENDENTES')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${filtroStatus === 'PENDENTES' ? 'bg-white text-yellow-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Pendentes</button>
            <button onClick={() => setFiltroStatus('TODOS')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${filtroStatus === 'TODOS' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Histórico Completo</button>
          </div>

          <div className="relative flex-1 sm:w-56">
            <Search size={16} className="absolute inset-y-0 left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar Nome, Matrícula..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm outline-none"
            />
          </div>

          <button onClick={exportarParaPDF} disabled={solicitacoesFiltradas.length === 0} className="flex items-center gap-2 text-sm bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 py-1.5 px-3 rounded-lg transition disabled:opacity-50">
            <FileDown size={16} /> PDF
          </button>
          <button onClick={buscarHistoricoGeral} className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 py-1.5 px-3 rounded-lg transition">
            <RefreshCw size={16} className={carregando ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {carregando ? (
        <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-blue-500" size={24} /></div>
      ) : solicitacoesFiltradas.length === 0 ? (
        <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          Nenhum registro encontrado nesta visão.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Servidor / Informações</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Dias</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-blue-700">Data Início</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-red-600">Data Fim</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-green-700 bg-green-50/50">RETORNO</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                
                {/* ---> ATENÇÃO: Agora renderizamos os 'itensAtuais' fatiados e não mais todos <--- */}
                {itensAtuais.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-800">{item.servidorNome}</div>
                      <div className="text-xs font-medium text-gray-500 mt-0.5">Matrícula: {item.matricula || '-'}</div>
                      <div className="text-xs font-semibold text-indigo-600 mt-0.5">{item.lotacao || 'Lotação não informada'}</div>
                      <div className="text-xs font-mono text-gray-400 mt-0.5">PBDOC: {item.numeroPbdoc || '-'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">{item.diasSolicitados}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-blue-700">{calcularDataExata(item.dataInicioGozo, 0)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-red-600">{calcularDataExata(item.dataInicioGozo, item.diasSolicitados - 1)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-bold text-green-700 bg-green-50/30">{calcularDataExata(item.dataInicioGozo, item.diasSolicitados)}</td>
                    <td className="px-4 py-4 whitespace-nowrap"><div className="flex justify-center w-full">{renderStatus(item.status)}</div></td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {item.status === 'PENDENTE_CHEFIA' && (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => aprovarPedido(item.id)} title="Aprovar" className="bg-green-100 text-green-700 p-1.5 rounded-md hover:bg-green-200"><Check size={18} /></button>
                          <button onClick={() => rejeitarPedido(item.id)} title="Rejeitar" className="bg-red-100 text-red-700 p-1.5 rounded-md hover:bg-red-200"><X size={18} /></button>
                        </div>
                      )}
                      {item.status === 'APROVADA' && (
                        <button onClick={() => interromperPedido(item.id)} title="Interromper Férias" className="mx-auto bg-amber-100 text-amber-700 p-1.5 rounded-md hover:bg-amber-200 flex items-center"><AlertTriangle size={18} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ================= RODAPÉ COM OS BOTÕES DE PAGINAÇÃO ================= */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-1 justify-between sm:hidden">
                <button onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))} disabled={paginaAtual === 1} className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Anterior</button>
                <button onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))} disabled={paginaAtual === totalPaginas} className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Próxima</button>
              </div>
              
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{indicePrimeiroItem + 1}</span> até <span className="font-medium">{Math.min(indiceUltimoItem, totalItens)}</span> de <span className="font-medium">{totalItens}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                      disabled={paginaAtual === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Anterior</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {/* Renderiza os números das páginas dinamicamente */}
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                      <button
                        key={pagina}
                        onClick={() => setPaginaAtual(pagina)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                          pagina === paginaAtual 
                            ? "z-10 bg-indigo-600 text-white focus-visible:outline-indigo-600" 
                            : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pagina}
                      </button>
                    ))}

                    <button
                      onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                      disabled={paginaAtual === totalPaginas}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Próxima</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}