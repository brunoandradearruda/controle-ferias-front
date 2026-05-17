import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Users, Clock, CheckCircle2 } from 'lucide-react';

export function DashboardCards() {
  const [stats, setStats] = useState({ servidores: 0, pendentes: 0, aprovadas: 0 });

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Dispara duas requisições ao mesmo tempo para pegar os servidores e os pedidos
        const [periodosRes, solicitacoesRes] = await Promise.all([
          api.get('/periodos'),
          api.get('/solicitacoes')
        ]);

        const totalServidores = periodosRes.data.length;
        const solicitacoes = solicitacoesRes.data;

        // O JavaScript filtra e conta os status pra gente
        const pendentes = solicitacoes.filter((s: any) => s.status === 'PENDENTE_CHEFIA').length;
        const aprovadas = solicitacoes.filter((s: any) => s.status === 'APROVADA').length;

        setStats({
          servidores: totalServidores,
          pendentes: pendentes,
          aprovadas: aprovadas
        });
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard", error);
      }
    };

    carregarDados();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      
      {/* Card 1: Total de Servidores */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 transition hover:shadow-md">
        <div className="bg-blue-100 p-4 rounded-full text-blue-600">
          <Users size={28} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Períodos Ativos</p>
          <h3 className="text-3xl font-bold text-gray-800">{stats.servidores}</h3>
        </div>
      </div>

      {/* Card 2: Aguardando Chefia */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 transition hover:shadow-md">
        <div className="bg-amber-100 p-4 rounded-full text-amber-600">
          <Clock size={28} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Aguardando Chefia</p>
          <h3 className="text-3xl font-bold text-gray-800">{stats.pendentes}</h3>
        </div>
      </div>

      {/* Card 3: Férias Aprovadas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 transition hover:shadow-md">
        <div className="bg-green-100 p-4 rounded-full text-green-600">
          <CheckCircle2 size={28} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Férias Aprovadas</p>
          <h3 className="text-3xl font-bold text-gray-800">{stats.aprovadas}</h3>
        </div>
      </div>

    </div>
  );
}