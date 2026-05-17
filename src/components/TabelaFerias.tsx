import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ClipboardList, RefreshCw, Check, X, Clock, AlertTriangle, FileDown, Search } from 'lucide-react'; // <-- Search adicionado
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Solicitacao {
  id: number;
  dataInicioGozo: string;
  diasSolicitados: number;
  status: string;
  servidorNome: string;
  numeroPbdoc: string;
}

export function TabelaFerias() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // ---> NOVO: Estado para guardar o que o usuário digita na busca <---
  const [termoBusca, setTermoBusca] = useState('');

  const buscarHistoricoGeral = async () => {
    try {
      setCarregando(true);
      const response = await api.get('/solicitacoes'); 
      setSolicitacoes(response.data);
    } catch (error) {
      console.error("Erro ao buscar histórico geral:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarHistoricoGeral();
  }, []);

  const aprovarPedido = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja APROVAR estas férias?")) return;
    try {
      await api.put(`/solicitacoes/${id}/aprovar`);
      buscarHistoricoGeral(); 
    } catch (error) {
      alert("❌ Erro ao aprovar.");
    }
  };

  const rejeitarPedido = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja REJEITAR? O saldo será devolvido ao servidor.")) return;
    try {
      await api.put(`/solicitacoes/${id}/rejeitar`);
      buscarHistoricoGeral(); 
    } catch (error) {
      alert("❌ Erro ao rejeitar.");
    }
  };

  const interromperPedido = async (id: number) => {
    const confirmacao = window.prompt("⚠️ INTERRUPÇÃO (Art. 81)\nDigite 'CONFIRMAR' se houver calamidade ou necessidade do serviço público:");
    if (confirmacao !== 'CONFIRMAR') return;
    
    try {
      await api.put(`/solicitacoes/${id}/interromper`);
      alert("🚨 Férias interrompidas com sucesso. Os dias não gozados foram devolvidos ao saldo do servidor.");
      buscarHistoricoGeral(); 
    } catch (error: any) {
      const msg = error.response?.data || "Erro ao interromper.";
      alert("❌ " + msg);
    }
  };

  const formatarData = (dataString: string) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const renderStatus = (status: string) => {
    if (status === 'APROVADA') {
      return (
        <span className="px-2.5 py-1 inline-flex items-center gap-1 text-xs leading-5 font-bold rounded-full bg-green-100 text-green-800">
          <Check size={14} /> APROVADA
        </span>
      );
    }
    if (status === 'REJEITADA') {
      return (
        <span className="px-2.5 py-1 inline-flex items-center gap-1 text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800">
          <X size={14} /> REJEITADA
        </span>
      );
    }
    if (status === 'INTERROMPIDA') {
      return (
        <span className="px-2.5 py-1 inline-flex items-center gap-1 text-xs leading-5 font-bold rounded-full bg-purple-100 text-purple-800">
          <AlertTriangle size={14} /> INTERROMPIDA
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 inline-flex items-center gap-1 text-xs leading-5 font-bold rounded-full bg-yellow-100 text-yellow-800">
        <Clock size={14} /> PENDENTE
      </span>
    );
  };

  // ---> NOVA FUNÇÃO: O Filtro Inteligente <---
  // O JavaScript cria uma lista nova em tempo real baseada no que foi digitado
  const solicitacoesFiltradas = solicitacoes.filter((item) => {
    const termo = termoBusca.toLowerCase();
    const nome = item.servidorNome.toLowerCase();
    const pbdoc = (item.numeroPbdoc || '').toLowerCase();
    
    // Retorna verdadeiro se o termo estiver no nome OU no número do PBDOC
    return nome.includes(termo) || pbdoc.includes(termo);
  });

  const exportarParaPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório Geral de Férias - SEPLAG/PB", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${dataHoje} | Controle de Gestão`, 14, 28);

    const colunas = ["Servidor", "PBDOC", "Início", "Dias", "Status"];
    
    // ---> ATUALIZADO: O PDF agora usa a lista filtrada em vez da lista completa!
    const linhas = solicitacoesFiltradas.map(item => [
      item.servidorNome,
      item.numeroPbdoc || 'Não informado',
      formatarData(item.dataInicioGozo),
      item.diasSolicitados.toString(),
      item.status
    ]);

    autoTable(doc, {
      head: [colunas],
      body: linhas,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });

    doc.save(`Relatorio_Ferias_SEPLAG_${dataHoje.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="bg-white p-6 border border-gray-100 rounded-xl shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList className="text-blue-600" /> 
          Painel Geral
        </h2>
        
        {/* ---> NOVO: Agrupamento da Barra de Busca e Botões <--- */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          
          {/* O Input de Busca */}
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar Nome ou PBDOC..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="block w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm transition outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={exportarParaPDF}
              disabled={solicitacoesFiltradas.length === 0}
              className="flex items-center justify-center gap-2 text-sm bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 py-1.5 px-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown size={16} /> 
              Exportar
            </button>

            <button 
              onClick={buscarHistoricoGeral}
              className="flex items-center justify-center gap-2 text-sm bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 py-1.5 px-3 rounded-lg transition"
            >
              <RefreshCw size={16} className={carregando ? "animate-spin" : ""} /> 
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {carregando ? (
        <div className="flex justify-center items-center py-10">
          <RefreshCw className="animate-spin text-blue-500 mr-2" size={24} />
          <span className="text-gray-500 font-medium">Carregando dados...</span>
        </div>
      ) : solicitacoesFiltradas.length === 0 ? (
        <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          {termoBusca 
            ? `Nenhum resultado encontrado para "${termoBusca}".` 
            : "Nenhum pedido de férias encontrado no sistema."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Servidor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PBDOC</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Início</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dias</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              
              {/* ---> ATUALIZADO: A tabela agora mapeia a lista filtrada <--- */}
              {solicitacoesFiltradas.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                    {item.servidorNome}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                    {item.numeroPbdoc || 'Não informado'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{formatarData(item.dataInicioGozo)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{item.diasSolicitados}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {renderStatus(item.status)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium flex justify-center items-center gap-2">
                    
                    {item.status === 'PENDENTE_CHEFIA' && (
                      <>
                        <button onClick={() => aprovarPedido(item.id)} title="Aprovar" className="bg-green-100 hover:bg-green-200 text-green-700 p-1.5 rounded-md transition border border-green-200">
                          <Check size={18} />
                        </button>
                        <button onClick={() => rejeitarPedido(item.id)} title="Rejeitar" className="bg-red-100 hover:bg-red-200 text-red-700 p-1.5 rounded-md transition border border-red-200">
                          <X size={18} />
                        </button>
                      </>
                    )}

                    {item.status === 'APROVADA' && (
                      <button 
                        onClick={() => interromperPedido(item.id)} 
                        title="Interromper Férias (Emergência/Calamidade)" 
                        className="bg-amber-100 hover:bg-amber-200 text-amber-700 p-1.5 rounded-md transition border border-amber-200 flex items-center gap-1"
                      >
                        <AlertTriangle size={18} />
                      </button>
                    )}

                    {['REJEITADA', 'INTERROMPIDA'].includes(item.status) && (
                      <span className="text-gray-400 text-xs italic">Encerrado</span>
                    )}

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}