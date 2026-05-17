import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';

const servidorSchema = z.object({
  matricula: z.string().min(1, "A matrícula é obrigatória"),
  nome: z.string().min(3, "O nome deve ter no mínimo 3 letras"),
  cargo: z.string().min(1, "O cargo é obrigatório"),
  lotacao: z.string().min(1, "A lotação é obrigatória"),
});


const SETORES_SEPLAG = [
  "Comitê Gestor do Gasto Público",
  "Chefia de Gabinete",
  "Parceria Público Privada",
  "Recursos Humanos (RH)",
  "Tecnologia da Informação (TI)",
  "Gabinete do Secretário",
  "Assessoria Jurídica",
  "DIREGE"
];


type ServidorData = z.infer<typeof servidorSchema>;

export function FormularioServidor() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ServidorData>({
    resolver: zodResolver(servidorSchema),
  });

  const salvarServidor = async (data: ServidorData) => {
    try {
      await api.post('/servidores', data);
      alert('✅ Servidor cadastrado com sucesso! (Período aquisitivo de 30 dias gerado).');
      reset();
    } catch (error) {
      alert('❌ Erro ao cadastrar o servidor.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-8 border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Cadastrar Novo Servidor</h2>

      <form onSubmit={handleSubmit(salvarServidor)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Matrícula */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Matrícula</label>
          <input 
            type="text" 
            placeholder="Ex: 123456-7"
            {...register('matricula')}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.matricula && <span className="text-red-500 text-sm">{errors.matricula.message}</span>}
        </div>

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
          <input 
            type="text" 
            {...register('nome')}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.nome && <span className="text-red-500 text-sm">{errors.nome.message}</span>}
        </div>

        {/* Cargo */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Cargo</label>
          <input 
            type="text" 
            placeholder="Ex: Analista de Sistemas"
            {...register('cargo')}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.cargo && <span className="text-red-500 text-sm">{errors.cargo.message}</span>}
        </div>

        {/* Lotação */}
       {/* Lotação */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Setor/Lotação</label>
          <select 
            {...register('lotacao')}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">Selecione um setor da lista...</option>
            {SETORES_SEPLAG.map((nomeDoSetor) => (
              <option key={nomeDoSetor} value={nomeDoSetor}>
                {nomeDoSetor}
              </option>
            ))}
          </select>
          {errors.lotacao && <span className="text-red-500 text-sm">{errors.lotacao.message}</span>}
        </div>

        {/* Botão (Ocupa as duas colunas) */}
        <div className="md:col-span-2 mt-4">
          <button 
            type="submit" 
            className="w-full bg-blue-800 text-white font-bold py-3 px-4 rounded hover:bg-blue-900 transition"
          >
            Salvar Servidor
          </button>
        </div>
      </form>
    </div>
  );
}