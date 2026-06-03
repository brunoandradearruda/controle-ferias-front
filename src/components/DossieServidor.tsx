import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { History, CalendarDays, CheckCircle, FileText, Clock, AlertTriangle, X, Coins } from 'lucide-react';

interface DossieProps {
  servidorId: number;
  nomeServidor: string;
  matricula: string;
  onClose: () => void;
}

export function DossieServidor({ servidorId, nomeServidor, matricula, onClose }: DossieProps) {
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (servidorId) {
      setLoading(true);
      api.get('/periodos') 
        .then(response => {
          const periodosDoServidor = response.data.filter((p: any) => p.servidor?.id === servidorId);
          periodosDoServidor.sort((a: any, b: any) => b.anoReferencia - a.anoReferencia);
          setPeriodos(periodosDoServidor);
        })
        .catch(error => console.error("Erro ao carregar dossiê:", error))
        .finally(() => setLoading(false));
    }
  }, [servidorId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        
        {/* CABEÇALHO DO MODAL */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-700/50 rounded-xl text-slate-300">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Dossiê Cronológico de Férias
              </h2>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">
                Servidor: <span className="text-slate-200 font-bold">{nomeServidor}</span> (Mat: {matricula || '-'})
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-700/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50/50">
          
          {loading && (
            <div className="text-center py-20 text-slate-500 font-medium animate-pulse flex flex-col items-center gap-2">
              <Clock className="animate-spin text-slate-400" size={32} />
              <span>Resgatando histórico do arquivo funcional...</span>
            </div>
          )}

          {/* LINHA DO TEMPO VERTICAL */}
          {!loading && periodos.length > 0 && (
            <div className="relative border-l-2 border-slate-200 ml-4 pb-4">
              
              {periodos.map((periodo) => {
                const anoInicio = new Date(periodo.dataInicio).getFullYear();
                const anoFim = new Date(periodo.dataFim).getFullYear();
                const tituloRef = anoInicio === anoFim ? anoFim : `${anoInicio}/${anoFim}`;
                const isConcluido = periodo.saldoDias === 0;

                return (
                  <div key={periodo.id} className="mb-10 ml-8 relative">
                    
                    {/* INDICADOR DA TIMELINE */}
                    <span className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-[49px] ring-4 ring-white shadow-sm ${isConcluido ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                      {isConcluido ? <CheckCircle size={16} /> : <Clock size={16} />}
                    </span>

                    {/* CARD DO PERÍODO */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-slate-100 pb-4 gap-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <CalendarDays className="text-slate-400" size={18} />
                            Exercício de Referência: {tituloRef}
                          </h3>
                          <p className="text-xs font-semibold text-slate-400 mt-0.5">
                            Período Laboral: {new Date(periodo.dataInicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} até {new Date(periodo.dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </p>
                        </div>
                        
                        <div>
                          <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold border ${isConcluido ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            Saldo Atual: {periodo.saldoDias} dias
                          </span>
                        </div>
                      </div>

                      {/* HISTÓRICO DE GOZOS E INDENIZAÇÕES */}
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                          <FileText size={12} /> Assentamentos e Concessões Registadas
                        </h4>
                        
                        {periodo.solicitacoes && periodo.solicitacoes.length > 0 ? (
                          <div className="space-y-2.5">
                            {periodo.solicitacoes.map((sol: any, idx: number) => {
                              // ---> REGRA VISUAL: VERIFICA SE FOI INDENIZADO <---
                              const isIndenizacao = sol.modalidade === 'INDENIZACAO';

                              return (
                                <div key={idx} className={`flex items-center justify-between border rounded-xl p-3 transition-colors ${isIndenizacao ? 'bg-amber-50/40 border-amber-200/70 hover:bg-amber-50/80' : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100/50'}`}>
                                  <div className="flex items-center gap-3">
                                    {/* Ícone Dinâmico */}
                                    <div className={`p-2 rounded-lg border ${isIndenizacao ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                      {isIndenizacao ? <Coins size={16} /> : <CheckCircle size={16} />}
                                    </div>
                                    
                                    {/* Texto Dinâmico */}
                                    <div>
                                      <p className="text-xs font-bold text-slate-700">
                                        {sol.diasSolicitados} dias {isIndenizacao ? 'convertidos em pecúnia' : 'de férias usufruídas'}
                                      </p>
                                      <p className="text-[11px] font-medium text-slate-400">
                                        {isIndenizacao 
                                          ? 'Afastamento: Não se aplica' 
                                          : `Início do Afastamento: ${new Date(sol.dataInicioGozo).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    <span className="inline-block px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-black text-slate-500 shadow-sm uppercase">
                                      {sol.status}
                                    </span>
                                    {sol.numeroPbdoc && <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-tight">Processo: {sol.numeroPbdoc}</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-50 p-3.5 rounded-xl border border-dashed border-slate-200">
                            <AlertTriangle size={14} className="text-slate-400 shrink-0" /> Não constam concessões efetivadas para este ciclo.
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && periodos.length === 0 && (
            <div className="text-center py-16 text-slate-400 font-medium text-sm flex flex-col items-center gap-1">
              <AlertTriangle size={24} className="text-slate-300" />
              Nenhum histórico ou registro de períodos encontrado no prontuário deste servidor.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}