import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { useEffect, useState } from 'react';
import { Calculator, AlertCircle, CalendarDays, ArrowRight, History, Palmtree, Coins, Loader2, Info, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Select from 'react-select'; 

const formSchema = z.object({
  periodoId: z.number({ message: "Selecione um período aquisitivo" }).min(1, "Selecione um período aquisitivo"),
  isRetroativo: z.boolean(), 
  modalidade: z.enum(['GOZO', 'INDENIZACAO']), 
  dataInicioGozo: z.string().optional().or(z.literal('')),
  diasSolicitados: z.number({ message: "Informe um número válido" }).min(1, "Mínimo de 1 dia").max(40, "Máximo de 40 dias"),
  numeroPbdoc: z.string().min(3, "Informe o número do processo PBDOC válido")
}).superRefine((data, ctx) => {
  if (data.modalidade === 'GOZO') {
    if (!data.dataInicioGozo) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A data de início é obrigatória", path: ["dataInicioGozo"] });
      return;
    }

    // =====================================================================
    // NOVO: Trava de segurança para impedir anos com mais de 4 dígitos
    // =====================================================================
    const anoInformado = data.dataInicioGozo.split('-')[0];
    if (anoInformado && anoInformado.length > 4) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O ano deve conter no máximo 4 dígitos.", path: ["dataInicioGozo"] });
      return;
    }

    const hoje = new Date().toISOString().split('T')[0];
    
    if (!data.isRetroativo && data.dataInicioGozo < hoje) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A data não pode ser retroativa. Ative o 'Registro Histórico'.", path: ["dataInicioGozo"] });
    }

    if (data.isRetroativo && data.dataInicioGozo > hoje) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Um registro histórico não pode ocorrer no futuro.", path: ["dataInicioGozo"] });
    }
  }
});
type FormularioData = z.infer<typeof formSchema>;

export function FormularioFerias() {
  const [servidores, setServidores] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [carregandoPeriodos, setCarregandoPeriodos] = useState(false);
  const [servidorSelecionadoId, setServidorSelecionadoId] = useState<number | ''>('');

  const { register, handleSubmit, watch, formState: { errors }, reset, setValue, setError } = useForm<FormularioData>({
    resolver: zodResolver(formSchema),
    defaultValues: { isRetroativo: false, modalidade: 'GOZO' }
  });

  const periodoSelecionadoId = watch('periodoId');
  const dataInicioGozo = watch('dataInicioGozo');
  const diasSolicitados = watch('diasSolicitados');
  const isRetroativoAtivo = watch('isRetroativo');
  const modalidadeSelecionada = watch('modalidade');
  
  const servidorAtual = servidores.find(s => s.id === servidorSelecionadoId);
  const ehOperadorRaioX = servidorAtual?.operadorRaioX;
  const periodoAtual = periodos.find(p => String(p.id) === String(periodoSelecionadoId));

  useEffect(() => {
    api.get('/servidores')
      .then(response => setServidores(response.data))
      .catch(error => {
        console.error("Erro ao buscar servidores:", error);
        toast.error("Não foi possível carregar a lista de servidores.");
      });
  }, []);

  useEffect(() => {
    if (servidorSelecionadoId) {
      setCarregandoPeriodos(true);
      api.get(`/servidores/${servidorSelecionadoId}/periodos-disponiveis`)
        .then(response => {
          setPeriodos(response.data);
          setValue('periodoId', '' as any);
        })
        .catch(error => {
          console.error("Erro ao carregar períodos:", error);
          toast.error("Erro ao calcular os períodos disponíveis.");
        })
        .finally(() => setCarregandoPeriodos(false));
    } else {
      setPeriodos([]);
      setValue('periodoId', '' as any);
    }
  }, [servidorSelecionadoId, setValue]);

  const getBadgeStatus = (statusTexto: string) => {
    if (statusTexto === "Acumulada / Vencida") return { badge: "🔴", classe: "text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-md text-xs" };
    if (statusTexto === "Vencendo (Art. 79)") return { badge: "🟡", classe: "text-yellow-700 bg-yellow-100 border border-yellow-200 px-2 py-0.5 rounded-md text-xs" };
    return { badge: "🟢", classe: "text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-md text-xs" };
  };

  const calcularDataExata = (dataString: string, diasSomar: number = 0) => {
    if (!dataString) return '';
    const dataLimpa = dataString.substring(0, 10);
    const [ano, mes, dia] = dataLimpa.split('-').map(Number);
    const dataCalculada = new Date(ano, mes - 1, dia);
    dataCalculada.setDate(dataCalculada.getDate() + diasSomar);
    return dataCalculada.toLocaleDateString('pt-BR');
  };

  const calcularJanelasEstatutarias = (periodo: any, servidor: any) => {
    if (!periodo || !servidor || !servidor.dataAdmissao) return null;

    const dataLimpa = servidor.dataAdmissao.substring(0, 10);
    const [anoAdm, mesAdm, diaAdm] = dataLimpa.split('-').map(Number);

    let anoBase = periodo.anoReferencia;
    if (!anoBase && periodo.referencia && typeof periodo.referencia === 'string') {
      const partes = periodo.referencia.split('/');
      if (partes.length === 2) anoBase = parseInt(partes[1], 10);
    }
    
    if (!anoBase) return null;

    const inicioConc = new Date(anoBase, mesAdm - 1, diaAdm);
    const fimConc = new Date(anoBase + 2, mesAdm - 1, diaAdm - 1);

    const formatarData = (d: Date) => {
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    return { concInicio: formatarData(inicioConc), concFim: formatarData(fimConc) };
  };

  const corrigirReferenciaEstatutaria = (p: any) => {
    if (p.referencia && typeof p.referencia === 'string' && p.referencia.includes('/')) {
      const [ano1, ano2] = p.referencia.split('/');
      if (ano1 === ano2) return `${ano1}/${parseInt(ano1) + 1}`;
      return p.referencia;
    }
    if (p.anoReferencia) return `${p.anoReferencia - 1}/${p.anoReferencia}`;
    return 'N/A';
  };

  const diasMath = Number(diasSolicitados) || 0;
  
  const dataFimPreview = modalidadeSelecionada === 'INDENIZACAO' 
    ? 'Não se aplica (Pecúnia)' 
    : (dataInicioGozo && diasMath > 0 ? calcularDataExata(dataInicioGozo, diasMath - 1) : '--/--/----');
    
  const dataRetornoPreview = modalidadeSelecionada === 'INDENIZACAO' 
    ? 'Não se aplica' 
    : (dataInicioGozo && diasMath > 0 ? calcularDataExata(dataInicioGozo, diasMath) : '--/--/----');

  const salvarSolicitacao = async (data: FormularioData) => {
    if (ehOperadorRaioX && data.diasSolicitados !== 20) {
      toast.error("Servidores de Raios X devem tirar exatamente 20 dias por semestre.", { icon: '☢️' });
      return;
    }

    if (data.modalidade === 'GOZO' && data.dataInicioGozo && periodoAtual && servidorAtual) {
      const janelas = calcularJanelasEstatutarias(periodoAtual, servidorAtual);
      
      if (janelas) {
        const formatarParaISO = (dataBR: string) => {
          const [d, m, a] = dataBR.split('/');
          return `${a}-${m}-${d}`;
        };

        const limiteInicioISO = formatarParaISO(janelas.concInicio);
        const limiteFimISO = formatarParaISO(janelas.concFim);

        if (data.dataInicioGozo < limiteInicioISO) {
          setError('dataInicioGozo', { type: 'manual', message: `Data não pode ser anterior a ${janelas.concInicio}` });
          toast.error("Operação barrada: Data inferior ao início do período concessivo.");
          return; 
        }

        if (data.dataInicioGozo > limiteFimISO) {
          setError('dataInicioGozo', { type: 'manual', message: `Data excede o limite legal de ${janelas.concFim} (Art 79)` });
          toast.error("Operação barrada: Data excede o limite máximo de 24 meses do Estatuto.");
          return; 
        }
      }
    }

    const toastId = toast.loading("Salvando solicitação...");

    try {
      await api.post(`/periodos/${data.periodoId}/solicitacoes`, {
        modalidade: data.modalidade, 
        dataInicioGozo: data.modalidade === 'GOZO' ? data.dataInicioGozo : null, 
        diasSolicitados: data.diasSolicitados,
        numeroPbdoc: data.numeroPbdoc,
        abonoPecuniario: false,
        isRetroativo: data.isRetroativo 
      });
      
      if (data.isRetroativo) {
        toast.success('Histórico retroativo registrado com sucesso!', { id: toastId });
      } else {
        toast.success('Solicitação de férias agendada com sucesso!', { id: toastId });
      }
      
      reset({ isRetroativo: false, modalidade: 'GOZO' });
      setServidorSelecionadoId('');
      
    } catch (error: any) {
      const mensagemErro = error.response?.data || error.response?.data?.message || 'Erro inesperado ao conectar com o servidor.';
      toast.error(JSON.stringify(mensagemErro).replace(/"/g, ''), { id: toastId });
    }
  };

  const opcoesServidores = servidores.map((servidor) => ({
    value: servidor.id,
    label: `${servidor.nome} (Mat: ${servidor.matricula || '-'}) ${servidor.operadorRaioX ? '☢️' : ''}`
  }));

  const estilosCustomizadosSelect = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '42px', 
      borderRadius: '0.5rem', 
      borderColor: state.isFocused ? '#005aa9' : '#cbd5e1', 
      boxShadow: state.isFocused ? '0 0 0 3px rgba(0, 90, 169, 0.15)' : 'none',
      backgroundColor: state.isFocused ? '#ffffff' : '#f8fafc',
      cursor: 'text',
      transition: 'all 0.2s ease',
      fontSize: '0.875rem',
      '&:hover': {
        backgroundColor: '#ffffff'
      }
    }),
    menu: (provided: any) => ({
      ...provided,
      borderRadius: '0.5rem',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      zIndex: 50,
      border: '1px solid #e2e8f0'
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#e0f2fe' : state.isFocused ? '#f1f5f9' : 'white',
      color: state.isSelected ? '#005aa9' : '#334155',
      cursor: 'pointer',
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      fontWeight: state.isSelected ? 'bold' : 'normal',
      '&:active': {
        backgroundColor: '#bae6fd'
      }
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#94a3b8'
    })
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
      
      <div className={`px-8 py-6 text-white transition-colors duration-500 ${isRetroativoAtivo ? 'bg-amber-600' : 'bg-[#005aa9]'}`}>
        <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
          {isRetroativoAtivo ? <History className="text-amber-100" size={24} /> : <CalendarDays className="text-blue-100" size={24} />}
          {isRetroativoAtivo ? 'Lançamento de Histórico (Passivo)' : 'Agendamento de Férias'}
        </h2>
        <p className={`text-sm mt-1.5 font-medium ${isRetroativoAtivo ? 'text-amber-100' : 'text-blue-100/90'}`}>
          {isRetroativoAtivo ? 'Modo restrito para inserção de férias de anos anteriores já gozadas.' : 'Preencha os dados abaixo para registrar uma nova concessão no sistema.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(salvarSolicitacao)} className="p-8">
        
        <div className={`flex items-center justify-between p-3.5 mb-8 rounded-lg border transition-all duration-300 ${isRetroativoAtivo ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-md ${isRetroativoAtivo ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
              <History size={18} />
            </div>
            <div>
              <p className={`text-sm font-bold ${isRetroativoAtivo ? 'text-amber-900' : 'text-slate-700'}`}>Registro Histórico (Datas Passadas)</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Ative essa chave APENAS se o servidor JÁ GOZOU estas férias no passado.</p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" {...register('isRetroativo')} />
            <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          <div className="flex-1 space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">1. Selecione o Servidor</label>
              <Select
                options={opcoesServidores}
                value={opcoesServidores.find(op => op.value === servidorSelecionadoId) || null}
                onChange={(option) => setServidorSelecionadoId(option ? option.value : '')}
                placeholder="-- Busque pelo Nome ou Matrícula --"
                isSearchable
                isClearable
                noOptionsMessage={() => "Nenhum servidor encontrado"}
                styles={estilosCustomizadosSelect}
              />
            </div>

            {servidorSelecionadoId !== '' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">2. Selecione o Período Aquisitivo</label>
                  {carregandoPeriodos ? (
                    <div className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center gap-3 text-[#005aa9] font-bold text-sm">
                      <Loader2 className="animate-spin" size={18} />
                      Calculando passivo e regras estatutárias...
                    </div>
                  ) : (
                    periodos.length > 0 ? (
                      <>
                        <select 
                          {...register('periodoId', { valueAsNumber: true })}
                          className="w-full border border-[#005aa9]/30 rounded-lg py-2.5 px-3 focus:ring-4 focus:ring-[#005aa9]/15 focus:border-[#005aa9] bg-[#005aa9]/5 hover:bg-[#005aa9]/10 outline-none transition-all duration-200 cursor-pointer text-slate-800 font-medium text-sm"
                        >
                          <option value="">-- Selecione o Período --</option>
                          {periodos.map((p) => {
                            const statusInfo = getBadgeStatus(p.status);
                            const refCorrigida = corrigirReferenciaEstatutaria(p);
                            
                            return (
                              <option key={p.id} value={p.id}>
                                Ref: {refCorrigida} — (Saldo: {p.saldoDias} dias) &nbsp;&nbsp; {statusInfo.badge} {p.status}
                              </option>
                            );
                          })}
                        </select>
                        {errors.periodoId && <span className="text-red-500 text-xs font-bold mt-1.5 block">{errors.periodoId.message}</span>}
                        
                        {periodoAtual && (
                          <div className="mt-3 bg-[#005aa9]/5 border border-[#005aa9]/20 rounded-lg p-3.5 text-sm shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <Info className="text-[#005aa9] shrink-0 mt-0.5" size={20} />
                            <div>
                              <strong className="block text-sm text-[#005aa9] mb-1">Período Concessivo (Art. 79, § 2º e § 3º)</strong>
                              <p className="text-slate-700 font-medium text-xs leading-relaxed">
                                O servidor possui até 24 meses após a aquisição para gozar esse período, podendo agendar férias entre <strong className="text-[#005aa9] bg-[#005aa9]/10 px-1.5 py-0.5 rounded border border-[#005aa9]/20">{calcularJanelasEstatutarias(periodoAtual, servidorAtual)?.concInicio}</strong> e <strong className="text-[#005aa9] bg-[#005aa9]/10 px-1.5 py-0.5 rounded border border-[#005aa9]/20">{calcularJanelasEstatutarias(periodoAtual, servidorAtual)?.concFim}</strong>.
                              </p>
                              <p className="text-[#005aa9] text-[10px] font-bold mt-2 bg-[#005aa9]/10 inline-block px-2 py-1 rounded uppercase tracking-wider">
                                Atenção: No 23º mês, a concessão do gozo será obrigatória.
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-sm text-amber-800 shadow-sm mt-1">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                          <div>
                            <strong className="block mb-1 text-sm">Nenhum período com saldo disponível.</strong>
                            <p className="text-xs leading-relaxed font-medium">O motor de cálculo não encontrou férias pendentes para este servidor baseadas na data de admissão e no registro de gozos e afastamentos anteriores.</p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">3. Natureza do Lançamento</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setValue('modalidade', 'GOZO', { shouldValidate: true })}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm border transition-all ${modalidadeSelecionada === 'GOZO' ? 'bg-[#005aa9]/10 border-[#005aa9]/30 text-[#005aa9] shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      <Palmtree size={18} />
                      ⛱️ Gozo de Férias
                    </button>
                    <button
                      type="button"
                      onClick={() => { setValue('modalidade', 'INDENIZACAO', { shouldValidate: true }); setValue('dataInicioGozo', ''); }}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm border transition-all ${modalidadeSelecionada === 'INDENIZACAO' ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      <Coins size={18} />
                      💰 Indenização (Pecúnia)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Data de Início do Gozo</label>
                    <input 
                      type="date" 
                      max="9999-12-31" /* <=== TRAVA DE 4 DÍGITOS NO NAVEGADOR */
                      disabled={modalidadeSelecionada === 'INDENIZACAO'}
                      {...register('dataInicioGozo')}
                      className={`w-full border rounded-lg py-2.5 px-3 focus:ring-4 outline-none transition-all duration-200 text-slate-800 font-medium text-sm ${modalidadeSelecionada === 'INDENIZACAO' ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : (isRetroativoAtivo ? 'bg-amber-50 border-amber-300 focus:ring-amber-500/20 focus:border-amber-500' : 'bg-slate-50 border-slate-300 focus:ring-[#005aa9]/20 focus:border-[#005aa9] hover:bg-white')}`}
                    />
                    {errors.dataInicioGozo && <span className="text-red-500 text-xs font-bold mt-1.5 block">{errors.dataInicioGozo.message}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Dias Solicitados</label>
                    <input 
                      type="number" 
                      {...register('diasSolicitados', { valueAsNumber: true })}
                      className="w-full border border-slate-300 rounded-lg py-2.5 px-3 focus:ring-4 focus:ring-[#005aa9]/20 focus:border-[#005aa9] bg-slate-50 hover:bg-white outline-none transition-all duration-200 text-slate-800 font-medium text-sm"
                    />
                    {errors.diasSolicitados && <span className="text-red-500 text-xs font-bold mt-1.5 block">{errors.diasSolicitados.message}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Número do PBDOC</label>
                    <input 
                      type="text" 
                      placeholder="EX: SEP-PRC-2026/01"
                      {...register('numeroPbdoc')}
                      className="w-full border border-slate-300 rounded-lg py-2.5 px-3 focus:ring-4 focus:ring-[#005aa9]/20 focus:border-[#005aa9] bg-slate-50 hover:bg-white outline-none transition-all duration-200 uppercase text-slate-800 font-medium text-sm"
                    />
                    {errors.numeroPbdoc && <span className="text-red-500 text-xs font-bold mt-1.5 block">{errors.numeroPbdoc.message}</span>}
                  </div>
                </div>

                {ehOperadorRaioX && (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-xs font-medium shadow-sm flex gap-3 items-center">
                    <span className="text-lg">☢️</span> 
                    <p><strong>Atenção ao Art. 80:</strong> Servidor opera com Raios X. O período deve ser obrigatoriamente de <strong>20 dias</strong>.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center text-slate-400 animate-in fade-in duration-500">
                <div className="bg-slate-100 p-4 rounded-full mb-4">
                  <Search size={32} className="text-slate-400" />
                </div>
                <h4 className="font-bold text-slate-500 mb-1 text-base">Aguardando Seleção</h4>
                <p className="text-sm font-medium">Busque e selecione um servidor acima para liberar<br />as regras de negócio e os próximos passos do agendamento.</p>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0">
            <div className="sticky top-6 space-y-4">
              
              <div className={`p-6 rounded-xl border transition-all duration-300 shadow-sm ${(dataInicioGozo || modalidadeSelecionada === 'INDENIZACAO') && diasMath > 0 && servidorSelecionadoId !== '' ? (isRetroativoAtivo ? 'bg-amber-50 border-amber-200' : 'bg-[#005aa9]/5 border-[#005aa9]/20') : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="text-sm font-black flex items-center gap-2 mb-6 text-slate-800 border-b border-slate-200/80 pb-3">
                  <Calculator size={18} className={(dataInicioGozo || modalidadeSelecionada === 'INDENIZACAO') && diasMath > 0 && servidorSelecionadoId !== '' ? (isRetroativoAtivo ? 'text-amber-600' : 'text-[#005aa9]') : 'text-slate-400'} /> 
                  Resumo do Agendamento
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Início</span>
                    <span className={`text-sm font-black ${dataInicioGozo && diasMath > 0 && servidorSelecionadoId !== '' ? 'text-[#005aa9]' : 'text-slate-400'}`}>
                      {modalidadeSelecionada === 'INDENIZACAO' || servidorSelecionadoId === '' ? '--/--/----' : (dataInicioGozo && diasMath > 0 ? calcularDataExata(dataInicioGozo, 0) : '--/--/----')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fim</span>
                    <span className={`text-sm font-black ${modalidadeSelecionada === 'INDENIZACAO' ? 'text-amber-600 italic' : (dataInicioGozo && diasMath > 0 && servidorSelecionadoId !== '' ? 'text-red-600' : 'text-slate-400')}`}>
                      {servidorSelecionadoId === '' ? '--/--/----' : dataFimPreview}
                    </span>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200/80 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Retorno</span>
                    <span className={`text-sm font-black ${modalidadeSelecionada === 'INDENIZACAO' ? 'text-amber-600 italic' : (dataInicioGozo && diasMath > 0 && servidorSelecionadoId !== '' ? 'text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md shadow-sm' : 'text-slate-400')}`}>
                      {servidorSelecionadoId === '' ? '--/--/----' : dataRetornoPreview}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={servidorSelecionadoId === ''} 
                className={`w-full text-white font-black py-3 px-4 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 outline-none focus:ring-4 text-sm
                  ${servidorSelecionadoId === '' 
                    ? 'bg-slate-200 cursor-not-allowed shadow-none text-slate-400' 
                    : isRetroativoAtivo 
                      ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/30 transform hover:-translate-y-0.5' 
                      : 'bg-[#005aa9] hover:bg-[#004785] focus:ring-[#005aa9]/30 transform hover:-translate-y-0.5'
                  }`}
              >
                {isRetroativoAtivo ? 'Gravar Dossiê' : 'Confirmar Agendamento'}
                <ArrowRight size={18} />
              </button>
              
            </div>
          </div>
          
        </div>
      </form>
    </div>
  );
}