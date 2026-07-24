import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  RefreshCw, Check, X, Clock, AlertTriangle, FileDown, 
  Search, CalendarCheck, ChevronLeft, ChevronRight,
  FolderOpen, ChevronDown, ChevronUp, User,
  Printer, CalendarClock, CalendarDays, Layers
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';

interface Solicitacao {
  id: number;
  modalidade: 'GOZO' | 'INDENIZACAO';
  dataInicioGozo: string;
  diasSolicitados: number;
  status: string;
  servidorNome: string;
  numeroPbdoc: string;
  lotacao: string;
  matricula: string;
  // Campos opcionais mapeando todas as formas que o backend pode devolver o período
  anoReferencia?: number;
  referencia?: string;
  periodo?: {
    anoReferencia?: number;
    referencia?: string;
  };
  periodoAquisitivo?: {
    anoReferencia?: number;
    referencia?: string;
  };
}

// Interfaces auxiliares para a nova estrutura de agrupamento
interface GrupoPeriodo {
  textoReferencia: string; 
  totalDiasGozados: number;
  solicitacoes: Solicitacao[];
}

interface GrupoServidor {
  servidorNome: string;
  matricula: string;
  periodos: Record<string, GrupoPeriodo>; 
}

// O extrator agora sabe que o Java envia exatamente "anoReferencia"
const getReferenciaFormatada = (item: any) => {
  if (item.anoReferencia) {
    return `${item.anoReferencia - 1}/${item.anoReferencia}`;
  }
  return 'N/A'; // Só vai cair aqui se o banco de dados devolver null
};

export function TabelaFerias() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  
  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<'ATUAIS_FUTURAS' | 'PENDENTES' | 'HISTORICO'>('ATUAIS_FUTURAS');
  const [filtroSetor, setFiltroSetor] = useState<string>('');
  const [filtroStatusSecundario, setFiltroStatusSecundario] = useState<string>('');

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  // Estados de controle para os acordeões expansíveis
  const [setoresExpandidos, setSetoresExpandidos] = useState<Record<string, boolean>>({});
  const [servidoresExpandidos, setServidoresExpandidos] = useState<Record<string, boolean>>({}); 

  const buscarHistoricoGeral = async () => {
    try {
      setCarregando(true);
      const response = await api.get('/solicitacoes'); 
      console.log("🕵️ DADOS VINDOS DO JAVA:", response.data[0]);
      setSolicitacoes(response.data);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      toast.error("Erro ao carregar os dados das férias.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarHistoricoGeral();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
    setSetoresExpandidos({}); 
    setServidoresExpandidos({});
  }, [termoBusca, filtroStatus, filtroSetor, filtroStatusSecundario]);

  const setoresUnicos = Array.from(
    new Set(solicitacoes.map(item => item.lotacao || 'Sem Lotação Informada'))
  ).filter(Boolean).sort();

  // ========================================================================
  // AÇÕES COM FEEDBACK VISUAL (TOAST)
  // ========================================================================
  const aprovarPedido = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja APROVAR estas férias?")) return;
    const toastId = toast.loading("Aprovando solicitação...");
    try { 
      await api.put(`/solicitacoes/${id}/aprovar`); 
      toast.success("Férias aprovadas com sucesso!", { id: toastId });
      buscarHistoricoGeral(); 
    } catch (error) { 
      toast.error("Erro ao aprovar a solicitação.", { id: toastId }); 
    }
  };

  const rejeitarPedido = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja REJEITAR? O saldo será devolvido.")) return;
    const toastId = toast.loading("Rejeitando solicitação...");
    try { 
      await api.put(`/solicitacoes/${id}/rejeitar`); 
      toast.success("Solicitação rejeitada. Saldo devolvido.", { id: toastId });
      buscarHistoricoGeral(); 
    } catch (error) { 
      toast.error("Erro ao rejeitar a solicitação.", { id: toastId }); 
    }
  };

  const interromperPedido = async (id: number) => {
    const confirmacao = window.prompt("⚠️ INTERRUPÇÃO (Art. 81)\nDigite 'CONFIRMAR' se houver calamidade ou necessidade:");
    if (confirmacao !== 'CONFIRMAR') return;
    const toastId = toast.loading("Registrando interrupção...");
    try { 
      await api.put(`/solicitacoes/${id}/interromper`); 
      toast.success("Férias interrompidas com sucesso.", { id: toastId }); 
      buscarHistoricoGeral(); 
    } catch (error) { 
      toast.error("Erro ao interromper as férias.", { id: toastId }); 
    }
  };

  const calcularDataExata = (dataString: string, diasSomar: number = 0) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-').map(Number);
    const dataCalculada = new Date(ano, mes - 1, dia);
    dataCalculada.setDate(dataCalculada.getDate() + diasSomar);
    return dataCalculada.toLocaleDateString('pt-BR');
  };

  const getRawDataFim = (dataString: string, diasSomar: number) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-').map(Number);
    const dataCalculada = new Date(ano, mes - 1, dia);
    dataCalculada.setDate(dataCalculada.getDate() + diasSomar);
    return dataCalculada.toISOString().split('T')[0]; 
  };

  const renderStatus = (status: string, dataInicioStr: string, dataFimStr: string, modalidade: 'GOZO'|'INDENIZACAO') => {
    if (status === 'APROVADA' && modalidade === 'INDENIZACAO') {
        return <span className="inline-flex justify-center items-center gap-1.5 px-3 py-1 w-28 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300 shadow-sm"><Check size={13} /> INDENIZADA</span>;
    }

    if (status === 'APROVADA') {
      const hoje = new Date().toISOString().split('T')[0];
      if (dataInicioStr > hoje) {
        return <span className="inline-flex justify-center items-center gap-1.5 px-3 py-1 w-28 text-[11px] font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200 shadow-sm"><CalendarClock size={13} /> AGENDADA</span>;
      }
      if (dataFimStr < hoje) {
        return <span className="inline-flex justify-center items-center gap-1.5 px-3 py-1 w-28 text-[11px] font-bold rounded-full bg-slate-100 text-slate-800 border border-slate-300 shadow-sm"><Check size={13} /> CONCLUÍDA</span>;
      }
      return <span className="inline-flex justify-center items-center gap-1.5 px-3 py-1 w-28 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm"><Check size={13} /> EM GOZO</span>;
    }
    
    if (status === 'REJEITADA') return <span className="inline-flex justify-center items-center gap-1.5 px-3 py-1 w-28 text-[11px] font-bold rounded-full bg-red-100 text-red-800 border border-red-200 shadow-sm"><X size={13}/> REJEITADA</span>;
    if (status === 'INTERROMPIDA') return <span className="inline-flex justify-center items-center gap-1.5 px-3 py-1 w-32 text-[11px] font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200 shadow-sm"><AlertTriangle size={13}/> INTERROMPIDA</span>;
    
    return <span className="inline-flex justify-center items-center gap-1.5 px-3 py-1 w-28 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 shadow-sm"><Clock size={13}/> PENDENTE</span>;
  };

  const verificaFiltros = (item: Solicitacao) => {
    const termo = termoBusca.toLowerCase();
    const passaBusca = item.servidorNome.toLowerCase().includes(termo) || 
                       (item.matricula || '').toLowerCase().includes(termo) || 
                       (item.numeroPbdoc || '').toLowerCase().includes(termo) || 
                       (item.lotacao || '').toLowerCase().includes(termo);
    
    const hoje = new Date().toISOString().split('T')[0];
    const dataFimFerias = item.modalidade === 'INDENIZACAO' ? '' : getRawDataFim(item.dataInicioGozo, item.diasSolicitados - 1);

    let passaAba = true;
    if (filtroStatus === 'ATUAIS_FUTURAS') passaAba = item.status === 'APROVADA' && (item.modalidade === 'INDENIZACAO' ? false : dataFimFerias >= hoje);
    if (filtroStatus === 'PENDENTES') passaAba = item.status === 'PENDENTE_CHEFIA';
    if (filtroStatus === 'HISTORICO') passaAba = true; 

    const passaSetor = !filtroSetor || (item.lotacao || 'Sem Lotação Informada') === filtroSetor;

    let passaStatusSecundario = true;
    if (filtroStatusSecundario) {
      if (filtroStatusSecundario === 'AGENDADA') {
        passaStatusSecundario = item.status === 'APROVADA' && item.modalidade === 'GOZO' && item.dataInicioGozo > hoje;
      } else if (filtroStatusSecundario === 'EM_GOZO') {
        passaStatusSecundario = item.status === 'APROVADA' && item.modalidade === 'GOZO' && item.dataInicioGozo <= hoje && dataFimFerias >= hoje;
      } else if (filtroStatusSecundario === 'CONCLUIDA') {
        passaStatusSecundario = item.status === 'APROVADA' && (item.modalidade === 'INDENIZACAO' || dataFimFerias < hoje);
      } else {
        passaStatusSecundario = item.status === filtroStatusSecundario;
      }
    }

    return passaBusca && passaAba && passaSetor && passaStatusSecundario;
  };

  const solicitacoesFiltradas = solicitacoes.filter(verificaFiltros);
  const totalItens = solicitacoesFiltradas.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  const indiceUltimoItem = paginaAtual * itensPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
  const itensAtuais = solicitacoesFiltradas.slice(indicePrimeiroItem, indiceUltimoItem);

  const toggleSetor = (setor: string) => {
    setSetoresExpandidos(prev => ({ ...prev, [setor]: !prev[setor] }));
  };

  const toggleServidor = (setorServidorChave: string) => {
    setServidoresExpandidos(prev => ({ ...prev, [setorServidorChave]: !prev[setorServidorChave] }));
  };

  // ========================================================================
  // ENGINE DE AGRUPAMENTO HIERÁRQUICO
  // ========================================================================
  const estruturarHistoricoHierarquico = (lista: Solicitacao[]) => {
    const setores: Record<string, Record<string, GrupoServidor>> = {};

    lista.forEach(item => {
      const setor = item.lotacao || 'Sem Lotação Informada';
      const chaveServidor = item.matricula || item.servidorNome;
      const textoRef = getReferenciaFormatada(item);

      if (!setores[setor]) setores[setor] = {};
      if (!setores[setor][chaveServidor]) {
        setores[setor][chaveServidor] = {
          servidorNome: item.servidorNome,
          matricula: item.matricula,
          periodos: {}
        };
      }

      if (!setores[setor][chaveServidor].periodos[textoRef]) {
        setores[setor][chaveServidor].periodos[textoRef] = {
          textoReferencia: textoRef,
          totalDiasGozados: 0,
          solicitacoes: []
        };
      }

      setores[setor][chaveServidor].periodos[textoRef].solicitacoes.push(item);
      
      if (item.status === 'APROVADA' || item.status === 'INTERROMPIDA') {
        setores[setor][chaveServidor].periodos[textoRef].totalDiasGozados += item.diasSolicitados;
      }
    });

    return setores;
  };

  const historicoHierarquico = estruturarHistoricoHierarquico(solicitacoesFiltradas);

  const exportarParaPDF = (setorEspecifico?: string) => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(100);

    const nomeSetorAlvo = setorEspecifico || filtroSetor;
    const dadosFiltradosParaPDF = setorEspecifico 
      ? solicitacoes.filter(item => verificaFiltros(item) && (item.lotacao || 'Sem Lotação Informada') === setorEspecifico)
      : solicitacoesFiltradas;

    if (dadosFiltradosParaPDF.length === 0) {
      toast.error("Nenhum registro encontrado para exportar.");
      return;
    }

    doc.text(`Relatório de Férias Consolidado - SEPLAG/PB${nomeSetorAlvo ? ` - Setor: ${nomeSetorAlvo}` : ''}`, 14, 20);
    doc.text(`Gerado em: ${dataHoje} | Foco de Visão: ${filtroStatus}`, 14, 28);

    const dadosEstruturados = estruturarHistoricoHierarquico(dadosFiltradosParaPDF);
    let currentY = 35;

    Object.entries(dadosEstruturados).forEach(([setor, servidoresObj]) => {
      if (currentY > 170) { doc.addPage(); currentY = 20; }

      doc.setFontSize(13).setFont("helvetica", "bold").setTextColor(0, 90, 169); // Azul PB
      doc.text(`Lotação: ${setor}`, 14, currentY);
      currentY += 6;

      Object.values(servidoresObj).forEach(srv => {
        doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(50);
        doc.text(`Servidor: ${srv.servidorNome} (Matrícula: ${srv.matricula || '-'})`, 16, currentY);
        currentY += 4;

        Object.values(srv.periodos).forEach(p => {
          doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(100);
          doc.text(`  • Período de Referência: ${p.textoReferencia} | Total Consumido: ${p.totalDiasGozados} dias`, 18, currentY);
          currentY += 3;

          const colunas = ["Modalidade", "Início", "Fim", "Retorno", "Dias", "Processo", "Status"];
          const linhas = p.solicitacoes.map(item => {
            const hoje = new Date().toISOString().split('T')[0];
            const isIndenizacao = item.modalidade === 'INDENIZACAO';
            const dataFimFerias = isIndenizacao ? '' : getRawDataFim(item.dataInicioGozo, item.diasSolicitados - 1);
            
            let sStr = item.status;
            if (item.status === 'APROVADA') {
              if (isIndenizacao) sStr = 'INDENIZADA';
              else if (item.dataInicioGozo > hoje) sStr = 'AGENDADA';
              else if (dataFimFerias < hoje) sStr = 'CONCLUÍDA';
              else sStr = 'EM GOZO';
            }

            return [
              isIndenizacao ? "INDENIZAÇÃO (Pecúnia)" : "GOZO",
              isIndenizacao ? "-" : calcularDataExata(item.dataInicioGozo, 0),
              isIndenizacao ? "-" : calcularDataExata(item.dataInicioGozo, item.diasSolicitados - 1),
              isIndenizacao ? "-" : calcularDataExata(item.dataInicioGozo, item.diasSolicitados),
              item.diasSolicitados + " d",
              item.numeroPbdoc || '-',
              sStr
            ];
          });

          autoTable(doc, {
            startY: currentY, head: [colunas], body: linhas, theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85] }, // Cores Slate
            margin: { left: 20 }
          });

          currentY = (doc as any).lastAutoTable.finalY + 8;
        });
        currentY += 2;
      });
      currentY += 5;
    });

    const nomeArquivoClean = nomeSetorAlvo ? `_${nomeSetorAlvo.replace(/\s+/g, '_')}` : '';
    doc.save(`Ficha_Historica_Ferias${nomeArquivoClean}.pdf`);
  };

  // ========================================================================
  // RENDERIZADOR DE LINHAS PARA A TABELA
  // ========================================================================
  const renderizarTabelaFracionada = (listaItens: Solicitacao[], ocultarSetorInfo = false) => (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed divide-y divide-slate-200 text-left">
        <thead className="bg-slate-50/70">
          <tr>
            {!ocultarSetorInfo && <th className="w-[28%] px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Servidor</th>}
            <th className={`${ocultarSetorInfo ? 'w-[15%]' : 'w-[12%]'} px-5 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider`}>Parcela</th>
            <th className="w-[15%] px-5 py-3 text-center text-xs font-bold text-[#005aa9] uppercase tracking-wider">Data Início</th>
            <th className="w-[15%] px-5 py-3 text-center text-xs font-bold text-red-600 uppercase tracking-wider">Data Fim</th>
            <th className="w-[15%] px-5 py-3 text-center text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50/30">Retorno ao Setor</th>
            <th className="w-[15%] px-5 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Processo PBDOC</th>
            <th className="w-[13%] px-5 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="w-[12%] px-5 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {listaItens.map((item) => {
            const isIndenizacao = item.modalidade === 'INDENIZACAO';

            return (
              <tr key={item.id} className={`${isIndenizacao ? 'hover:bg-amber-50/40 bg-amber-50/10' : 'hover:bg-[#005aa9]/5'} transition-colors duration-150`}>
                {!ocultarSetorInfo && (
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-800">{item.servidorNome}</div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Mat: {item.matricula || '-'}</div>
                    {filtroStatus !== 'HISTORICO' && <div className="text-xs font-semibold text-[#005aa9] mt-1">{item.lotacao || 'Lotação não informada'}</div>}
                  </td>
                )}
                <td className="px-5 py-3.5 whitespace-nowrap text-center">
                  <div className="text-sm font-black text-slate-700">{item.diasSolicitados} dias</div>
                  {!ocultarSetorInfo && (
                    <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#005aa9]/10 text-[#005aa9] border border-[#005aa9]/20">
                      Ref: {getReferenciaFormatada(item)}
                    </div>
                  )}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap text-center text-sm font-bold text-[#005aa9]">
                  {isIndenizacao ? <span className="text-slate-400">--/--/----</span> : calcularDataExata(item.dataInicioGozo, 0)}
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-center text-sm font-bold text-red-600">
                  {isIndenizacao ? <span className="text-amber-600 italic">Não se aplica (Pecúnia)</span> : calcularDataExata(item.dataInicioGozo, item.diasSolicitados - 1)}
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-center text-sm font-black text-emerald-700 bg-emerald-50/20">
                  {isIndenizacao ? <span className="text-amber-700/60 font-medium italic">Não se aplica</span> : calcularDataExata(item.dataInicioGozo, item.diasSolicitados)}
                </td>
                
                <td className="px-5 py-3.5 whitespace-nowrap text-center text-xs font-mono text-slate-500 font-bold">{item.numeroPbdoc || '-'}</td>
                <td className="px-5 py-3.5 whitespace-nowrap text-center">
                  {renderStatus(item.status, item.dataInicioGozo, isIndenizacao ? '' : getRawDataFim(item.dataInicioGozo, item.diasSolicitados - 1), item.modalidade)}
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-center">
                  {item.status === 'PENDENTE_CHEFIA' && (
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => aprovarPedido(item.id)} title="Aprovar" className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-200 transition-colors shadow-sm"><Check size={15} /></button>
                      <button onClick={() => rejeitarPedido(item.id)} title="Rejeitar" className="bg-red-100 text-red-700 p-1.5 rounded-lg hover:bg-red-200 transition-colors shadow-sm"><X size={15} /></button>
                    </div>
                  )}
                  {item.status === 'APROVADA' && !isIndenizacao && filtroStatus !== 'HISTORICO' && (
                    <button onClick={() => interromperPedido(item.id)} title="Interromper Férias" className="mx-auto bg-amber-100 text-amber-700 p-1.5 rounded-lg hover:bg-amber-200 flex items-center transition-colors shadow-sm"><AlertTriangle size={15} /></button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    // Transformado para w-full para preencher todo o conteúdo, acompanhando os outros formulários
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8 relative">
      
      {/* CABEÇALHO AZUL OFICIAL DA PB */}
      <div className="bg-[#005aa9] px-8 py-6 text-white transition-colors duration-500">
        <div className="flex items-center gap-3">
          <CalendarDays className="text-blue-100" size={32} />
          <div>
            <h2 className="text-2xl font-black tracking-tight">Painel de Férias</h2>
            <p className="text-blue-100/90 text-sm mt-1 font-medium">
              Acompanhe o cronograma, aprove solicitações e consulte o histórico da secretaria.
            </p>
          </div>
        </div>
      </div>
      
      {/* FILTROS E BARRA DE FERRAMENTAS */}
      <div className="px-8 py-5 border-b border-slate-200 bg-white flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex bg-slate-100/80 p-1.5 rounded-xl shadow-inner border border-slate-200/60">
          <button onClick={() => setFiltroStatus('ATUAIS_FUTURAS')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filtroStatus === 'ATUAIS_FUTURAS' ? 'bg-white text-[#005aa9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Atuais e Futuras</button>
          <button onClick={() => setFiltroStatus('PENDENTES')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filtroStatus === 'PENDENTES' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Pendentes</button>
          <button onClick={() => setFiltroStatus('HISTORICO')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filtroStatus === 'HISTORICO' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Histórico Completo</button>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-stretch md:items-center">
          <select
            value={filtroStatusSecundario}
            onChange={(e) => setFiltroStatusSecundario(e.target.value)}
            className="block px-4 py-2.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-[#005aa9]/20 focus:border-[#005aa9] outline-none transition-all cursor-pointer"
          >
            <option value="">Todos os Status</option>
            <option value="AGENDADA">🗓️ Agendada</option>
            <option value="EM_GOZO">✅ Em Gozo</option>
            <option value="CONCLUIDA">🏁 Concluída</option>
            <option value="PENDENTE_CHEFIA">⏳ Pendente</option>
            <option value="INTERROMPIDA">⚠️ Interrompida</option>
            <option value="REJEITADA">❌ Rejeitada</option>
          </select>

          <select
            value={filtroSetor}
            onChange={(e) => setFiltroSetor(e.target.value)}
            className="block px-4 py-2.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-[#005aa9]/20 focus:border-[#005aa9] outline-none transition-all cursor-pointer max-w-[200px]"
          >
            <option value="">Todos os Setores</option>
            {setoresUnicos.map((setor) => (
              <option key={setor} value={setor}>{setor}</option>
            ))}
          </select>

          <div className="relative flex-1 md:w-56">
            <Search size={16} className="absolute inset-y-0 left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar Servidor..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-[#005aa9]/20 focus:border-[#005aa9] text-sm font-medium outline-none transition-all"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={() => exportarParaPDF()} disabled={solicitacoesFiltradas.length === 0} className="flex items-center gap-2 text-sm bg-[#005aa9]/10 border border-[#005aa9]/20 hover:bg-[#005aa9]/20 text-[#005aa9] py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 font-bold shadow-sm">
              <FileDown size={16} /> PDF
            </button>
            <button onClick={buscarHistoricoGeral} className="flex items-center justify-center gap-2 text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 p-2.5 rounded-xl transition-all shadow-sm">
              <RefreshCw size={18} className={carregando ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <div className="p-6 bg-slate-50/50">
        {carregando ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#005aa9]"></div>
          </div>
        ) : solicitacoesFiltradas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm">
            <CalendarCheck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Nenhum registro encontrado com estes filtros.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
            
            {/* ABAS ORDINÁRIAS */}
            {filtroStatus !== 'HISTORICO' && renderizarTabelaFracionada(itensAtuais, false)}

            {/* ABA HISTÓRICO COMPLETO */}
            {filtroStatus === 'HISTORICO' && (
              <div className="bg-white divide-y divide-slate-200">
                {Object.entries(historicoHierarquico).map(([setor, servidoresObj]) => {
                  const isSetorAberto = setoresExpandidos[setor];
                  const totalRegistrosNoSetor = Object.values(servidoresObj).reduce(
                    (sum, srv) => sum + Object.values(srv.periodos).reduce((s, p) => s + p.solicitacoes.length, 0), 0
                  );

                  return (
                    <div key={setor} className="group">
                      
                      {/* NÍVEL 1: Acordeão do Setor */}
                      <div 
                        onClick={() => toggleSetor(setor)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-100/50 transition-colors cursor-pointer text-left focus:outline-none bg-slate-50/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl transition-colors ${isSetorAberto ? 'bg-[#005aa9] text-white' : 'bg-[#005aa9]/10 text-[#005aa9]'}`}>
                            <FolderOpen size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm md:text-base">{setor}</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{totalRegistrosNoSetor} parcelas registradas</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-5">
                          <button
                            onClick={(e) => { e.stopPropagation(); exportarParaPDF(setor); }}
                            className="flex items-center gap-1.5 bg-white border border-[#005aa9]/20 hover:bg-[#005aa9]/10 text-[#005aa9] font-bold py-1.5 px-3 rounded-lg text-xs transition-all shadow-sm cursor-pointer"
                          >
                            <Printer size={14} /> <span className="hidden sm:inline">Imprimir Setor</span>
                          </button>
                          <div className={`text-slate-400 ${isSetorAberto ? 'text-[#005aa9]' : ''}`}>
                            {isSetorAberto ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                          </div>
                        </div>
                      </div>

                      {/* NÍVEL 2: Servidores */}
                      {isSetorAberto && (
                        <div className="p-5 bg-slate-50/40 border-t border-slate-200/60 space-y-4">
                          {Object.values(servidoresObj).map((srv) => {
                            const chaveServidorSetor = `${setor}_${srv.matricula || srv.servidorNome}`;
                            const isServidorAberto = servidoresExpandidos[chaveServidorSetor];
                            const totalParcelasDoServidor = Object.values(srv.periodos).reduce((s, p) => s + p.solicitacoes.length, 0);

                            return (
                              <div key={chaveServidorSetor} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                
                                <div 
                                  onClick={() => toggleServidor(chaveServidorSetor)}
                                  className="px-5 py-3.5 flex justify-between items-center bg-white hover:bg-[#005aa9]/5 transition-colors cursor-pointer select-none"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isServidorAberto ? 'bg-[#005aa9] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                      <User size={18} />
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-800 text-sm md:text-base mr-2">{srv.servidorNome}</span>
                                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">Mat: {srv.matricula || '-'}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">{totalParcelasDoServidor} lançamentos</span>
                                    <div className="text-slate-400">
                                      {isServidorAberto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                  </div>
                                </div>

                                {/* NÍVEL 3: Períodos */}
                                {isServidorAberto && (
                                  <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-4">
                                    {Object.values(srv.periodos).map((per, idx) => {
                                      return (
                                        <div key={idx} className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
                                          
                                          <div className="bg-slate-100/60 px-4 py-2.5 flex justify-between items-center border-b border-slate-200/80">
                                            <div className="flex items-center gap-2">
                                              <Layers size={14} className="text-[#005aa9]" />
                                              <span className="text-xs font-black text-slate-700">Período de Referência: <strong className="text-[#005aa9]">{per.textoReferencia}</strong></span>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-xs">
                                              Total Usufruído/Indenizado: {per.totalDiasGozados} dias
                                            </span>
                                          </div>

                                          {/* Tabela Interna */}
                                          {renderizarTabelaFracionada(per.solicitacoes, true)}
                                          
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Paginação */}
            {filtroStatus !== 'HISTORICO' && totalPaginas > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))} disabled={paginaAtual === 1} className="relative inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-sm">Anterior</button>
                  <button onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))} disabled={paginaAtual === totalPaginas} className="relative ml-3 inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-sm">Próxima</button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">
                      Mostrando <span className="font-bold text-slate-900">{indicePrimeiroItem + 1}</span> até <span className="font-bold text-slate-900">{Math.min(indiceUltimoItem, totalItens)}</span> de <span className="font-bold text-slate-900">{totalItens}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-lg shadow-sm" aria-label="Pagination">
                      <button onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))} disabled={paginaAtual === 1} className="relative inline-flex items-center rounded-l-lg px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 disabled:opacity-50 bg-white">
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                        <button key={pagina} onClick={() => setPaginaAtual(pagina)} className={`relative inline-flex items-center px-4 py-2 text-sm font-bold focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${pagina === paginaAtual ? "z-10 bg-[#005aa9] text-white focus-visible:outline-[#005aa9] ring-1 ring-inset ring-[#005aa9]" : "text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 bg-white"}`}>
                          {pagina}
                        </button>
                      ))}
                      <button onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))} disabled={paginaAtual === totalPaginas} className="relative inline-flex items-center rounded-r-lg px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 disabled:opacity-50 bg-white">
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
    </div>
  );
}