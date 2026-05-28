import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form'; 
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { UserPlus, Save } from 'lucide-react';

const servidorSchema = z.object({
  matricula: z.string().min(1, "A matrícula é obrigatória"),
  nome: z.string().min(3, "O nome deve ter no mínimo 3 letras"),
  cargo: z.string().min(1, "O cargo é obrigatório"),
  lotacao: z.string().min(1, "A lotação é obrigatória"),
  dataAdmissao: z.string().min(1, "A data de admissão é obrigatória")
});

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

type ServidorData = z.infer<typeof servidorSchema>;

export function FormularioServidor() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ServidorData>({
    resolver: zodResolver(servidorSchema),
  });

  const salvarServidor: SubmitHandler<ServidorData> = async (data) => {
    try {
      const dadosParaEnvio = { ...data, ativo: true }; 
      
      await api.post('/servidores', dadosParaEnvio);
      
      alert('✅ Servidor cadastrado com sucesso! (Período aquisitivo gerado com base na admissão).');
      reset();
    } catch (error) {
      alert('❌ Erro ao cadastrar o servidor.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mt-6">
      
      {/* CABEÇALHO MODERNO */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-600 px-8 py-7 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="text-blue-100" size={28} />
          Cadastrar Novo Servidor
        </h2>
        <p className="text-blue-100/90 text-sm mt-2 font-medium">
          Insira as informações funcionais para integrar o servidor ao sistema de férias.
        </p>
      </div>

      <form onSubmit={handleSubmit(salvarServidor)} className="p-8">
        
        {/* GRID DE FORMULÁRIO INTELIGENTE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Nome (Ocupa as duas colunas por ser mais longo) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nome Completo</label>
            <input 
              type="text" 
              placeholder="Ex: Bruno Andrade de Arruda"
              {...register('nome')}
              className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 hover:bg-white outline-none transition-all duration-200 uppercase"
            />
            {errors.nome && <span className="text-red-500 text-xs font-medium mt-1.5 block">{errors.nome.message}</span>}
          </div>

          {/* Matrícula */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Matrícula</label>
            <input 
              type="text" 
              placeholder="Ex: 123456-7"
              {...register('matricula')}
              className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 hover:bg-white outline-none transition-all duration-200"
            />
            {errors.matricula && <span className="text-red-500 text-xs font-medium mt-1.5 block">{errors.matricula.message}</span>}
          </div>

          {/* Data de Admissão */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Data de Admissão (Posse)</label>
            <input 
              type="date" 
              {...register('dataAdmissao')}
              className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 hover:bg-white outline-none transition-all duration-200"
            />
            {errors.dataAdmissao && <span className="text-red-500 text-xs font-medium mt-1.5 block">{errors.dataAdmissao.message}</span>}
          </div>

          {/* Cargo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cargo / Função</label>
            <input 
              type="text" 
              placeholder="Ex: Assessor de Gabinete"
              {...register('cargo')}
              className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 hover:bg-white outline-none transition-all duration-200 uppercase"
            />
            {errors.cargo && <span className="text-red-500 text-xs font-medium mt-1.5 block">{errors.cargo.message}</span>}
          </div>

          {/* Lotação */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Setor / Lotação</label>
            <select 
              {...register('lotacao')}
              className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 hover:bg-white outline-none transition-all duration-200 cursor-pointer"
            >
              <option value="">-- Selecione o setor --</option>
              {SETORES_SEPLAG.map((nomeDoSetor) => (
                <option key={nomeDoSetor} value={nomeDoSetor}>
                  {nomeDoSetor}
                </option>
              ))}
            </select>
            {errors.lotacao && <span className="text-red-500 text-xs font-medium mt-1.5 block">{errors.lotacao.message}</span>}
          </div>

          {/* DIVISOR E BOTÃO DE SUBMIT (Ocupa as duas colunas) */}
          <div className="md:col-span-2 mt-6 pt-6 border-t border-gray-100">
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 outline-none focus:ring-4 focus:ring-blue-500/30"
            >
              <Save size={20} />
              Salvar Servidor
            </button>
          </div>
          
        </div>
      </form>
    </div>
  );
}