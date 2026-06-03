import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { useEffect, useState } from 'react';
import { CalendarPlus, Send, Calculator, Info, AlertCircle, CalendarDays, ArrowRight, History, Palmtree, Coins } from 'lucide-react';

// =====================================================================
// 1. O SCHEMA INTELIGENTE (Cruza as validações de Modalidade e Data)
// =====================================================================
const formSchema = z.object({
  periodoId: z.number({ message: "Selecione um período aquisitivo" }).min(1, "Selecione um período aquisitivo"),
  isRetroativo: z.boolean(), // <-- REMOVIDO o .default()
  modalidade: z.enum(['GOZO', 'INDENIZACAO']), // <-- REMOVIDO o .default()
  dataInicioGozo: z.string().optional().or(z.literal('')),
  diasSolicitados: z.number({ message: "Informe um número válido" }).min(1, "Mínimo de 1 dia").max(40, "Máximo de 40 dias"),
  numeroPbdoc: z.string().min(3, "Informe o número do processo PBDOC válido")
}).superRefine((data, ctx) => {
  // Regras aplicáveis APENAS se for GOZO (Descanso)
  if (data.modalidade === 'GOZO') {
    if (!data.dataInicioGozo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data de início é obrigatória",
        path: ["dataInicioGozo"]
      });
      return;
    }

 const hoje = new Date().toISOString().split('T')[0];
    
    // Se NÃO for retroativo e a data for menor que hoje, gera o erro
    if (!data.isRetroativo && data.dataInicioGozo < hoje) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data não pode ser retroativa. Ative o 'Registro Histórico' acima.",
        path: ["dataInicioGozo"]
      });
    }
  }
});
type FormularioData = z.infer<typeof formSchema>;

export function FormularioFerias() {
  const [periodos, setPeriodos] = useState<any[]>([]);
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

  const periodoAtual = periodos.find(p => p.id === periodoSelecionadoId);
  const ehOperadorRaioX = periodoAtual?.servidor?.operadorRaioX;

  useEffect(() => {
    api.get('/periodos')
      .then(response => setPeriodos(response.data))
      .catch(error => console.error("Erro ao buscar períodos:", error));
  }, []);

  const classificarStatusPeriodo = (dataFimString: string) => {
    if (!dataFimString) return { texto: "Disponível", classe: "text-green-700 bg-green-100 border-green-200", badge: "🟢" };

    const dataFim = new Date(dataFimString);
    const hoje = new Date();

    const dataLimiteGozo = new Date(dataFim);
    dataLimiteGozo.setMonth(dataLimiteGozo.getMonth() + 12);

    const dataAvisoVencendo = new Date(dataLimiteGozo);
    dataAvisoVencendo.setMonth(dataAvisoVencendo.getMonth() - 1);

    if (hoje > dataLimiteGozo) {
      return { 
        texto: "Acumulada / Vencida", 
        classe: "text-red-700 bg-red-100 border-red-200",
        badge: "🔴",
        aviso: "🚨 ATENÇÃO: Este passivo ultrapassou o limite legal. Uso prioritário obrigatório!"
      };
    } else if (hoje >= dataAvisoVencendo && hoje <= dataLimiteGozo) {
      return { 
        texto: "Vencendo (Art. 79)", 
        classe: "text-yellow-700 bg-yellow-100 border-yellow-200",
        badge: "🟡",
        aviso: "⚠️ ATENÇÃO (Art. 79, § 3º): Este período atingiu o 23º mês. A concessão é obrigatória e imediata."
      };
    } else {
      return { 
        texto: "Disponível", 
        classe: "text-green-700 bg-green-100 border-green-200",
        badge: "🟢",
        aviso: null
      };
    }
  };

  const periodosComSaldo = periodos.filter((p) => p.saldoDias > 0);
  const servidoresUnicos = Array.from(new Map(periodosComSaldo.map((p) => [p.servidor?.id, p.servidor])).values());
  const periodosDoServidor = periodosComSaldo.filter((p) => p.servidor?.id === servidorSelecionadoId);

  const calcularDataExata = (dataString: string, diasSomar: number = 0) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-').map(Number);
    const dataCalculada = new Date(ano, mes - 1, dia);
    dataCalculada.setDate(dataCalculada.getDate() + diasSomar);
    return dataCalculada.toLocaleDateString('pt-BR');
  };

  const diasMath = Number(diasSolicitados) || 0;
  
  // Lógica dinâmica para o Resumo
  const dataFimPreview = modalidadeSelecionada === 'INDENIZACAO' 
    ? 'Não se aplica (Pecúnia)' 
    : (dataInicioGozo && diasMath > 0 ? calcularDataExata(dataInicioGozo, diasMath - 1) : '--/--/----');
    
  const dataRetornoPreview = modalidadeSelecionada === 'INDENIZACAO' 
    ? 'Não se aplica' 
    : (dataInicioGozo && diasMath > 0 ? calcularDataExata(dataInicioGozo, diasMath) : '--/--/----');

  const salvarSolicitacao = async (data: FormularioData) => {
    if (ehOperadorRaioX && data.diasSolicitados !== 20) {
      alert("⚠️ Pelo Art. 80 do Estatuto, servidores de Raios X devem tirar exatamente 20 dias por semestre. Ajuste o valor.");
      return;
    }

    try {
      await api.post(`/periodos/${data.periodoId}/solicitacoes`, {
        modalidade: data.modalidade, // <-- Enviando Modalidade pro Java
        dataInicioGozo: data.modalidade === 'GOZO' ? data.dataInicioGozo : null, // Indenização envia nulo
        diasSolicitados: data.diasSolicitados,
        numeroPbdoc: data.numeroPbdoc,
        abonoPecuniario: false,
        isRetroativo: data.isRetroativo 
      });
      
      alert(data.isRetroativo ? `✅ Histórico retroativo registrado com sucesso!` : `✅ Solicitação de férias agendada com sucesso!`);
      
      reset({ isRetroativo: false, modalidade: 'GOZO' });
      setServidorSelecionadoId('');
      
    } catch (error: any) {
      const mensagemErro = error.response?.data || error.response?.data?.message || 'Erro inesperado ao conectar com o servidor.';
      alert('❌ ' + JSON.stringify(mensagemErro).replace(/"/g, ''));
    }
  };

  return (
    <div className="max-w-5xl bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mt-2">
      
      {/* CABEÇALHO DINÂMICO */}
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
        
        {/* TOGGLE MODO RETROATIVO */}
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

        {/* LAYOUT DE DUAS COLUNAS */}
        <div className="flex flex-col lg:flex-row gap-10">
          
          <div className="flex-1 space-y-7">
            
            {/* 1º DROPDOWN: SELECIONAR SERVIDOR */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">1. Selecione o Servidor</label>
              <select 
                value={servidorSelecionadoId}
                onChange={(e) => {
                  setServidorSelecionadoId(Number(e.target.value));
                  setValue('periodoId', 0 as any); 
                }}
                className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 hover:bg-white outline-none transition-all duration-200 cursor-pointer"
              >
                <option value="">-- Busque e Selecione um Servidor --</option>
                {servidoresUnicos.map((servidor) => (
                  <option key={servidor?.id} value={servidor?.id}>
                    {servidor?.nome} (Mat: {servidor?.matricula || '-'}) {servidor?.operadorRaioX ? '☢️' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 2º DROPDOWN: SELECIONAR O PERÍODO */}
            {servidorSelecionadoId !== '' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-semibold text-gray-700 mb-2">2. Selecione o Período Aquisitivo</label>
                
                {periodosDoServidor.length > 0 ? (
                  <>
                    <select 
                      {...register('periodoId', { valueAsNumber: true })}
                      className="w-full border border-emerald-300 rounded-xl p-3.5 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/70 outline-none transition-all duration-200 cursor-pointer"
                    >
                      <option value="">-- Selecione o Período --</option>
                      {periodosDoServidor.map((p) => {
                        const statusInfo = classificarStatusPeriodo(p.dataFim);
                        const anoInicio = new Date(p.dataInicio).getFullYear();
                        const anoFim = new Date(p.dataFim).getFullYear();
                        const textoRef = anoInicio === anoFim ? anoFim : `${anoInicio}/${anoFim}`;

                        return (
                          <option key={p.id} value={p.id}>
                            Ref: {textoRef} — (Saldo: {p.saldoDias} dias) {statusInfo.badge} {statusInfo.texto}
                          </option>
                        );
                      })}
                    </select>
                    {errors.periodoId && <span className="text-red-500 text-xs font-medium mt-1.5 block">{errors.periodoId.message}</span>}
                  </>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 shadow-sm mt-1">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                      <div>
                        <strong className="block mb-1 text-base">Nenhum período com saldo disponível.</strong>
                        <p className="text-sm leading-relaxed font-medium">Vá até a tela Quadro de Lotação e clique no botão Passivo.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3º MODALIDADE (GOZO VS INDENIZAÇÃO) */}
            {servidorSelecionadoId !== '' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
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
            )}

            {/* GRID: LADO A LADO PARA DATAS E DIAS */}
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

            {ehOperadorRaioX && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm font-medium shadow-sm flex gap-3 items-center">
                <span className="text-xl">☢️</span> 
                <p><strong>Atenção ao Art. 80:</strong> Servidor opera com Raios X. O período deve ser obrigatoriamente de <strong>20 dias</strong>.</p>
              </div>
            )}

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

          <div className="w-full lg:w-80 shrink-0">
            <div className="sticky top-6 space-y-5">
              
              <div className={`p-6 rounded-2xl border transition-all duration-300 shadow-sm ${(dataInicioGozo || modalidadeSelecionada === 'INDENIZACAO') && diasMath > 0 ? (isRetroativoAtivo ? 'bg-amber-50/50 border-amber-200' : 'bg-indigo-50/50 border-indigo-200') : 'bg-gray-50 border-gray-200'}`}>
                <h3 className="text-sm font-bold flex items-center gap-2 mb-6 text-gray-800 border-b border-gray-200/60 pb-3">
                  <Calculator size={18} className={(dataInicioGozo || modalidadeSelecionada === 'INDENIZACAO') && diasMath > 0 ? (isRetroativoAtivo ? 'text-amber-600' : 'text-indigo-600') : 'text-gray-400'} /> 
                  Resumo do Agendamento
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Início</span>
                    <span className={`text-sm font-black ${dataInicioGozo && diasMath > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                      {modalidadeSelecionada === 'INDENIZACAO' ? '--/--/----' : (dataInicioGozo && diasMath > 0 ? calcularDataExata(dataInicioGozo, 0) : '--/--/----')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fim</span>
                    <span className={`text-sm font-black ${modalidadeSelecionada === 'INDENIZACAO' ? 'text-amber-600 italic' : (dataInicioGozo && diasMath > 0 ? 'text-red-600' : 'text-gray-400')}`}>
                      {dataFimPreview}
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200/60 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Retorno</span>
                    <span className={`text-sm font-black ${modalidadeSelecionada === 'INDENIZACAO' ? 'text-amber-600 italic' : (dataInicioGozo && diasMath > 0 ? 'text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded shadow-sm' : 'text-gray-400')}`}>
                      {dataRetornoPreview}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className={`w-full text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 transform hover:-translate-y-0.5 outline-none focus:ring-4 ${isRetroativoAtivo ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 focus:ring-amber-500/30 hover:shadow-amber-500/30' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500/30 hover:shadow-blue-500/30'}`}
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