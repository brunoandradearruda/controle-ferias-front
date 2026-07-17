import { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { 
  Users, UserMinus, UserCheck, Building2, History, X, CalendarPlus, 
  Info, FileText, Check, PauseCircle, CalendarOff, Search, ChevronDown, 
  ChevronRight, Pencil, Save, UserCog 
} from 'lucide-react';
import { DossieServidor } from './DossieServidor'; 

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

  // ---> ESTADOS DA BUSCA E ACORDEÃO <---
  const [termoBusca, setTermoBusca] = useState('');
  const [setoresRecolhidos, setSetoresRecolhidos] = useState<Record<string, boolean>>({});

  // ---> ESTADOS DO MODAL DE EDIÇÃO <---
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [servidorEditando, setServidorEditando] = useState<Partial<Servidor>>({});
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // ---> ESTADOS DO MODAL DE PASSIVO <---
  const [modalPassivoAberto, setModalPassivoAberto] = useState(false);
  const [servidorParaPassivo, setServidorParaPassivo] = useState<Servidor | null>(null);
  const [periodosSelecionados, setPeriodosSelecionados] = useState<number[]>([]); 
  const [salvandoPassivo, setSalvandoPassivo] = useState(false); 
  const [periodosJaRegistrados, setPeriodosJaRegistrados] = useState<number[]>([]);
  const [carregandoPeriodos, setCarregandoPeriodos] = useState(false);

  // ---> ESTADOS DO MODAL DE DOSSIÊ/HISTÓRICO <---
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [servidorParaHistorico, setServidorParaHistorico] = useState<Servidor | null>(null);

  // ---> ESTADOS DO MODAL DE AFASTAMENTO <---
  const [modalAfastamentoAberto, setModalAfastamentoAberto] = useState(false);
  const [servidorParaAfastamento, setServidorParaAfastamento] = useState<Servidor | null>(null);
  const [tipoAfastamento, setTipoAfastamento] = useState('');
  const [dataInicioAfastamento, setDataInicioAfastamento] = useState('');
  const [dataFimAfastamento, setDataFimAfastamento] = useState('');
  const [salvandoAfastamento, setSalvandoAfastamento] = useState(false);

  // =======================================================================
  // ---> BUSCA INICIAL E AÇÕES BÁSICAS <---
  // =======================================================================
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
  // ---> LÓGICA DE EDIÇÃO DO SERVIDOR <---
  // =======================================================================
  const abrirModalEdicao = (servidor: Servidor) => {
    setServidorEditando({ ...servidor });
    setModalEdicaoAberto(true);
  };

  const salvarEdicao = async () => {
    if (!servidorEditando.nome || !servidorEditando.matricula || !servidorEditando.lotacao) {
      alert("Nome, matrícula e setor são obrigatórios.");
      return;
    }

    try {
      setSalvandoEdicao(true);
      await api.put(`/servidores/${servidorEditando.id}`, {
        nome: servidorEditando.nome,
        matricula: servidorEditando.matricula,
        cargo: servidorEditando.cargo,
        lotacao: servidorEditando.lotacao,
        dataAdmissao: servidorEditando.dataAdmissao
      });
      
      alert('✅ Dados do servidor atualizados com sucesso!');
      setModalEdicaoAberto(false);
      buscarServidores(); 
    } catch (error: any) {
      console.error(error);
      alert('❌ Erro ao atualizar servidor: ' + (error.response?.data?.message || 'Erro desconhecido.'));
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const handleEdicaoChange = (campo: keyof Servidor, valor: string) => {
    setServidorEditando(prev => ({ ...prev, [campo]: valor }));
  };

  // =======================================================================
  // ---> LÓGICA DO PASSIVO EM LOTE <---
  // =======================================================================
  const abrirModalPassivo = async (servidor: Servidor) => {
    setServidorParaPassivo(servidor);
    setPeriodosSelecionados([]); 
    setPeriodosJaRegistrados([]);
    setModalPassivoAberto(true);

    try {
      setCarregandoPeriodos(true);
      const response = await api.get(`/servidores/${servidor.id}/periodos`);
      const listaPeriodos = response.data.content ? response.data.content : response.data;
      const anosJaCadastrados = listaPeriodos.map((p: any) => Number(p.anoReferencia));
      setPeriodosJaRegistrados(anosJaCadastrados);
    } catch (error) {
      console.error("Erro ao verificar períodos já registrados:", error);
    } finally {
      setCarregandoPeriodos(false);
    }
  };

  const togglePeriodo = (anoReferencia: number) => {
    setPeriodosSelecionados((prev) => 
      prev.includes(anoReferencia)
        ? prev.filter((ano) => ano !== anoReferencia) 
        : [...prev, anoReferencia] 
    );
  };

  const salvarPassivo = async () => {
    if (periodosSelecionados.length === 0 || !servidorParaPassivo) return;
    try {
      setSalvandoPassivo(true);
      await Promise.all(
        periodosSelecionados.map((ano) => 
          api.post(`/servidores/${servidorParaPassivo.id}/periodos-acumulados`, { anoReferencia: ano })
        )
      );
      alert(`✅ ${periodosSelecionados.length} período(s) adicionado(s) com sucesso para ${servidorParaPassivo.nome}!`);
      setModalPassivoAberto(false);
      buscarServidores(); 
    } catch (error: any) {
      alert("❌ Erro: " + (error.response?.data?.message || "Não foi possível adicionar alguns períodos. Verifique se já não foram adicionados."));
    } finally {
      setSalvandoPassivo(false);
    }
  };

  const gerarOpcoesPeriodo = (dataAdmissaoString?: string) => {
    if (!dataAdmissaoString) return [];
    const anoAdmissao = parseInt(dataAdmissaoString.substring(0, 4), 10);
    const anoAtual = new Date().getFullYear();
    const opcoes = [];
    for (let ano = anoAdmissao + 1; ano <= anoAtual; ano++) {
      opcoes.push({ texto: `${ano - 1}/${ano}`, valorEnvio: ano });
    }
    return opcoes.reverse();
  };

  // =======================================================================
  // ---> LÓGICA DE AFASTAMENTOS <---
  // =======================================================================
  const abrirModalAfastamento = (servidor: Servidor) => {
    setServidorParaAfastamento(servidor);
    setTipoAfastamento('');
    setDataInicioAfastamento('');
    setDataFimAfastamento('');
    setModalAfastamentoAberto(true);
  };

  const salvarAfastamento = async () => {
    if (!servidorParaAfastamento || !tipoAfastamento || !dataInicioAfastamento || !dataFimAfastamento) {
      alert("Preencha todos os campos do formulário.");
      return;
    }
    if (new Date(dataInicioAfastamento) > new Date(dataFimAfastamento)) {
      alert("❌ A Data de Início não pode ser maior que a Data Fim.");
      return;
    }
    try {
      setSalvandoAfastamento(true);
      await api.post(`/servidores/${servidorParaAfastamento.id}/afastamentos`, {
        tipo: tipoAfastamento,
        dataInicio: dataInicioAfastamento,
        dataFim: dataFimAfastamento
      });
      alert(`✅ Afastamento registrado com sucesso!\nO período aquisitivo de ${servidorParaAfastamento.nome} foi recalculado automaticamente.`);
      setModalAfastamentoAberto(false);
    } catch (error: any) {
      alert("❌ Erro ao registrar afastamento: " + (error.response?.data?.message || "Erro desconhecido."));
    } finally {
      setSalvandoAfastamento(false);
    }
  };

  // =======================================================================
  // ---> FILTRAGEM, AGRUPAMENTO E ACORDEÃO <---
  // =======================================================================
  const servidoresFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return servidores;
    const termo = termoBusca.toLowerCase();
    return servidores.filter(s => 
      (s.nome && s.nome.toLowerCase().includes(termo)) ||
      (s.matricula && s.matricula.toLowerCase().includes(termo)) ||
      (s.lotacao && s.lotacao.toLowerCase().includes(termo))
    );
  }, [servidores, termoBusca]);

  const servidoresPorSetor = useMemo(() => {
    const grupos = servidoresFiltrados.reduce((acc, servidor) => {
      const setor = servidor.lotacao || "Sem Lotação";
      if (!acc[setor]) {
        acc[setor] = [];
      }
      acc[setor].push(servidor);
      return acc;
    }, {} as Record<string, Servidor[]>);

    return Object.keys(grupos).sort().reduce((obj, key) => {
      obj[key] = grupos[key];
      return obj;
    }, {} as Record<string, Servidor[]>);
  }, [servidoresFiltrados]);

  const toggleSetor = (setor: string) => {
    setSetoresRecolhidos(prev => ({
      ...prev,
      [setor]: !prev[setor]
    }));
  };

  if (carregando) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mt-6 relative">
      
      <div className="bg-gradient-to-r from-blue-700 to-indigo-600 px-8 py-7 text-white">
        <div className="flex items-center gap-3">
          <Building2 className="text-blue-100" size={32} />
          <div>
            <h2 className="text-2xl font-bold">Quadro de Lotação - SEPLAG</h2>
            <p className="text-blue-100/90 text-sm mt-1 font-medium">
              Gestão estrutural, atualização de cadastro e afastamentos ({servidoresFiltrados.length} encontrados)
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm font-medium text-sm text-gray-700"
            placeholder="Buscar por nome, matrícula ou setor..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="p-8">
        {Object.keys(servidoresPorSetor).length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
            <p className="text-gray-500 font-medium text-lg">Nenhum servidor encontrado para a busca atual.</p>
          </div>
        ) : (
          Object.entries(servidoresPorSetor).map(([setor, lista]) => {
            const estaRecolhido = setoresRecolhidos[setor];

            return (
              <div key={setor} className="mb-10 last:mb-0 transition-all">
                <button 
                  onClick={() => toggleSetor(setor)}
                  className={`w-full text-left bg-gray-50 py-3.5 px-5 border border-gray-200 flex justify-between items-center transition-colors hover:bg-gray-100 focus:outline-none ${estaRecolhido ? 'rounded-xl shadow-sm' : 'rounded-t-xl'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400">
                      {estaRecolhido ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                    </div>
                    <span className="flex items-center gap-2 text-lg font-bold text-gray-800">
                      <Users size={20} className="text-blue-600" />
                      {setor}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-blue-800 bg-blue-100 border border-blue-200 py-1 px-3 rounded-full shadow-sm">
                    {lista.length} {lista.length === 1 ? 'servidor' : 'servidores'}
                  </span>
                </button>
                
                {!estaRecolhido && (
                  <div className="border border-t-0 border-gray-200 rounded-b-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
                    <table className="min-w-full table-fixed divide-y divide-gray-200">
                      <thead className="bg-white">
                        <tr>
                          <th className="w-[12%] px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Matrícula</th>
                          <th className="w-[38%] px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nome do Servidor</th>
                          <th className="w-[20%] px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cargo</th>
                          <th className="w-[12%] px-5 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="w-[18%] px-5 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
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
                              <div className="flex items-center justify-center gap-1">
                                
                                {/* 1. Edição (Azul) */}
                                <button 
                                  onClick={() => abrirModalEdicao(srv)}
                                  className="p-2 text-blue-400 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all"
                                  title="Editar Dados Cadastrais"
                                >
                                  <Pencil size={18} />
                                </button>

                                {/* 2. Dossiê */}
                                <button 
                                  onClick={() => {
                                    setServidorParaHistorico(srv);
                                    setModalHistoricoAberto(true);
                                  }}
                                  className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-all"
                                  title="Ver Dossiê Histórico Completo"
                                >
                                  <FileText size={18} />
                                </button>

                                {srv.ativo && (
                                  <>
                                    {/* 3. Passivo */}
                                    <button 
                                      onClick={() => abrirModalPassivo(srv)}
                                      className="p-2 text-amber-400 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-all"
                                      title="Adicionar Férias Acumuladas (Passivo)"
                                    >
                                      <History size={18} />
                                    </button>

                                    {/* 4. Afastamento */}
                                    <button 
                                      onClick={() => abrirModalAfastamento(srv)}
                                      className="p-2 text-purple-400 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-all"
                                      title="Registrar Afastamento ou Suspensão"
                                    >
                                      <PauseCircle size={18} />
                                    </button>

                                    <div className="w-px h-5 bg-gray-300 mx-1.5 rounded-full"></div>

                                    {/* 5. Inativar */}
                                    <button 
                                      onClick={() => inativar(srv.id, srv.nome)}
                                      className="p-2 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all"
                                      title="Desligar Servidor"
                                    >
                                      <UserMinus size={18} />
                                    </button>
                                  </>
                                )}
                                
                                {!srv.ativo && (
                                  <>
                                    <div className="w-px h-5 bg-gray-300 mx-1.5 rounded-full"></div>
                                    <button 
                                      onClick={() => reativar(srv.id)}
                                      className="p-2 text-emerald-400 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-all"
                                      title="Reativar Servidor"
                                    >
                                      <UserCheck size={18} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL DE EDIÇÃO DE SERVIDOR                                           */}
      {/* ===================================================================== */}
      {modalEdicaoAberto && servidorEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-blue-100">
            
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UserCog size={22} />
                Editar Dados do Servidor
              </h3>
              <button onClick={() => setModalEdicaoAberto(false)} className="text-blue-100 hover:text-white transition-colors bg-blue-800/30 hover:bg-blue-800/50 p-1.5 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-7">
              <div className="space-y-4">
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Nome Completo</label>
                  <input 
                    type="text"
                    value={servidorEditando.nome || ''}
                    onChange={(e) => handleEdicaoChange('nome', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 hover:bg-white outline-none transition-all text-sm font-medium text-gray-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Matrícula</label>
                    <input 
                      type="text"
                      value={servidorEditando.matricula || ''}
                      onChange={(e) => handleEdicaoChange('matricula', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 hover:bg-white outline-none transition-all text-sm font-medium font-mono text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Data de Admissão <span className="text-xs text-gray-400 font-normal ml-1">(Bloqueado)</span></label>
                    <input 
                      type="date"
                      value={servidorEditando.dataAdmissao ? servidorEditando.dataAdmissao.substring(0, 10) : ''}
                      disabled
                      className="w-full border border-gray-200 rounded-xl p-3 bg-gray-100 text-gray-500 cursor-not-allowed outline-none text-sm font-medium"
                      title="Por segurança, a data de admissão não pode ser alterada neste painel."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Cargo</label>
                    <input 
                      type="text"
                      value={servidorEditando.cargo || ''}
                      onChange={(e) => handleEdicaoChange('cargo', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 hover:bg-white outline-none transition-all text-sm font-medium text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Lotação (Setor)</label>
                    <select 
                      value={servidorEditando.lotacao || ''}
                      onChange={(e) => handleEdicaoChange('lotacao', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 hover:bg-white outline-none transition-all text-sm font-medium text-gray-800 cursor-pointer"
                    >
                      <option value="">-- Selecione o setor --</option>
                      <option value="Comitê Gestor do Gasto Público">Comitê Gestor do Gasto Público</option>
                      <option value="Chefia de Gabinete">Chefia de Gabinete</option>
                      <option value="Parceria Público Privada">Parceria Público Privada</option>
                      <option value="Recursos Humanos (RH)">Recursos Humanos (RH)</option>
                      <option value="Tecnologia da Informação (TI)">Tecnologia da Informação (TI)</option>
                      <option value="Gabinete do Secretário">Gabinete do Secretário</option>
                      <option value="Assessoria Jurídica">Assessoria Jurídica</option>
                      <option value="Secretaria Executiva">Secretaria Executiva</option>
                      <option value="DIREGE">DIREGE</option>
                      
                      {/* Fallback caso o servidor tenha um setor legado que não está na lista oficial acima */}
                      {servidorEditando.lotacao && ![
                        'Comitê Gestor do Gasto Público', 
                        'Chefia de Gabinete', 
                        'Parceria Público Privada', 
                        'Recursos Humanos (RH)', 
                        'Tecnologia da Informação (TI)', 
                        'Gabinete do Secretário', 
                        'Assessoria Jurídica', 
                        'Secretaria Executiva', 
                        'DIREGE'
                      ].includes(servidorEditando.lotacao) && (
                        <option value={servidorEditando.lotacao}>{servidorEditando.lotacao}</option>
                      )}
                    </select>
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-gray-50 px-7 py-5 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setModalEdicaoAberto(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={salvarEdicao}
                disabled={salvandoEdicao}
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-blue-500/30 flex items-center gap-2"
              >
                <Save size={16} />
                {salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE AFASTAMENTO / SUSPENSÃO                                      */}
      {/* ===================================================================== */}
      {modalAfastamentoAberto && servidorParaAfastamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-purple-100">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <CalendarOff size={22} />
                Registrar Afastamento
              </h3>
              <button onClick={() => setModalAfastamentoAberto(false)} className="text-purple-100 hover:text-white transition-colors bg-purple-800/30 hover:bg-purple-800/50 p-1.5 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-7">
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Servidor(a)</p>
                <p className="text-lg font-black text-gray-800">{servidorParaAfastamento.nome}</p>
              </div>

              <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-4 mb-6 flex gap-3 text-sm text-purple-800 shadow-sm">
                <Info className="shrink-0 mt-0.5 text-purple-500" size={18} />
                <p className="leading-relaxed font-medium text-xs">
                  Os dias registrados neste afastamento irão <strong>pausar a contagem</strong> e adiar a data final do período aquisitivo vigente do servidor.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Tipo Legal do Afastamento</label>
                  <select 
                    value={tipoAfastamento}
                    onChange={(e) => setTipoAfastamento(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-gray-50 hover:bg-white outline-none transition-all duration-200 font-medium text-sm"
                  >
                    <option value="">Selecione o enquadramento...</option>
                    <option value="LICENCA_SEM_VENCIMENTO">Licença Sem Vencimento</option>
                    <option value="FALTAS_NAO_JUSTIFICADAS">Faltas Não Justificadas</option>
                    <option value="SUSPENSAO_DISCIPLINAR">Suspensão Disciplinar</option>
                    <option value="LICENCA_TRATO_INTERESSE_PARTICULAR">Licença p/ Trato de Interesse Particular (LIP)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Data de Início</label>
                    <input 
                      type="date"
                      value={dataInicioAfastamento}
                      onChange={(e) => setDataInicioAfastamento(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-gray-50 hover:bg-white outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Data de Fim</label>
                    <input 
                      type="date"
                      value={dataFimAfastamento}
                      onChange={(e) => setDataFimAfastamento(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-gray-50 hover:bg-white outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-7 py-5 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setModalAfastamentoAberto(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={salvarAfastamento}
                disabled={salvandoAfastamento || !tipoAfastamento || !dataInicioAfastamento || !dataFimAfastamento}
                className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-purple-500/30 flex items-center gap-2"
              >
                <PauseCircle size={16} />
                {salvandoAfastamento ? 'Salvando...' : 'Aplicar Suspensão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE ADIÇÃO DE FÉRIAS ATRASADAS (PASSIVO EM LOTE)                 */}
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
              </div>

              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 mb-6 flex gap-3 text-sm text-blue-800 shadow-sm">
                <Info className="shrink-0 mt-0.5 text-blue-500" size={18} />
                <p className="leading-relaxed font-medium text-xs">
                  Selecione abaixo os <strong>períodos aquisitivos</strong> que geraram direito a férias. <br/>
                  <em>Períodos já registrados aparecem desabilitados em cinza.</em>
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Selecione os Períodos Pendentes (Múltipla Escolha)
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50/50 shadow-inner">
                  {carregandoPeriodos ? (
                    <div className="col-span-full flex justify-center py-6 text-amber-600">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mr-2"></div>
                      <span className="text-sm font-bold">Verificando banco...</span>
                    </div>
                  ) : (
                    gerarOpcoesPeriodo(servidorParaPassivo.dataAdmissao).map((opcao) => {
                      const isSelecionado = periodosSelecionados.includes(opcao.valorEnvio);
                      const isJaRegistrado = periodosJaRegistrados.includes(opcao.valorEnvio);
                      
                      return (
                        <button
                          key={opcao.valorEnvio}
                          type="button"
                          disabled={isJaRegistrado}
                          onClick={() => togglePeriodo(opcao.valorEnvio)}
                          title={isJaRegistrado ? "Período já cadastrado no sistema" : "Clique para selecionar"}
                          className={`flex items-center justify-center p-3 rounded-lg text-sm font-bold transition-all border-2
                            ${isJaRegistrado 
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-70'
                              : isSelecionado 
                                ? 'bg-amber-100 border-amber-500 text-amber-800 shadow-sm transform scale-[1.02]' 
                                : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50'
                            }`}
                        >
                          {opcao.texto}
                          {isJaRegistrado && <Check size={14} className="ml-1.5 opacity-60" />}
                        </button>
                      );
                    })
                  )}
                </div>
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
                disabled={salvandoPassivo || periodosSelecionados.length === 0 || carregandoPeriodos}
                className="px-6 py-2.5 text-sm font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-amber-500/30 flex items-center gap-2"
              >
                <History size={16} />
                {salvandoPassivo ? 'Registrando...' : 'Confirmar Inclusão'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DO DOSSIÊ CRONOLÓGICO                                           */}
      {/* ===================================================================== */}
      {modalHistoricoAberto && servidorParaHistorico && (
        <DossieServidor
          servidorId={servidorParaHistorico.id}
          nomeServidor={servidorParaHistorico.nome}
          matricula={servidorParaHistorico.matricula}
          onClose={() => {
            setModalHistoricoAberto(false);
            setServidorParaHistorico(null);
          }}
        />
      )}

    </div>
  );
}