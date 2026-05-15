import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';

const formSchema = z.object({
  dataInicioGozo: z.string().min(1, "A data de início é obrigatória"),
  // Alteração aqui: usando apenas 'message'
  diasSolicitados: z.number({ message: "Informe um número válido" })
    .min(1, "Mínimo de 1 dia")
    .max(30, "Máximo de 30 dias"),
  abonoPecuniario: z.boolean(),
});

type FormularioData = z.infer<typeof formSchema>;

export function FormularioFerias() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormularioData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      abonoPecuniario: false,
    }
  });

  const salvarSolicitacao = async (data: FormularioData) => {
    try {
      await api.post('/periodos/1/solicitacoes', data);
      alert('✅ Solicitação de férias enviada com sucesso!');
      reset();
    } catch (error: any) {
      const mensagemErro = error.response?.data || 'Erro inesperado ao conectar com o servidor.';
      alert('❌ Erro: ' + mensagemErro);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Solicitar Férias</h2>

      <form onSubmit={handleSubmit(salvarSolicitacao)} className="space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Data de Início do Gozo</label>
          <input 
            type="date" 
            {...register('dataInicioGozo')}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.dataInicioGozo && <span className="text-red-500 text-sm">{errors.dataInicioGozo.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Dias Solicitados</label>
          <input 
            type="number" 
            {...register('diasSolicitados', { valueAsNumber: true })}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.diasSolicitados && <span className="text-red-500 text-sm">{errors.diasSolicitados.message}</span>}
        </div>

        <div className="flex items-center">
          <input 
            type="checkbox" 
            {...register('abonoPecuniario')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Solicitar Abono Pecuniário (Vender 1/3)
          </label>
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Enviar Solicitação
        </button>
      </form>
    </div>
  );
}