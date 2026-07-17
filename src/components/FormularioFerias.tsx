import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { useEffect, useState } from 'react';
import { Calculator, AlertCircle, CalendarDays, ArrowRight, History, Palmtree, Coins, Loader2, Info, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Select from 'react-select'; 

// =====================================================================
// 1. O SCHEMA INTELIGENTE 
// =====================================================================
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
    const hoje = new Date().toISOString().split('T')[0];
    if (!data.isRetroativo && data.dataInicioGozo < hoje) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A data não pode ser retroativa. Ative o 'Registro Histórico'.", path: ["dataInicioGozo"] });
    }
  }
});
type FormularioData = z.infer<typeof formSchema>;

export function FormularioFerias() {
  const [servidores, setServidores] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [carregandoPeriodos, setCarregandoPeriodos] = useState(false);
  const [servidorSelecionadoId, setServidorSelecionadoId] = useState<number | ''>('');

  const { register, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm<FormularioData>({
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
    if (statusTexto === "Acumulada / Vencida") return { badge: "🔴", classe: "text-red-700 bg-red-100" };
    if (statusTexto === "Vencendo (Art. 79)") return { badge: "🟡", classe: "text-yellow-700 bg-yellow-100" };
    return { badge: "🟢", classe: "text-green-700 bg-green-100" };
  };

  const calcularDataExata = (dataString: string, diasSomar: number = 0) => {
    if (!dataString) return '';
    const dataLimpa = dataString.substring(0, 10);
    const [ano, mes, dia] = dataLimpa.split('-').map(Number);
    const dataCalculada = new Date(ano, mes - 1, dia);
    dataCalculada.setDate(dataCalculada.getDate() + diasSomar);
    return dataCalculada.toLocaleDateString('pt-BR');
  };

  const obterJanelaConcessiva = (dataFimString: string) => {
    if (!dataFimString) return null;
    const dataLimpa = dataFimString.substring(0, 10);
    const [ano, mes, dia] = dataLimpa.split('-').map(Number);
    
    const inicio = new Date(ano, mes - 1, dia + 1);
    const fim = new Date(ano + 1, mes - 1, dia);
    
    return {
      inicio: inicio.toLocaleDateString('pt-BR'),
      fim: fim.toLocaleDateString('pt-BR')
    };
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

  // =====================================================================
  // PREPARAÇÃO DOS DADOS PARA O REACT-SELECT E ESTILOS CUSTOMIZADOS
  // =====================================================================
  const opcoesServidores = servidores.map((servidor) => ({
    value: servidor.id,
    label: `${servidor.nome} (Mat: ${servidor.matricula || '-'}) ${servidor.operadorRaioX ? '☢️' : ''}`
  }));

  const estilosCustomizadosSelect = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '52px', // Deixando o campo na mesma proporção dos outros
      borderRadius: '0.75rem', 
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db', 
      boxShadow: state.isFocused ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none',
      backgroundColor: state.isFocused ? '#ffffff' : '#f9fafb',
      cursor: 'text',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: '#ffffff'
      }
    }),
    menu: (provided: any) => ({
      ...provided,
      borderRadius: '0.75rem',
      overflow: 'hidden',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 50
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#e0e7ff' : state.isFocused ? '#f3f4f6' : 'white',
      color: state.isSelected ? '#3730a3' : '#374151',
      cursor: 'pointer',
      padding: '0.75rem 1rem',
      fontWeight: state.isSelected ? 'bold' : 'normal',
      '&:active': {
        backgroundColor: '#c7d2fe'
      }
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#9ca3af'
    })
  };

  return (
    <div className="max-w-5xl bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mt-2">
      
      <div className={`px-8 py-7 text-white transition-colors duration-500 ${isRetroativoAtivo ? 'bg-gradient-to-r from-amber-700 to-orange-600' : 'bg-gradient-to-r from-blue-700 to-indigo-600'}`}>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          {isRetroativoAtivo ? <History className="text-amber-100" size={28} /> : <CalendarDays className="text-blue-100" size={28} />}
          {isRetroativoAtivo ? 'Lançamento de Histórico (Passivo)' : 'Agendamento de Férias'}
        </h2>
        <p className={`text-sm mt-2 font-medium ${isRetroativoAtivo ? 'text-amber-100' : 'text-blue-100/90'}`}>
          {isRetroativoAtivo ? 'Modo restrito para inserção de férias de anos anteriores já gozadas.' : 'Preencha os dados abaixo para registrar uma nova concessão no sistema.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(salvarSolicitacao)} className="p-8">
        
        <div className={`flex items-center justify-between p-4 mb-8 rounded-xl border transition-all duration-300 ${isRetroativoAtivo ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isRetroativoAtivo ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500'}`}>
              <History size={20} />
            </div>
            <div>
              <p className={`text-sm font-bold ${isRetroativoAtivo ? 'text-amber-900' : 'text-gray-700'}`}>Registro Histórico (Datas Passadas)</p>
              <p className="text-xs font-medium text-gray-500 mt-0.5">Ative essa chave APENAS se o servidor JÁ GOZOU estas férias no passado.</p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" {...register('isRetroativo')} />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
          </label>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* ================================================================= */}
          {/* COLUNA ESQUERDA: CAMPOS DO FORMULÁRIO */}
          {/* ================================================================= */}
          <div className="flex-1 space-y-7">
            
            {/* 1º DROPDOWN: SELECIONAR SERVIDOR SEMPRE VISÍVEL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">1. Selecione o Servidor</label>
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

            {/* O RESTANTE DO FORMULÁRIO SÓ APARECE SE UM SERVIDOR ESTIVER SELECIONADO */}
            {servidorSelecionadoId !== '' ? (
              <div className="space-y-7 animate-in fade-in slide-in-from-top-4 duration-500">
                
                {/* 2º DROPDOWN: PERÍODO INTELIGENTE */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">2. Selecione o Período Aquisitivo</label>
                  {carregandoPeriodos ? (
                    <div className="w-full border border-gray-200 rounded-xl p-3.5 bg-gray-50 flex items-center gap-3 text-blue-600 font-bold">
                      <Loader2 className="animate-spin" size={20} />
                      Calculando passivo e regras...
                    </div>
                  ) : (
                    periodos.length > 0 ? (
                      <>
                        <select 
                          {...register('periodoId', { valueAsNumber: true })}
                          className="w-full border border-emerald-300 rounded-xl p-3.5 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/70 outline-none transition-all duration-200 cursor-pointer"
                        >
                          <option value="">-- Selecione o Período --</option>
                          {periodos.map((p) => {
                            const statusInfo = getBadgeStatus(p.status);
                            return (
                              <option key={p.id} value={p.id}>
                                Ref: {p.referencia} — (Saldo: {p.saldoDias} dias) {statusInfo.badge} {p.status}
                              </option>
                            );
                          })}
                        </select>
                        {errors.periodoId && <span className="text-red-500 text-xs font-medium mt-1.5 block">{errors.periodoId.message}</span>}
                        
                        {periodoAtual && (
                          <div className="mt-4 bg-sky-50 border border-sky-200 rounded-xl p-4 text-sm shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <Info className="text-sky-600 shrink-0 mt-0.5" size={24} />
                            <div>
                              <strong className="block text-base text-sky-900 mb-1">Período Concessivo</strong>
                              <p className="text-sky-800 font-medium leading-relaxed">
                                Para o período selecionado, o servidor pode gozar férias entre <strong className="text-sky-900 bg-sky-200/50 px-1.5 py-0.5 rounded">{obterJanelaConcessiva(periodoAtual.dataFim)?.inicio}</strong> e <strong className="text-sky-900 bg-sky-200/50 px-1.5 py-0.5 rounded">{obterJanelaConcessiva(periodoAtual.dataFim)?.fim}</strong>.
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 shadow-sm mt-1">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                          <div>
                            <strong className="block mb-1 text-base">Nenhum período com saldo disponível.</strong>
                            <p className="text-sm leading-relaxed font-medium">O motor de cálculo não encontrou férias pendentes para este servidor baseadas na data de admissão e no registro de gozos e afastamentos anteriores.</p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* 3º MODALIDADE */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">3. Natureza do Lançamento</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setValue('modalidade', 'GOZO', { shouldValidate: true })}
                      className={`flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold text-sm border transition-all ${modalidadeSelecionada === 'GOZO' ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                    >
                      <Palmtree size={18} />
                      ⛱️ Gozo de Férias
                    </button>
                    <button
                      type="button"
                      onClick={() => { setValue('modalidade', 'INDENIZACAO', { shouldValidate: true }); setValue('dataInicioGozo', ''); }}
                      className={`flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold text-sm border transition-all ${modalidadeSelecionada === 'INDENIZACAO' ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                    >
                      <Coins size={18} />
                      💰 Indenização (Pecúnia)
                    </button>
                  </div>
                </div>

                {/* DATAS E DIAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Data de Início do Gozo</label>
                    <input 
                      type="date" 
                      disabled={modalidadeSelecionada === 'INDENIZACAO'}
                      {...register('dataInicioGozo')}
                      className={`w-full border rounded-xl p-3.5 focus:ring-4 outline-none transition-all duration-200 ${modalidadeSelecionada === 'INDENIZACAO' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : (isRetroativoAtivo ? 'bg-amber-50 border-amber-300 focus:ring-amber-500/20 focus:border-amber-500' : 'bg-gray-50 border-gray-300 focus:ring-blue-500/20 focus:border-blue-500 hover:bg-white')}`}
                    />
                    {errors.dataInicioGozo && <span className="text-red-500 text-xs font-bold mt-1.5 block">{errors.dataInicioGozo.message}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Dias Solicitados</label>
                    <input 
                      type="number" 
                      {...register('diasSolicitados', { valueAsNumber: true })}
                      className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 hover:bg-white outline-none transition-all duration-200"
                    />
                    {errors.diasSolicitados && <span className="text-red-500 text-xs font-medium mt-1.5 block">{errors.diasSolicitados.message}</span>}
                  </div>
                </div>

                {/* AVISO ARTIGO 80 */}
                {ehOperadorRaioX && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm font-medium shadow-sm flex gap-3 items-center">
                    <span className="text-xl">☢️</span> 
                    <p><strong>Atenção ao Art. 80:</strong> Servidor opera com Raios X. O período deve ser obrigatoriamente de <strong>20 dias</strong>.</p>
                  </div>
                )}

                {/* PBDOC */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Número do PBDOC (Autorização)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: SEPLAG-PRC-2026/01234"
                    {...register('numeroPbdoc')}
                    className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 hover:bg-white outline-none transition-all duration-200 uppercase"
                  />
                  {errors.numeroPbdoc && <span className="text-red-500 text-xs font-medium mt-1.5 block">{errors.numeroPbdoc.message}</span>}
                </div>
              </div>
            ) : (
              /* PLACEHOLDER ELEGANTE QUANDO NÃO HÁ SERVIDOR SELECIONADO */
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center text-gray-400 animate-in fade-in duration-500">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <Search size={32} className="text-gray-400" />
                </div>
                <h4 className="font-bold text-gray-500 mb-1 text-base">Aguardando Seleção</h4>
                <p className="text-sm font-medium">Busque e selecione um servidor acima para liberar<br />as regras de negócio e os próximos passos do agendamento.</p>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* COLUNA DIREITA: RESUMO E BOTÃO DE SALVAR */}
          {/* ================================================================= */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="sticky top-6 space-y-5">
              
              <div className={`p-6 rounded-2xl border transition-all duration-300 shadow-sm ${(dataInicioGozo || modalidadeSelecionada === 'INDENIZACAO') && diasMath > 0 && servidorSelecionadoId !== '' ? (isRetroativoAtivo ? 'bg-amber-50/50 border-amber-200' : 'bg-indigo-50/50 border-indigo-200') : 'bg-gray-50 border-gray-200'}`}>
                <h3 className="text-sm font-bold flex items-center gap-2 mb-6 text-gray-800 border-b border-gray-200/60 pb-3">
                  <Calculator size={18} className={(dataInicioGozo || modalidadeSelecionada === 'INDENIZACAO') && diasMath > 0 && servidorSelecionadoId !== '' ? (isRetroativoAtivo ? 'text-amber-600' : 'text-indigo-600') : 'text-gray-400'} /> 
                  Resumo do Agendamento
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Início</span>
                    <span className={`text-sm font-black ${dataInicioGozo && diasMath > 0 && servidorSelecionadoId !== '' ? 'text-blue-700' : 'text-gray-400'}`}>
                      {modalidadeSelecionada === 'INDENIZACAO' || servidorSelecionadoId === '' ? '--/--/----' : (dataInicioGozo && diasMath > 0 ? calcularDataExata(dataInicioGozo, 0) : '--/--/----')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fim</span>
                    <span className={`text-sm font-black ${modalidadeSelecionada === 'INDENIZACAO' ? 'text-amber-600 italic' : (dataInicioGozo && diasMath > 0 && servidorSelecionadoId !== '' ? 'text-red-600' : 'text-gray-400')}`}>
                      {servidorSelecionadoId === '' ? '--/--/----' : dataFimPreview}
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200/60 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Retorno</span>
                    <span className={`text-sm font-black ${modalidadeSelecionada === 'INDENIZACAO' ? 'text-amber-600 italic' : (dataInicioGozo && diasMath > 0 && servidorSelecionadoId !== '' ? 'text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded shadow-sm' : 'text-gray-400')}`}>
                      {servidorSelecionadoId === '' ? '--/--/----' : dataRetornoPreview}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={servidorSelecionadoId === ''} // Desabilita o botão se não houver servidor
                className={`w-full text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 outline-none focus:ring-4 
                  ${servidorSelecionadoId === '' 
                    ? 'bg-gray-300 cursor-not-allowed shadow-none text-gray-500' // Visual inativo
                    : isRetroativoAtivo 
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 focus:ring-amber-500/30 hover:shadow-amber-500/30 transform hover:-translate-y-0.5' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500/30 hover:shadow-blue-500/30 transform hover:-translate-y-0.5'
                  }`}
              >
                {isRetroativoAtivo ? 'Gravar Dossiê Histórico' : 'Confirmar Agendamento'}
                <ArrowRight size={18} />
              </button>
              
            </div>
          </div>
          
        </div>
      </form>
    </div>
  );
}