import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { useEffect, useState } from 'react';
import { CalendarPlus, Send, Calculator, Info } from 'lucide-react';

const formSchema = z.object({
  periodoId: z.number({ message: "Selecione um período aquisitivo" }).min(1, "Selecione um período aquisitivo"),
  dataInicioGozo: z.string()
    .min(1, "A data de início é obrigatória")
    .refine((dataStr) => {
      const hoje = new Date().toISOString().split('T')[0];
      return dataStr >= hoje;
    }, { message: "A data não pode ser retroativa" }),
  diasSolicitados: z.number({ message: "Informe um número válido" })
    .min(1, "Mínimo de 1 dia")
    .max(40, "Máximo de 40 dias"),
  numeroPbdoc: z.string().min(3, "Informe o número do processo PBDOC válido")
});
type FormularioData = z.infer<typeof formSchema>;

export function FormularioFerias() {
  const [periodos, setPeriodos] = useState<any[]>([]);
  
  // ---> NOVO: Estado para armazenar qual Servidor o RH selecionou no 1º dropdown
  const [servidorSelecionadoId, setServidorSelecionadoId] = useState<number | ''>('');

  const { register, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm<FormularioData>({
    resolver: zodResolver(formSchema),
  });

  // Observando os valores do formulário em tempo real
  const periodoSelecionadoId = watch('periodoId');
  const dataInicioGozo = watch('dataInicioGozo');
  const diasSolicitados = watch('diasSolicitados');

  const periodoAtual = periodos.find(p => p.id === periodoSelecionadoId);
  const ehOperadorRaioX = periodoAtual?.servidor?.operadorRaioX;

  useEffect(() => {
    api.get('/periodos')
      .then(response => setPeriodos(response.data))
      .catch(error => console.error("Erro ao buscar períodos:", error));
  }, []);

  // ========================================================================
  // ---> LÓGICA DOS DOIS DROPDOWNS <---
  // ========================================================================
  // 1. Pegamos apenas os períodos que têm saldo (> 0)
  const periodosComSaldo = periodos.filter((p) => p.saldoDias > 0);

  // 2. Extraímos os servidores únicos para o 1º Dropdown
  const servidoresUnicos = Array.from(
    new Map(periodosComSaldo.map((p) => [p.servidor?.id, p.servidor])).values()
  );

  // 3. Filtramos os períodos de acordo com o servidor escolhido para o 2º Dropdown
  const periodosDoServidor = periodosComSaldo.filter(
    (p) => p.servidor?.id === servidorSelecionadoId
  );
  // ========================================================================

  // Lógica Matemática da Previsão
  const calcularDataExata = (dataString: string, diasSomar: number = 0) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-').map(Number);
    const dataCalculada = new Date(ano, mes - 1, dia);
    dataCalculada.setDate(dataCalculada.getDate() + diasSomar);
    return dataCalculada.toLocaleDateString('pt-BR');
  };

  const diasMath = Number(diasSolicitados) || 0;
  const dataFimPreview = dataInicioGozo && diasMath > 0 ? calcularDataExata(dataInicioGozo, diasMath - 1) : '--/--/----';
  const dataRetornoPreview = dataInicioGozo && diasMath > 0 ? calcularDataExata(dataInicioGozo, diasMath) : '--/--/----';

  const salvarSolicitacao = async (data: FormularioData) => {
    // Validação de interface baseada no Art. 80 (Raio-X)
    if (ehOperadorRaioX && data.diasSolicitados !== 20) {
      alert("⚠️ Pelo Art. 80 do Estatuto, servidores de Raios X devem tirar exatamente 20 dias por semestre. Ajuste o valor.");
      return;
    }

    try {
      await api.post(`/periodos/${data.periodoId}/solicitacoes`, {
        ...data,
        abonoPecuniario: false 
      });
      alert('✅ Solicitação de férias enviada com sucesso!');
      
      // Limpa o formulário e volta o dropdown de servidores pro estado inicial
      reset();
      setServidorSelecionadoId('');
      
    } catch (error: any) {
      const mensagemErro = error.response?.data || error.response?.data?.message || 'Erro inesperado ao conectar com o servidor.';
      alert('❌ ' + JSON.stringify(mensagemErro).replace(/"/g, ''));
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 border border-gray-100 rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <CalendarPlus className="text-blue-600" />
        Solicitar Férias
      </h2>

      <form onSubmit={handleSubmit(salvarSolicitacao)} className="space-y-5">
        
        {/* ==================== 1º DROPDOWN: SELECIONAR SERVIDOR ==================== */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">1. Selecione o Servidor</label>
          <select 
            value={servidorSelecionadoId}
            onChange={(e) => {
              setServidorSelecionadoId(Number(e.target.value));
              // Limpa a seleção do período sempre que o RH trocar de servidor
              setValue('periodoId', 0 as any); 
            }}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 outline-none transition"
          >
            <option value="">-- Busque e Selecione um Servidor --</option>
            {servidoresUnicos.map((servidor) => (
              <option key={servidor?.id} value={servidor?.id}>
                {servidor?.nome} (Mat: {servidor?.matricula || '-'}) {servidor?.operadorRaioX ? '☢️' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* ==================== 2º DROPDOWN: SELECIONAR O PERÍODO ==================== */}
        {servidorSelecionadoId !== '' && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-medium text-gray-700 mb-1">2. Selecione o Período Aquisitivo</label>
            <select 
              {...register('periodoId', { valueAsNumber: true })}
              className="w-full border border-green-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50 outline-none transition"
            >
              <option value="">-- Selecione o Período --</option>
              {periodosDoServidor.map((p) => (
                <option key={p.id} value={p.id}>
                  Ref: {p.anoReferencia} — (Saldo: {p.saldoDias} dias) {p.alertaPrazo ? '🚨 VENCENDO' : ''}
                </option>
              ))}
            </select>
            {errors.periodoId && <span className="text-red-500 text-sm mt-1">{errors.periodoId.message}</span>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início do Gozo</label>
          <input 
            type="date" 
            {...register('dataInicioGozo')}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 outline-none transition"
          />
          {errors.dataInicioGozo && <span className="text-red-500 text-sm mt-1">{errors.dataInicioGozo.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dias Solicitados</label>
          <input 
            type="number" 
            {...register('diasSolicitados', { valueAsNumber: true })}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 outline-none transition"
          />
          {errors.diasSolicitados && <span className="text-red-500 text-sm mt-1">{errors.diasSolicitados.message}</span>}
        </div>

        {ehOperadorRaioX && (
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 text-xs font-medium">
            ☢️ <strong>Atenção ao Art. 80:</strong> Este servidor opera com Raios X/Substâncias Radioativas. O período deve ser obrigatoriamente de <strong>20 dias</strong> consecutivos.
          </div>
        )}

        {periodoAtual?.alertaPrazo && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800 text-sm flex items-start gap-3 shadow-sm">
            <span className="text-xl">🚨</span>
            <div>
              <strong className="block mb-1">Atenção ao Art. 79, § 3º</strong>
              <p className="text-xs">Este período aquisitivo atingiu o 23º mês. A concessão das férias para este servidor é <strong>obrigatória e imediata</strong>.</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número do PBDOC (Autorização)</label>
          <input 
            type="text" 
            placeholder="Ex: SEPLAG-PRC-2026/01234"
            {...register('numeroPbdoc')}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 outline-none transition uppercase"
          />
          {errors.numeroPbdoc && <span className="text-red-500 text-sm mt-1">{errors.numeroPbdoc.message}</span>}
        </div>

        {/* ================= CAIXA DE PREVISÃO EM TEMPO REAL ================= */}
        <div className={`p-4 rounded-lg border transition-all duration-300 ${dataInicioGozo && diasMath > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-gray-800">
            <Calculator size={18} className={dataInicioGozo && diasMath > 0 ? 'text-blue-600' : 'text-gray-400'} /> 
            Previsão do Período
          </h3>
          
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-gray-200">
            <div>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">Início</p>
              <p className={`text-sm font-bold ${dataInicioGozo && diasMath > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                {dataInicioGozo && diasMath > 0 ? calcularDataExata(dataInicioGozo, 0) : '--/--/----'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">Fim</p>
              <p className={`text-sm font-bold ${dataInicioGozo && diasMath > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {dataFimPreview}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">Retorno ao Setor</p>
              <p className={`text-sm font-bold ${dataInicioGozo && diasMath > 0 ? 'text-green-700 bg-green-100 px-1 py-0.5 rounded inline-block' : 'text-gray-400'}`}>
                {dataRetornoPreview}
              </p>
            </div>
          </div>
          
          {(!dataInicioGozo || diasMath <= 0) && (
            <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
              <Info size={14} /> Selecione a data e os dias para visualizar o cálculo.
            </p>
          )}
        </div>
        {/* ================================================================= */}

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition shadow-md flex items-center justify-center gap-2 mt-2"
        >
          <Send size={18} />
          Enviar Solicitação
        </button>
      </form>
    </div>
  );
}