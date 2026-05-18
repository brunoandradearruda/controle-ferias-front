import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Users, UserMinus, UserCheck, Building2 } from 'lucide-react';

interface Servidor {
  id: number;
  matricula: string;
  nome: string;
  cargo: string;
  lotacao: string;
  ativo: boolean;
  motivoDesligamento?: string;
}

export function QuadroLotacao() {
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [carregando, setCarregando] = useState(true);

  const buscarServidores = async () => {
    try {
      setCarregando(true);
      // Aqui usamos a rota que traz TODOS (ativos e inativos)
      const response = await api.get('/servidores');
      setServidores(response.data);
    } catch (error) {
      console.error("Erro ao buscar servidores:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarServidores();
  }, []);

  const inativar = async (id: number, nome: string) => {
    const motivo = window.prompt(`Desligamento do servidor: ${nome}\nInforme o motivo (Ex: Aposentadoria, Exoneração, Transferência):`);
    
    if (!motivo) return; // Se cancelar ou deixar em branco, aborta

    try {
      await api.put(`/servidores/${id}/inativar`, { motivo });
      alert('Servidor inativado com sucesso.');
      buscarServidores();
    } catch (error) {
      alert('Erro ao inativar servidor.');
    }
  };

  const reativar = async (id: number) => {
    if (!window.confirm("Deseja reativar este servidor? Ele voltará a aparecer nas opções de férias.")) return;
    try {
      await api.put(`/servidores/${id}/reativar`);
      alert('Servidor reativado.');
      buscarServidores();
    } catch (error) {
      alert('Erro ao reativar servidor.');
    }
  };

  // ---> A MÁGICA DO AGRUPAMENTO POR SETOR <---
  const servidoresPorSetor = servidores.reduce((grupos, servidor) => {
    const setor = servidor.lotacao || "Sem Lotação";
    if (!grupos[setor]) {
      grupos[setor] = [];
    }
    grupos[setor].push(servidor);
    return grupos;
  }, {} as Record<string, Servidor[]>);

  if (carregando) return <div className="p-8 text-center text-gray-500">Carregando quadro de lotação...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white border border-gray-100 rounded-xl shadow-sm mt-8">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <Building2 className="text-blue-700" size={28} />
        <h2 className="text-2xl font-bold text-gray-800">Quadro de Lotação - SEPLAG</h2>
      </div>

      {Object.entries(servidoresPorSetor).map(([setor, lista]) => (
        <div key={setor} className="mb-8">
          <h3 className="text-lg font-bold text-indigo-800 bg-indigo-50 py-2 px-4 rounded-t-lg border border-indigo-100 flex justify-between items-center">
            {setor}
            <span className="text-sm font-medium text-indigo-600 bg-indigo-200 py-0.5 px-2 rounded-full">
              {lista.length} {lista.length === 1 ? 'servidor' : 'servidores'}
            </span>
          </h3>
          
          <div className="border border-t-0 border-indigo-100 rounded-b-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Matrícula</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Cargo</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {lista.map((srv) => (
                  <tr key={srv.id} className={!srv.ativo ? "bg-red-50/30 opacity-75" : "hover:bg-gray-50"}>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{srv.matricula}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{srv.nome}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{srv.cargo}</td>
                    <td className="px-4 py-3 text-center">
                      {srv.ativo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                          <UserCheck size={14} /> Ativo
                        </span>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700">
                            <UserMinus size={14} /> Inativo
                          </span>
                          <span className="text-[10px] text-red-500 mt-1 truncate max-w-[120px]" title={srv.motivoDesligamento}>
                            {srv.motivoDesligamento}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {srv.ativo ? (
                        <button 
                          onClick={() => inativar(srv.id, srv.nome)}
                          className="text-xs bg-white border border-red-200 text-red-600 hover:bg-red-50 py-1.5 px-3 rounded shadow-sm transition"
                        >
                          Desligar
                        </button>
                      ) : (
                        <button 
                          onClick={() => reativar(srv.id)}
                          className="text-xs bg-white border border-green-200 text-green-600 hover:bg-green-50 py-1.5 px-3 rounded shadow-sm transition"
                        >
                          Reativar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}