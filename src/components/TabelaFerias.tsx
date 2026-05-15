import { useEffect, useState } from 'react';
import { api } from '../services/api';

// 1. Tipagem baseada no DTO (Response) que criamos no Java
interface Solicitacao {
  id: number;
  dataInicioGozo: string;
  diasSolicitados: number;
  abonoPecuniario: boolean;
  status: string;
}

export function TabelaFerias() {
  // Estado que vai guardar a lista de férias vindas do banco
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  // 2. Função para buscar os dados na nossa API (método GET)
  const buscarHistorico = async () => {
    try {
      const response = await api.get('/periodos/1/solicitacoes');
      setSolicitacoes(response.data);
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
    } finally {
      setCarregando(false);
    }
  };

  // 3. Executa a busca assim que o componente aparece na tela
  useEffect(() => {
    buscarHistorico();
  }, []);

  // Formata a data de AAAA-MM-DD para DD/MM/AAAA (padrão Brasil)
  const formatarData = (dataString: string) => {
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="mt-10 bg-white p-6 border rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Histórico de Solicitações</h2>
        <button 
          onClick={buscarHistorico}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded"
        >
          ↻ Atualizar Tabela
        </button>
      </div>

      {carregando ? (
        <p className="text-gray-500 text-center py-4">Carregando dados...</p>
      ) : solicitacoes.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Nenhuma solicitação encontrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Início do Gozo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dias</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abono?</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {solicitacoes.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatarData(item.dataInicioGozo)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.diasSolicitados}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.abonoPecuniario ? 'Sim' : 'Não'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {item.status.replace('_', ' ')}
                    </span>
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