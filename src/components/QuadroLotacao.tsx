import { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { 
  Users, UserMinus, UserCheck, Building2, History, X, CalendarPlus, 
  Info, FileText, Check, PauseCircle, Search, ChevronDown, 
  ChevronRight, Pencil, Save, UserCog, Filter
} from 'lucide-react';
import { DossieServidor } from './DossieServidor'; 
import { toast } from 'react-hot-toast';

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

const SETORES_SEPLAG = [
  "Comitê Gestor do Gasto Público",
  "Chefia de Gabinete",
  "Parceria Público Privada",
  "Recursos Humanos (RH)",
  "Tecnologia da Informação (TI)",
  "Gabinete do Secretário",
  "Assessoria Jurídica",
  "Secretaria Executiva",
  "DIREGE"
];

export function QuadroLotacao() {
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [carregando, setCarregando] = useState(true);

  // ---> ESTADOS DA BUSCA, FILTRO E ACORDEÃO <---
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ATIVOS' | 'INATIVOS'>('TODOS');
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
  // ---> FUNÇÕES UTILITÁRIAS <---
  // =======================================================================
  const getIniciais = (nome: string) => {
    if (!nome) return 'SV';
    const partes = nome.trim().split(' ').filter(p => p.length > 0);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  const formatarDataBr = (dataStr: string) => {
    if (!dataStr) return '--/--/----';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

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
      toast.error("Não foi possível carregar a lista de servidores.");
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
    
    const toastId = toast.loading("Inativando servidor...");
    try {
      await api.put(`/servidores/${id}/inativar`, { motivo });
      toast.success('Servidor inativado com sucesso.', { id: toastId });
      buscarServidores();
    } catch (error) {
      toast.error('Erro ao inativar servidor.', { id: toastId });
    }
  };

  const reativar = async (id: number) => {
    if (!window.confirm("Deseja reativar este servidor? Ele voltará a aparecer nas opções de férias.")) return;
    
    const toastId = toast.loading("Reativando servidor...");
    try {
      await api.put(`/servidores/${id}/reativar`);
      toast.success('Servidor reativado.', { id: toastId });
      buscarServidores();
    } catch (error) {
      toast.error('Erro ao reativar servidor.', { id: toastId });
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
      toast.error("Nome, matrícula e setor são obrigatórios.");
      return;
    }

    const toastId = toast.loading("Salvando alterações...");
    try {
      setSalvandoEdicao(true);
      await api.put(`/servidores/${servidorEditando.id}`, {
        nome: servidorEditando.nome,
        matricula: servidorEditando.matricula,
        cargo: servidorEditando.cargo,
        lotacao: servidorEditando.lotacao,
        // Garante que a data vá limpa no formato esperado pelo banco (YYYY-MM-DD)
        dataAdmissao: servidorEditando.dataAdmissao ? servidorEditando.dataAdmissao.substring(0, 10) : null,
        // CRUCIAL: Devolver o status ativo para não dar erro de "NotNull" no Spring Boot
        ativo: servidorEditando.ativo 
      });
      
      toast.success('Dados do servidor atualizados com sucesso!', { id: toastId });
      setModalEdicaoAberto(false);
      buscarServidores(); 
    } catch (error: any) {
      console.error(error);
      
      // Agora o balão de erro vai mostrar a mensagem real enviada pelo Spring Boot!
      const mensagemErro = error.response?.data?.message || error.response?.data || 'Verifique se não há matrícula duplicada.';
      const textoErro = typeof mensagemErro === 'string' ? mensagemErro.replace(/"/g, '') : 'Erro interno do servidor.';
      
      toast.error(`Falha: ${textoErro}`, { id: toastId, duration: 5000 });
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
      toast.error("Não foi possível carregar os períodos existentes.");
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
    
    const toastId = toast.loading("Adicionando períodos...");
    try {
      setSalvandoPassivo(true);
      await Promise.all(
        periodosSelecionados.map((ano) => 
          api.post(`/servidores/${servidorParaPassivo.id}/periodos-acumulados`, { anoReferencia: ano })
        )
      );
      toast.success(`${periodosSelecionados.length} período(s) adicionado(s) com sucesso!`, { id: toastId });
      setModalPassivoAberto(false);
      buscarServidores(); 
    } catch (error: any) {
      toast.error("Erro ao adicionar períodos.", { id: toastId });
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
      toast.error("Preencha todos os campos do formulário.");
      return;
    }
    if (new Date(dataInicioAfastamento) > new Date(dataFimAfastamento)) {
      toast.error("A Data de Início não pode ser maior que a Data Fim.");
      return;
    }

    const toastId = toast.loading("Registrando afastamento...");
    try {
      setSalvandoAfastamento(true);
      await api.post(`/servidores/${servidorParaAfastamento.id}/afastamentos`, {
        tipo: tipoAfastamento,
        dataInicio: dataInicioAfastamento,
        dataFim: dataFimAfastamento
      });
      toast.success(`Afastamento registrado! Período aquisitivo recalculado.`, { id: toastId, duration: 5000 });
      setModalAfastamentoAberto(false);
    } catch (error: any) {
      toast.error("Erro ao registrar afastamento.", { id: toastId });
    } finally {
      setSalvandoAfastamento(false);
    }
  };

  // =======================================================================
  // ---> FILTRAGEM, AGRUPAMENTO E ACORDEÃO <---
  // =======================================================================
  const servidoresFiltrados = useMemo(() => {
    let filtrados = servidores;
    
    if (filtroStatus === 'ATIVOS') filtrados = filtrados.filter(s => s.ativo);
    if (filtroStatus === 'INATIVOS') filtrados = filtrados.filter(s => !s.ativo);

    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase();
      filtrados = filtrados.filter(s => 
        (s.nome && s.nome.toLowerCase().includes(termo)) ||
        (s.matricula && s.matricula.toLowerCase().includes(termo)) ||
        (s.lotacao && s.lotacao.toLowerCase().includes(termo)) ||
        (s.cargo && s.cargo.toLowerCase().includes(termo))
      );
    }
    
    return filtrados;
  }, [servidores, termoBusca, filtroStatus]);

  const servidoresPorSetor = useMemo(() => {
    const grupos = servidoresFiltrados.reduce((acc, servidor) => {
      const setor = servidor.lotacao || "Sem Lotação Informada";
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
    <div className="flex justify-center items-center py-32">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#005aa9]"></div>
    </div>
  );

  return (
    <div className="w-full pb-8">
      
      {/* CABEÇALHO AZUL OFICIAL */}
      <div className="bg-[#005aa9] px-8 py-7 text-white shadow-sm rounded-t-2xl mt-6">
        <div className="flex items-center gap-3">
          <Building2 className="text-blue-100" size={32} />
          <div>
            <h2 className="text-2xl font-black tracking-tight">Quadro de Lotação - SEPLAG</h2>
            <p className="text-blue-100/90 text-sm mt-1 font-medium">
              Diretório de servidores, atualização de cadastro e gestão estrutural ({servidoresFiltrados.length} encontrados)
            </p>
          </div>
        </div>
      </div>

      {/* NOVO PAINEL DE CONTROLE (FILTROS E BUSCA) */}
      <div className="px-8 py-5 border-b border-slate-200 bg-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm rounded-b-2xl">
        
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#005aa9]/20 focus:border-[#005aa9] transition-all font-medium text-sm text-slate-700"
            placeholder="Buscar servidor, matrícula ou cargo..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </div>

        <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 w-full md:w-auto">
          <button onClick={() => setFiltroStatus('TODOS')} className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${filtroStatus === 'TODOS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Todos</button>
          <button onClick={() => setFiltroStatus('ATIVOS')} className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${filtroStatus === 'ATIVOS' ? 'bg-white text-[#005aa9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Apenas Ativos</button>
          <button onClick={() => setFiltroStatus('INATIVOS')} className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${filtroStatus === 'INATIVOS' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Desligados</button>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {Object.keys(servidoresPorSetor).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Filter className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium text-lg">Nenhum servidor encontrado nos filtros atuais.</p>
          </div>
        ) : (
          Object.entries(servidoresPorSetor).map(([setor, lista]) => {
            const estaRecolhido = setoresRecolhidos[setor];

            return (
              <div key={setor} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                
                {/* CABEÇALHO DO SETOR (Hierarquia Visual Corrigida) */}
                <button 
                  onClick={() => toggleSetor(setor)}
                  className="w-full text-left bg-[#005aa9]/[0.03] hover:bg-[#005aa9]/10 py-4 px-6 border-b border-[#005aa9]/10 flex justify-between items-center focus:outline-none transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-[#005aa9] text-white rounded-xl shadow-sm">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#005aa9] uppercase tracking-wide">{setor}</h3>
                      <p className="text-[11px] font-bold text-[#005aa9]/60 mt-0.5 uppercase tracking-wider">
                        {lista.length} {lista.length === 1 ? 'Servidor alocado' : 'Servidores alocados'}
                      </p>
                    </div>
                  </div>
                  <div className="text-[#005aa9]/60 bg-white shadow-sm border border-[#005aa9]/10 p-1.5 rounded-lg">
                    {estaRecolhido ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>
                
                {/* LISTAGEM DE SERVIDORES (Diretório Moderno) */}
                {!estaRecolhido && (
                  <div className="divide-y divide-slate-100 bg-slate-50/30">
                    {lista.map((srv) => (
                      <div key={srv.id} className={`flex flex-col lg:flex-row lg:items-center justify-between p-6 gap-6 transition-colors duration-200 ${!srv.ativo ? 'bg-red-50/30' : 'hover:bg-[#005aa9]/5'}`}>
                        
                        {/* 1. Avatar, Nome e Matrícula */}
                        <div className="flex items-center gap-4 lg:w-[35%] shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 border shadow-sm
                            ${srv.ativo ? 'bg-[#005aa9]/10 text-[#005aa9] border-[#005aa9]/20' : 'bg-red-100 text-red-700 border-red-200'}`}>
                            {getIniciais(srv.nome)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 truncate" title={srv.nome}>{srv.nome}</h4>
                            <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">MAT: {srv.matricula || 'N/A'}</p>
                          </div>
                        </div>

                        {/* 2. Cargo e Admissão */}
                        <div className="lg:w-[30%] min-w-0">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cargo / Admissão</p>
                          <p className="text-sm font-semibold text-slate-700 truncate" title={srv.cargo}>{srv.cargo || 'Não informado'}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">Posse em: {formatarDataBr(srv.dataAdmissao)}</p>
                        </div>

                        {/* 3. Status Badge */}
                        <div className="lg:w-[15%]">
                          {srv.ativo ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
                              <UserCheck size={14} /> Servidor Ativo
                            </span>
                          ) : (
                            <div className="flex flex-col items-start">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200 shadow-sm">
                                <UserMinus size={14} /> Desligado
                              </span>
                              {srv.motivoDesligamento && (
                                <span className="text-[10px] font-bold text-red-500 mt-1.5 truncate max-w-[140px]" title={srv.motivoDesligamento}>
                                  Motivo: {srv.motivoDesligamento}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* 4. Toolbar de Ações */}
                        <div className="lg:w-[20%] flex justify-start lg:justify-end">
                          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                            
                            <button onClick={() => abrirModalEdicao(srv)} className="p-2 text-[#005aa9] hover:bg-[#005aa9]/10 rounded-lg transition-colors" title="Editar Cadastro">
                              <Pencil size={18} />
                            </button>
                            
                            <button onClick={() => { setServidorParaHistorico(srv); setModalHistoricoAberto(true); }} className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors" title="Dossiê Completo">
                              <FileText size={18} />
                            </button>

                            {srv.ativo && (
                              <>
                                <div className="w-px h-5 bg-slate-200 mx-1"></div>
                                <button onClick={() => abrirModalPassivo(srv)} className="p-2 text-amber-500 hover:bg-amber-100 hover:text-amber-700 rounded-lg transition-colors" title="Lançar Férias Passadas">
                                  <History size={18} />
                                </button>
                                <button onClick={() => abrirModalAfastamento(srv)} className="p-2 text-purple-500 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-colors" title="Registrar Afastamento">
                                  <PauseCircle size={18} />
                                </button>
                                <div className="w-px h-5 bg-slate-200 mx-1"></div>
                                <button onClick={() => inativar(srv.id, srv.nome)} className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors" title="Inativar Servidor">
                                  <UserMinus size={18} />
                                </button>
                              </>
                            )}

                            {!srv.ativo && (
                              <>
                                <div className="w-px h-5 bg-slate-200 mx-1"></div>
                                <button onClick={() => reativar(srv.id)} className="p-2 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors" title="Reativar Servidor">
                                  <UserCheck size={18} />
                                </button>
                              </>
                            )}

                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAIS (MANTIDOS INTACTOS COM A MESMA IDENTIDADE DO SISTEMA)          */}
      {/* ===================================================================== */}

      {/* MODAL DE EDIÇÃO DE SERVIDOR */}
      {modalEdicaoAberto && servidorEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#005aa9]/20">
            
            <div className="bg-[#005aa9] px-6 py-5 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UserCog size={22} />
                Editar Dados do Servidor
              </h3>
              <button onClick={() => setModalEdicaoAberto(false)} className="text-blue-100 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-7">
              <div className="space-y-4">
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome Completo</label>
                  <input 
                    type="text"
                    value={servidorEditando.nome || ''}
                    onChange={(e) => handleEdicaoChange('nome', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-4 focus:ring-[#005aa9]/20 focus:border-[#005aa9] bg-slate-50 hover:bg-white outline-none transition-all text-sm font-medium text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Matrícula</label>
                    <input 
                      type="text"
                      value={servidorEditando.matricula || ''}
                      onChange={(e) => handleEdicaoChange('matricula', e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-4 focus:ring-[#005aa9]/20 focus:border-[#005aa9] bg-slate-50 hover:bg-white outline-none transition-all text-sm font-medium font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Data de Admissão <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">(Bloqueado)</span></label>
                    <input 
                      type="date"
                      value={servidorEditando.dataAdmissao ? servidorEditando.dataAdmissao.substring(0, 10) : ''}
                      disabled
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-100 text-slate-400 cursor-not-allowed outline-none text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Cargo</label>
                    <input 
                      type="text"
                      value={servidorEditando.cargo || ''}
                      onChange={(e) => handleEdicaoChange('cargo', e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-4 focus:ring-[#005aa9]/20 focus:border-[#005aa9] bg-slate-50 hover:bg-white outline-none transition-all text-sm font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Lotação (Setor)</label>
                    <select 
                      value={servidorEditando.lotacao || ''}
                      onChange={(e) => handleEdicaoChange('lotacao', e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-4 focus:ring-[#005aa9]/20 focus:border-[#005aa9] bg-slate-50 hover:bg-white outline-none transition-all text-sm font-medium text-slate-800 cursor-pointer"
                    >
                      <option value="">-- Selecione o setor --</option>
                      {SETORES_SEPLAG.map(setor => (
                        <option key={setor} value={setor}>{setor}</option>
                      ))}
                      {servidorEditando.lotacao && !SETORES_SEPLAG.includes(servidorEditando.lotacao) && (
                        <option value={servidorEditando.lotacao}>{servidorEditando.lotacao}</option>
                      )}
                    </select>
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-slate-50 px-7 py-5 border-t border-slate-200/60 flex justify-end gap-3">
              <button onClick={() => setModalEdicaoAberto(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-all shadow-sm">Cancelar</button>
              <button onClick={salvarEdicao} disabled={salvandoEdicao} className="px-6 py-2.5 text-sm font-bold text-white bg-[#005aa9] rounded-xl hover:bg-[#004785] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus:ring-4 focus:ring-[#005aa9]/30 flex items-center gap-2">
                <Save size={16} /> {salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE AFASTAMENTO / SUSPENSÃO */}
      {modalAfastamentoAberto && servidorParaAfastamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-purple-200">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-5 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <PauseCircle size={22} /> Registrar Afastamento
              </h3>
              <button onClick={() => setModalAfastamentoAberto(false)} className="text-purple-100 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg"><X size={20} /></button>
            </div>

            <div className="p-7">
              <div className="mb-6">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Servidor(a)</p>
                <p className="text-lg font-black text-slate-800">{servidorParaAfastamento.nome}</p>
              </div>

              <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-4 mb-6 flex gap-3 text-sm text-purple-800 shadow-sm">
                <Info className="shrink-0 mt-0.5 text-purple-500" size={18} />
                <p className="leading-relaxed font-medium text-xs">Os dias registrados neste afastamento irão <strong>pausar a contagem</strong> e adiar a data final do período aquisitivo vigente do servidor.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Tipo Legal do Afastamento</label>
                  <select value={tipoAfastamento} onChange={(e) => setTipoAfastamento(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-slate-50 hover:bg-white outline-none transition-all duration-200 font-medium text-sm text-slate-800">
                    <option value="">Selecione o enquadramento...</option>
                    <option value="LICENCA_SEM_VENCIMENTO">Licença Sem Vencimento</option>
                    <option value="FALTAS_NAO_JUSTIFICADAS">Faltas Não Justificadas</option>
                    <option value="SUSPENSAO_DISCIPLINAR">Suspensão Disciplinar</option>
                    <option value="LICENCA_TRATO_INTERESSE_PARTICULAR">Licença p/ Trato de Interesse Particular (LIP)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Data de Início</label>
                    <input type="date" value={dataInicioAfastamento} onChange={(e) => setDataInicioAfastamento(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-slate-50 hover:bg-white outline-none transition-all text-sm font-medium text-slate-800"/>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Data de Fim</label>
                    <input type="date" value={dataFimAfastamento} onChange={(e) => setDataFimAfastamento(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 bg-slate-50 hover:bg-white outline-none transition-all text-sm font-medium text-slate-800"/>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-7 py-5 border-t border-slate-200/60 flex justify-end gap-3">
              <button onClick={() => setModalAfastamentoAberto(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-all shadow-sm">Cancelar</button>
              <button onClick={salvarAfastamento} disabled={salvandoAfastamento || !tipoAfastamento || !dataInicioAfastamento || !dataFimAfastamento} className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus:ring-4 focus:ring-purple-500/30 flex items-center gap-2">
                <PauseCircle size={16} /> {salvandoAfastamento ? 'Salvando...' : 'Aplicar Suspensão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ADIÇÃO DE FÉRIAS ATRASADAS (PASSIVO EM LOTE) */}
      {modalPassivoAberto && servidorParaPassivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-amber-200">
            
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold flex items-center gap-2"><History size={22} /> Registrar Férias Pendentes</h3>
              <button onClick={() => setModalPassivoAberto(false)} className="text-amber-100 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg"><X size={20} /></button>
            </div>

            <div className="p-7">
              <div className="mb-6">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Servidor(a)</p>
                <p className="text-lg font-black text-slate-800">{servidorParaPassivo.nome}</p>
              </div>

              <div className="bg-[#005aa9]/5 border border-[#005aa9]/20 rounded-xl p-4 mb-6 flex gap-3 text-sm text-[#005aa9] shadow-sm">
                <Info className="shrink-0 mt-0.5 text-[#005aa9]" size={18} />
                <p className="leading-relaxed font-medium text-xs">Selecione abaixo os <strong>períodos aquisitivos</strong> que geraram direito a férias. <br/><em>Períodos já registrados aparecem desabilitados.</em></p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Selecione os Períodos Pendentes (Múltipla Escolha)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50 shadow-inner">
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
                          className={`flex items-center justify-center p-3 rounded-lg text-sm font-bold transition-all border-2
                            ${isJaRegistrado ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-70' : isSelecionado ? 'bg-amber-100 border-amber-500 text-amber-800 shadow-sm transform scale-[1.02]' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50'}`}
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

            <div className="bg-slate-50 px-7 py-5 border-t border-slate-200/60 flex justify-end gap-3">
              <button onClick={() => setModalPassivoAberto(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-all shadow-sm">Cancelar</button>
              <button onClick={salvarPassivo} disabled={salvandoPassivo || periodosSelecionados.length === 0 || carregandoPeriodos} className="px-6 py-2.5 text-sm font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus:ring-4 focus:ring-amber-500/30 flex items-center gap-2">
                <History size={16} /> {salvandoPassivo ? 'Registrando...' : 'Confirmar Inclusão'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DO DOSSIÊ CRONOLÓGICO */}
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