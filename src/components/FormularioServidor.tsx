import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form'; 
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { UserPlus, Save, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

// =====================================================================
// MÁSCARA NATIVA DE MATRÍCULA (Padrão Governo PB: XXX.XXX-X)
// =====================================================================
export const mascaraMatricula = (valor: string) => {
  if (!valor) return '';
  
  // Remove tudo que não for número e limita a 7 caracteres
  let v = valor.replace(/\D/g, '').substring(0, 7);
  
  // Aplica a formatação dinamicamente enquanto o usuário digita
  v = v.replace(/(\d{3})(\d)/, '$1.$2');        // Coloca o ponto: 184.351
  v = v.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2-$3'); // Coloca o traço: 184.351-6
  
  return v;
};

// =====================================================================
// SCHEMA INTELIGENTE (Agora exigindo a matrícula completa)
// =====================================================================
const servidorSchema = z.object({
  matricula: z.string()
    .min(9, "A matrícula deve estar completa (Ex: 184.351-6)") // 9 caracteres contando pontos e traço
    .regex(/^\d{3}\.\d{3}-\d$/, "Formato inválido. Use o padrão 000.000-0"),
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
  // Adicionamos o setError aqui para podermos pintar o campo de vermelho em caso de falha
  const { register, handleSubmit, formState: { errors }, reset, setError } = useForm<ServidorData>({
    resolver: zodResolver(servidorSchema),
  });

  const salvarServidor: SubmitHandler<ServidorData> = async (data) => {
    const toastId = toast.loading("Salvando cadastro do servidor...");

    try {
      const dadosParaEnvio = { ...data, ativo: true }; 
      
      await api.post('/servidores', dadosParaEnvio);
      
      toast.success('Servidor cadastrado com sucesso!', { id: toastId });
      reset();
    } catch (error: any) {
      // 1. Extrai a mensagem exata que enviamos do Spring Boot
      const mensagemErro = error.response?.data?.message || 'Erro inesperado ao conectar com o servidor.';
      
      // 2. Exibe o balão vermelho com o texto completo
      toast.error(mensagemErro, { id: toastId, duration: 5000 });
      
      // 3. Se o erro for sobre a matrícula, pinta o input de matrícula de vermelho automaticamente
      if (mensagemErro.toLowerCase().includes('matrícula')) {
        setError('matricula', { 
          type: 'manual', 
          message: 'Esta matrícula já pertence a outro servidor.' 
        });
      }
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
      
      {/* CABEÇALHO COM O AZUL OFICIAL DA PARAÍBA */}
      <div className="bg-[#005aa9] px-8 py-6 text-white transition-colors duration-500">
        <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
          <UserPlus className="text-blue-100" size={24} />
          Cadastrar Novo Servidor
        </h2>
        <p className="text-blue-100/90 text-sm mt-1.5 font-medium">
          Insira as informações funcionais para integrar o servidor ao sistema de férias.
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-10 p-8 md:p-10">
        
        {/* ================= COLUNA ESQUERDA (FORMULÁRIO) ================= */}
        <form onSubmit={handleSubmit(salvarServidor)} className="flex-1 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome Completo</label>
              <input 
                type="text" 
                placeholder="Ex: BRUNO ANDRADE DE ARRUDA"
                {...register('nome')}
                className={`w-full border rounded-lg py-2.5 px-3 focus:ring-4 outline-none transition-all duration-200 uppercase text-slate-800 font-medium text-sm ${errors.nome ? 'border-red-400 focus:ring-red-400/20 bg-red-50' : 'border-slate-300 focus:ring-[#005aa9]/20 focus:border-[#005aa9] bg-slate-50 hover:bg-white'}`}
              />
              {errors.nome && <span className="text-red-500 text-xs font-bold mt-1.5 block">{errors.nome.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Matrícula</label>
              <input 
                type="text" 
                placeholder="Ex: 184.351-6"
                {...register('matricula', {
                  onChange: (e) => {
                    e.target.value = mascaraMatricula(e.target.value);
                  }
                })}
                className={`w-full border rounded-lg py-2.5 px-3 focus:ring-4 outline-none transition-all duration-200 text-slate-800 font-medium text-sm ${errors.matricula ? 'border-red-400 focus:ring-red-400/20 bg-red-50' : 'border-slate-300 focus:ring-[#005aa9]/20 focus:border-[#005aa9] bg-slate-50 hover:bg-white'}`}
              />
              {errors.matricula && <span className="text-red-500 text-xs font-bold mt-1.5 block">{errors.matricula.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Data de Admissão (Posse)</label>
              <input 
                type="date" 
                {...register('dataAdmissao')}
                className={`w-full border rounded-lg py-2.5 px-3 focus:ring-4 outline-none transition-all duration-200 text-slate-800 font-medium text-sm ${errors.dataAdmissao ? 'border-red-400 focus:ring-red-400/20 bg-red-50' : 'border-slate-300 focus:ring-[#005aa9]/20 focus:border-[#005aa9] bg-slate-50 hover:bg-white'}`}
              />
              {errors.dataAdmissao && <span className="text-red-500 text-xs font-bold mt-1.5 block">{errors.dataAdmissao.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Cargo / Função</label>
              <input 
                type="text" 
                placeholder="EX: ASSESSOR DE GABINETE"
                {...register('cargo')}
                className={`w-full border rounded-lg py-2.5 px-3 focus:ring-4 outline-none transition-all duration-200 uppercase text-slate-800 font-medium text-sm ${errors.cargo ? 'border-red-400 focus:ring-red-400/20 bg-red-50' : 'border-slate-300 focus:ring-[#005aa9]/20 focus:border-[#005aa9] bg-slate-50 hover:bg-white'}`}
              />
              {errors.cargo && <span className="text-red-500 text-xs font-bold mt-1.5 block">{errors.cargo.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Setor / Lotação</label>
              <select 
                {...register('lotacao')}
                className={`w-full border rounded-lg py-2.5 px-3 focus:ring-4 outline-none transition-all duration-200 cursor-pointer text-slate-800 font-medium text-sm ${errors.lotacao ? 'border-red-400 focus:ring-red-400/20 bg-red-50' : 'border-slate-300 focus:ring-[#005aa9]/20 focus:border-[#005aa9] bg-slate-50 hover:bg-white'}`}
              >
                <option value="">-- Selecione o setor --</option>
                {SETORES_SEPLAG.map((nomeDoSetor) => (
                  <option key={nomeDoSetor} value={nomeDoSetor}>
                    {nomeDoSetor}
                  </option>
                ))}
              </select>
              {errors.lotacao && <span className="text-red-500 text-xs font-bold mt-1.5 block">{errors.lotacao.message}</span>}
            </div>
          </div>

          {/* BOTÃO ALINHADO À DIREITA */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 flex justify-end">
            <button 
              type="submit" 
              className="w-full md:w-auto text-white font-black py-3.5 px-8 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 outline-none focus:ring-4 text-sm bg-[#005aa9] hover:bg-[#004785] focus:ring-[#005aa9]/30 transform hover:-translate-y-0.5"
            >
              <Save size={18} />
              Gravar Cadastro no Sistema
            </button>
          </div>
          
        </form>

        {/* ================= COLUNA DIREITA (DIRETRIZES DO RH) ================= */}
        <div className="w-full xl:w-[380px] shrink-0">
          <div className="sticky top-6 space-y-4">
            
            <div className="p-6 rounded-xl border bg-[#005aa9]/5 border-[#005aa9]/20 shadow-sm">
              <h3 className="text-sm font-black flex items-center gap-2 mb-6 text-slate-800 border-b border-slate-200/80 pb-3">
                <Info size={20} className="text-[#005aa9]" /> 
                Diretrizes de Cadastro
              </h3>
              
              <ul className="space-y-4 text-sm text-slate-600 font-medium">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#005aa9] mt-1.5 shrink-0"></div>
                  <p>O <strong>1º Período Aquisitivo</strong> é gerado automaticamente pelo motor de regras utilizando a data de posse (admissão) informada.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#005aa9] mt-1.5 shrink-0"></div>
                  <p>A <strong>matrícula</strong> exige formato rígido (Ex: 184.351-6) para garantir a integridade na integração com o RH do Estado.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#005aa9] mt-1.5 shrink-0"></div>
                  <p>Mudanças de <strong>lotação</strong> ou de secretaria deverão ser reajustadas posteriormente pelo módulo de transferências.</p>
                </li>
              </ul>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}