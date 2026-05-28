import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Users, UserMinus, UserCheck, Building2, History, X, CalendarPlus, Info } from 'lucide-react';

interface Servidor {
  id: number;
  matricula: string;
  nome: string;
  cargo: string;
  lotacao: string;
  ativo: boolean;
  motivoDesligamento?: string;
  dataAdmissao: string;
}

export function QuadroLotacao() {
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [carregando, setCarregando] = useState(true);

  // ---> ESTADOS DO MODAL DE PASSIVO <---
  const [modalPassivoAberto, setModalPassivoAberto] = useState(false);
  const [servidorParaPassivo, setServidorParaPassivo] = useState<Servidor | null>(null);
  const [anoSelecionado, setAnoSelecionado] = useState<number | ''>('');

  const buscarServidores = async () => {
    try {
      setCarregando(true);
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
    
    if (!motivo) return;

    try {
      await api.put(`/servidores/${id}/inativar`, { motivo });
      alert('✅ Servidor inativado com sucesso.');
      buscarServidores();
    } catch (error) {
      alert('❌ Erro ao inativar servidor.');
    }
  };

  const reativar = async (id: number) => {
    if (!window.confirm("Deseja reativar este servidor? Ele voltará a aparecer nas opções de férias.")) return;
    try {
      await api.put(`/servidores/${id}/reativar`);
      alert('✅ Servidor reativado.');
      buscarServidores();
    } catch (error) {
      alert('❌ Erro ao reativar servidor.');
    }
  };

  // =======================================================================
  // ---> LÓGICA DO PASSIVO (MODAL) <---
  // =======================================================================
  const abrirModalPassivo = (servidor: Servidor) => {
    setServidorParaPassivo(servidor);
    setAnoSelecionado(''); 
    setModalPassivoAberto(true);
  };

  const salvarPassivo = async () => {
    if (!anoSelecionado || !servidorParaPassivo) return;
    
    try {
      await api.post(`/servidores/${servidorParaPassivo.id}/periodos-acumulados`, { anoReferencia: anoSelecionado });
      
      alert(`✅ Período ${anoSelecionado - 1}/${anoSelecionado} para ${servidorParaPassivo.nome} adicionado com sucesso!`);
      setModalPassivoAberto(false);
      buscarServidores(); 
    } catch (error: any) {
      alert("❌ Erro: " + (error.response?.data?.message || "Não foi possível adicionar o período. Verifique se este ano já não foi adicionado."));
    }
  };

  const gerarOpcoesPeriodo = (dataAdmissaoString?: string) => {
    if (!dataAdmissaoString) return [];
    
    const anoAdmissao = parseInt(dataAdmissaoString.substring(0, 4), 10);
    const anoAtual = new Date().getFullYear();
    const opcoes = [];

    for (let ano = anoAdmissao + 1; ano <= anoAtual; ano++) {
      opcoes.push({
        texto: `${ano - 1}/${ano}`,
        valorEnvio: ano
      });
    }
    
    return opcoes.reverse();
  };
  // =======================================================================

  const servidoresPorSetor = servidores.reduce((grupos, servidor) => {
    const setor = servidor.lotacao || "Sem Lotação";
    if (!grupos[setor]) {
      grupos[setor] = [];
    }
    grupos[setor].push(servidor);
    return grupos;
  }, {} as Record<string, Servidor[]>);

  if (carregando) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mt-6 relative">
      
      {/* CABEÇALHO MODERNO */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-600 px-8 py-7 text-white">
        <div className="flex items-center gap-3">
          <Building2 className="text-blue-100" size={32} />
          <div>
            <h2 className="text-2xl font-bold">Quadro de Lotação - SEPLAG</h2>
            <p className="text-blue-100/90 text-sm mt-1 font-medium">
              Gerencie a base de servidores, status de atividade e histórico de férias atrasadas.
            </p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {Object.entries(servidoresPorSetor).map(([setor, lista]) => (
          <div key={setor} className="mb-10 last:mb-0">
            
            {/* CABEÇALHO DO SETOR */}
            <h3 className="text-lg font-bold text-gray-800 bg-gray-50 py-3.5 px-5 rounded-t-xl border border-gray-200 flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                {setor}
              </span>
              <span className="text-xs font-bold text-blue-800 bg-blue-100 border border-blue-200 py-1 px-3 rounded-full shadow-sm">
                {lista.length} {lista.length === 1 ? 'servidor' : 'servidores'}
              </span>
            </h3>
            
            {/* TABELA DE SERVIDORES COM LARGURAS FIXAS (table-fixed) */}
            <div className="border border-t-0 border-gray-200 rounded-b-xl overflow-hidden shadow-sm">
              <table className="min-w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    {/* Definindo a porcentagem exata para cada coluna (Soma = 100%) */}
                    <th className="w-[12%] px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Matrícula</th>
                    <th className="w-[30%] px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nome do Servidor</th>
                    <th className="w-[32%] px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cargo</th>
                    <th className="w-[10%] px-5 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-[16%] px-5 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-gray-50/30">
                  {lista.map((srv) => (
                    <tr key={srv.id} className={!srv.ativo ? "bg-red-50/20 opacity-80" : "hover:bg-blue-50/40 transition-colors duration-150"}>
                      <td className="px-5 py-4 text-sm text-gray-500 font-mono font-medium truncate" title={srv.matricula}>{srv.matricula}</td>
                      <td className="px-5 py-4 text-sm font-bold text-gray-800 break-words">{srv.nome}</td>
                      <td className="px-5 py-4 text-sm text-gray-600 font-medium break-words">{srv.cargo}</td>
                      <td className="px-5 py-4 text-center">
                        {srv.ativo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
                            <UserCheck size={14} /> Ativo
                          </span>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200 shadow-sm">
                              <UserMinus size={14} /> Inativo
                            </span>
                            <span className="text-[10px] font-bold text-red-500 mt-1.5 truncate max-w-[100px]" title={srv.motivoDesligamento}>
                              {srv.motivoDesligamento}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2.5">
                          {srv.ativo && (
                            <button 
                              onClick={() => abrirModalPassivo(srv)}
                              className="flex items-center gap-1.5 text-xs font-bold bg-amber-100 border border-amber-200 text-amber-700 hover:bg-amber-200 py-2 px-3 rounded-lg shadow-sm transition-all"
                              title="Adicionar saldo de férias de anos anteriores"
                            >
                              <History size={14} />
                              Passivo
                            </button>
                          )}
                          {srv.ativo ? (
                            <button 
                              onClick={() => inativar(srv.id, srv.nome)}
                              className="text-xs font-bold bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 px-3.5 rounded-lg shadow-sm transition-all"
                            >
                              Desligar
                            </button>
                          ) : (
                            <button 
                              onClick={() => reativar(srv.id)}
                              className="text-xs font-bold bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 py-2 px-3.5 rounded-lg shadow-sm transition-all"
                            >
                              Reativar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* ===================================================================== */}
      {/* MODAL DE ADIÇÃO DE FÉRIAS ATRASADAS (DESIGN PREMIUM)                  */}
      {/* ===================================================================== */}
      {modalPassivoAberto && servidorParaPassivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <CalendarPlus size={22} />
                Registrar Férias Pendentes
              </h3>
              <button onClick={() => setModalPassivoAberto(false)} className="text-amber-100 hover:text-white transition-colors bg-amber-700/30 hover:bg-amber-700/50 p-1.5 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-7">
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Servidor(a)</p>
                <p className="text-lg font-black text-gray-800">{servidorParaPassivo.nome}</p>
                {servidorParaPassivo.dataAdmissao && (
                  <div className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                    Admissão Oficial: {new Date(servidorParaPassivo.dataAdmissao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </div>
                )}
              </div>

              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 mb-6 flex gap-3 text-sm text-blue-800 shadow-sm">
                <Info className="shrink-0 mt-0.5 text-blue-500" size={18} />
                <p className="leading-relaxed font-medium text-xs">
                  Selecione abaixo o <strong>período aquisitivo</strong> (ciclo de trabalho) que gerou o direito a férias que ainda não foi usufruído.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Período Aquisitivo Pendente
                </label>
                <select 
                  value={anoSelecionado}
                  onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 bg-gray-50 hover:bg-white outline-none transition-all duration-200 cursor-pointer font-medium"
                >
                  <option value="">-- Selecione o Período --</option>
                  {gerarOpcoesPeriodo(servidorParaPassivo.dataAdmissao).map((opcao) => (
                    <option key={opcao.valorEnvio} value={opcao.valorEnvio}>
                      Período de Referência: {opcao.texto}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-gray-50 px-7 py-5 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setModalPassivoAberto(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={salvarPassivo}
                disabled={!anoSelecionado}
                className="px-6 py-2.5 text-sm font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-amber-500/30 flex items-center gap-2"
              >
                <History size={16} />
                Confirmar Inclusão
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}