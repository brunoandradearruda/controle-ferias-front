import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ClipboardList, RefreshCw, Check, X, Clock, AlertTriangle } from 'lucide-react'; // <-- Importamos o AlertTriangle

interface Solicitacao {
  id: number;
  dataInicioGozo: string;
  diasSolicitados: number;
  status: string;
  servidorNome: string;
  numeroPbdoc: string; // <-- Adicionado aqui
}
export function TabelaFerias() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);

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

  // ---> NOVA FUNÇÃO: Chamar a API de interrupção <---
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

  // ---> ATUALIZADO: Renderização do novo status <---
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

  return (
    <div className="bg-white p-6 border border-gray-100 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList className="text-blue-600" /> 
          Painel Geral de Pedidos
        </h2>
        <button 
          onClick={buscarHistoricoGeral}
          className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 py-1.5 px-3 rounded-lg transition"
        >
          <RefreshCw size={16} className={carregando ? "animate-spin" : ""} /> 
          Atualizar
        </button>
      </div>

      {carregando ? (
        <div className="flex justify-center items-center py-10">
          <RefreshCw className="animate-spin text-blue-500 mr-2" size={24} />
          <span className="text-gray-500 font-medium">Carregando dados...</span>
        </div>
      ) : solicitacoes.length === 0 ? (
        <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          Nenhum pedido de férias encontrado no sistema.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
             <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Servidor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PBDOC</th> {/* <-- Nova Coluna */}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Início</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dias</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {solicitacoes.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                    {item.servidorNome}
                  </td>
                  {/* ---> EXIBE O NÚMERO DO PBDOC <--- */}
                  <td className="px-4 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                    {item.numeroPbdoc || 'Não informado'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{formatarData(item.dataInicioGozo)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{item.diasSolicitados}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {renderStatus(item.status)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium flex justify-center items-center gap-2">
                    
                    {/* Botões de APROVAR e REJEITAR (Apenas para PENDENTES) */}
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

                    {/* ---> NOVO: Botão de INTERROMPER (Apenas para APROVADAS) <--- */}
                    {item.status === 'APROVADA' && (
                      <button 
                        onClick={() => interromperPedido(item.id)} 
                        title="Interromper Férias (Emergência/Calamidade)" 
                        className="bg-amber-100 hover:bg-amber-200 text-amber-700 p-1.5 rounded-md transition border border-amber-200 flex items-center gap-1"
                      >
                        <AlertTriangle size={18} />
                      </button>
                    )}

                    {/* Texto vazio caso não tenha ações disponíveis */}
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