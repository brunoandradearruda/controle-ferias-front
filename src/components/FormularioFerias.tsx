import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { useEffect, useState } from 'react';
import { CalendarPlus, Send } from 'lucide-react';

const formSchema = z.object({
  periodoId: z.number({ message: "Selecione um servidor" }).min(1, "Selecione um servidor"),
  dataInicioGozo: z.string()
    .min(1, "A data de início é obrigatória")
    .refine((dataStr) => {
      const hoje = new Date().toISOString().split('T')[0];
      return dataStr >= hoje;
    }, { message: "A data não pode ser retroativa" }),
  diasSolicitados: z.number({ message: "Informe um número válido" })
    .min(1, "Mínimo de 1 dia")
    .max(40, "Máximo de 40 dias"),
  // ---> NOVO CAMPO NO SCHEMA <---
  numeroPbdoc: z.string().min(3, "Informe o número do processo PBDOC válido")
});
type FormularioData = z.infer<typeof formSchema>;

export function FormularioFerias() {
  const [periodos, setPeriodos] = useState<any[]>([]);

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<FormularioData>({
    resolver: zodResolver(formSchema),
  });

  // Observa qual período/servidor foi escolhido para sabermos se ele é operador de Raios X
  const periodoSelecionadoId = watch('periodoId');
  const periodoAtual = periodos.find(p => p.id === periodoSelecionadoId);
  const ehOperadorRaioX = periodoAtual?.servidor?.operadorRaioX;

  useEffect(() => {
    api.get('/periodos')
      .then(response => setPeriodos(response.data))
      .catch(error => console.error("Erro ao buscar períodos:", error));
  }, []);

  const salvarSolicitacao = async (data: FormularioData) => {
    // Validação extra no Front-end baseada no Art. 80
    if (ehOperadorRaioX && data.diasSolicitados !== 20) {
      alert("⚠️ Pelo Art. 80 do Estatuto, servidores de Raios X devem tirar exatamente 20 dias por semestre. Ajuste o valor.");
      return;
    }

    try {
      await api.post(`/periodos/${data.periodoId}/solicitacoes`, {
        ...data,
        abonoPecuniario: false // Sempre falso de acordo com o estatuto da PB
      });
      alert('✅ Solicitação de férias enviada com sucesso!');
      reset();
    } catch (error: any) {
      const mensagemErro = error.response?.data || 'Erro inesperado ao conectar com o servidor.';
      alert('❌ Erro: ' + mensagemErro);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 border border-gray-100 rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <CalendarPlus className="text-blue-600" />
        Solicitar Férias
      </h2>

      <form onSubmit={handleSubmit(salvarSolicitacao)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Servidor (Período Aquisitivo)</label>
          <select 
            {...register('periodoId', { valueAsNumber: true })}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 outline-none transition"
          >
            <option value="">-- Selecione um Servidor --</option>
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.servidor?.nome} {p.servidor?.operadorRaioX ? '☢️' : ''} (Saldo: {p.saldoDias}d) {p.alertaPrazo ? '🚨 VENCENDO' : ''}
              </option>
            ))}
          </select>
          {errors.periodoId && <span className="text-red-500 text-sm mt-1">{errors.periodoId.message}</span>}
        </div>

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

        {/* Mensagem Informativa Dinâmica contextualizando a lei da Paraíba */}
        {ehOperadorRaioX && (
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 text-xs font-medium">
            ☢️ <strong>Atenção ao Art. 80:</strong> Este servidor opera com Raios X/Substâncias Radioativas. O período deve ser obrigatoriamente de <strong>20 dias</strong> consecutivos.
          </div>
        )}

        {/* ---> NOVO: Alerta Vermelho de Vencimento (Art. 79) <--- */}
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


        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition shadow-md flex items-center justify-center gap-2"
        >
          <Send size={18} />
          Enviar Solicitação
        </button>
      </form>
    </div>
  );
}