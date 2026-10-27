import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Users, 
  Calendar, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  ShieldCheck, 
  Sparkles,
  ChevronDown,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VagaChefia, Policial, DistribuicaoLog, EstatisticasDistribuicao, TurnoConfig, ConfiguracaoDejep } from '../types/dejep';
import { executarDistribuicaoRegra01, formatarDataBr } from '../utils/dejepEngine';
import { exportarEscalaOficialExcel } from '../utils/excelExport';

interface DistribuicaoTabProps {
  vagas: VagaChefia[];
  setVagas: React.Dispatch<React.SetStateAction<VagaChefia[]>>;
  policiais: Policial[];
  turnos: TurnoConfig[];
  config: ConfiguracaoDejep;
  logs: DistribuicaoLog[];
  setLogs: React.Dispatch<React.SetStateAction<DistribuicaoLog[]>>;
  estatisticas: EstatisticasDistribuicao | null;
  setEstatisticas: React.Dispatch<React.SetStateAction<EstatisticasDistribuicao | null>>;
  onIrParaEscala: () => void;
}

export const DistribuicaoTab: React.FC<DistribuicaoTabProps> = ({
  vagas,
  setVagas,
  policiais,
  turnos,
  config,
  logs,
  setLogs,
  estatisticas,
  setEstatisticas,
  onIrParaEscala
}) => {
  const [executando, setExecutando] = useState<boolean>(false);
  const [filtroRodada, setFiltroRodada] = useState<string>('todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [termoBuscaLog, setTermoBuscaLog] = useState<string>('');

  // Executa a Distribuição
  const handleExecutarDistribuicao = () => {
    setExecutando(true);

    setTimeout(() => {
      const resultado = executarDistribuicaoRegra01(
        vagas,
        policiais,
        turnos,
        config.limitePadraoDejep
      );

      setVagas(resultado.vagasAtualizadas);
      setLogs(resultado.logs);
      setEstatisticas(resultado.estatisticas);
      setExecutando(false);

      // Efeito de confete ao concluir com sucesso
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // ignore
      }
    }, 400);
  };

  // Limpa alocações
  const handleLimparDistribuicao = () => {
    if (window.confirm('Deseja limpar todas as alocações da escala e reiniciar os registros de auditoria?')) {
      setVagas(prev => prev.map(v => ({ ...v, alocados: [] })));
      setLogs([]);
      setEstatisticas(null);
    }
  };

  // Filtra logs
  const logsFiltrados = logs.filter(l => {
    if (filtroRodada !== 'todas' && l.rodada !== parseInt(filtroRodada, 10)) {
      return false;
    }
    if (filtroStatus === 'sucesso' && !l.sucesso) return false;
    if (filtroStatus === 'falha' && l.sucesso) return false;

    if (termoBuscaLog) {
      const b = termoBuscaLog.toLowerCase();
      return (
        l.policialNome.toLowerCase().includes(b) ||
        l.policialRE.toLowerCase().includes(b) ||
        (l.turnoNome && l.turnoNome.toLowerCase().includes(b)) ||
        (l.data && l.data.includes(b)) ||
        l.motivo.toLowerCase().includes(b)
      );
    }
    return true;
  });

  // Cálculo de total de diárias por policial
  const resumoPorPolicial = policiais.map(p => {
    let total = 0;
    const datas: string[] = [];
    vagas.forEach(v => {
      v.alocados.forEach(a => {
        if (a.policialId === p.id) {
          total++;
          datas.push(v.data);
        }
      });
    });
    return {
      policial: p,
      totalDejeps: total,
      datas: datas.sort()
    };
  }).sort((a, b) => a.policial.ordemEscolha - b.policial.ordemEscolha);

  // Rodadas únicas presentes nos logs
  const rodadasDisponiveis = Array.from(new Set(logs.map(l => l.rodada))).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Banner Principal com Regra 01 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider border border-indigo-500/30">
                [[Regras]] &rsaquo; [[Regra 01 - Distribuição]]
              </span>
              <span className="text-slate-400 text-xs">Motor Automatizado e Auditável de Alocação</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Distribuição Oficial de DEJEP por Rodadas e Ordem de Escolha
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              O algoritmo processa rodadas sucessivas (Rodada 1, 2, 3...) respeitando a <strong>Ordem de Escolha</strong> de cada servidor. Em cada rodada, o policial é alocado apenas em uma das suas datas pré-disponibilizadas (respeitando limite de 1 por dia e teto mensal).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExecutarDistribuicao}
              disabled={executando || vagas.length === 0 || policiais.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-md shadow-indigo-950 transition-all"
            >
              <Play className={`w-4 h-4 fill-white ${executando ? 'animate-spin' : ''}`} />
              <span>{executando ? 'Distribuindo...' : 'Executar Distribuição (Regra 01)'}</span>
            </button>

            {logs.length > 0 && (
              <>
                <button
                  onClick={onIrParaEscala}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-3.5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ver Escala Final</span>
                </button>

                <button
                  onClick={handleLimparDistribuicao}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium px-3 py-2.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                  title="Limpar alocações para testar nova rodada"
                >
                  <RotateCcw className="w-4 h-4 text-slate-400" />
                  <span>Limpar</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Card Informativo dos Critérios da Regra 01 */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
            <strong className="text-white block mb-1">1. Ordem de Escolha Estrita</strong>
            Cada rodada inicia pelo 1º colocado até o último. O 1º colocado tem prioridade máxima na escolha de cada rodada.
          </div>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
            <strong className="text-white block mb-1">2. Fidelidade às Datas Ofertadas</strong>
            O servidor só pode ser escalado em data que ele próprio indicou (entre suas 5 a 10 datas), sem dupla diária no mesmo dia.
          </div>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
            <strong className="text-white block mb-1">3. Rodadas Sucessivas e Equitativas</strong>
            Distribuem-se 1 vaga por policial por rodada até esgotamento das vagas da chefia ou alcance do limite mensal por servidor.
          </div>
        </div>
      </div>

      {/* Estatísticas da Distribuição */}
      {estatisticas && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block">Vagas Solicitadas</span>
            <div className="text-2xl font-bold text-white mt-1">{estatisticas.totalVagasSolicitadas}</div>
            <span className="text-[11px] text-slate-500">pela chefia</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block">Vagas Preenchidas</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{estatisticas.totalVagasPreenchidas}</div>
            <span className="text-[11px] text-emerald-500/80">{estatisticas.taxaAtendimento}% de cobertura</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block">Vagas Não Atendidas</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{estatisticas.totalVagasNaoPreenchidas}</div>
            <span className="text-[11px] text-amber-500/80">sem policiais disponíveis</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block">Policiais Aptos</span>
            <div className="text-2xl font-bold text-blue-400 mt-1">{estatisticas.totalPoliciaisAptos}</div>
            <span className="text-[11px] text-blue-500/80">participando da fila</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block">Policiais Contemplados</span>
            <div className="text-2xl font-bold text-indigo-400 mt-1">{estatisticas.totalPoliciaisAtendidos}</div>
            <span className="text-[11px] text-indigo-500/80">com ao menos 1 DEJEP</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block">Rodadas Executadas</span>
            <div className="text-2xl font-bold text-purple-400 mt-1">{estatisticas.rodadasExecutadas}</div>
            <span className="text-[11px] text-purple-500/80">ciclos completos</span>
          </div>
        </div>
      )}

      {/* Grade de Alocação por Servidor (Equidade e Transparência) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Equidade na Distribuição - Diárias Atribuídas por Policial
            </h3>
            <p className="text-xs text-slate-400">
              Verifique a quantidade de DEJEPs que cada policial recebeu conforme sua ordem de escolha.
            </p>
          </div>

          <button
            onClick={() => exportarEscalaOficialExcel(vagas, policiais, turnos, logs, config)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar Relatório Completo (Excel)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {resumoPorPolicial.map(({ policial, totalDejeps, datas }) => (
            <div 
              key={policial.id}
              className={`p-3 rounded-lg border transition-all ${
                totalDejeps > 0
                  ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-900/40 border-slate-800/40 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  policial.ordemEscolha === 1
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {policial.ordemEscolha}º Lugar
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  totalDejeps > 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                }`}>
                  {totalDejeps} / {policial.maxDejepMes} DEJEPs
                </span>
              </div>

              <div className="font-semibold text-sm text-white truncate" title={policial.nome}>
                {policial.nome}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {policial.re} &bull; {policial.turnoOrigem}
              </div>

              {/* Datas Alocadas */}
              <div className="mt-2 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">
                  Dias Alocados ({datas.length}):
                </span>
                {datas.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {datas.map(d => (
                      <span key={d} className="text-[10px] bg-blue-950 text-blue-300 border border-blue-900/60 px-1.5 py-0.2 rounded font-mono">
                        {d.split('-')[2]}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 italic">Nenhuma vaga atribuída</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log de Execução e Auditoria Passo a Passo da Regra 01 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Auditoria de Execução Passo a Passo (Regra 01)
            </h3>
            <p className="text-xs text-slate-400">
              Histórico detalhado de cada escolha realizada por rodada, garantindo total transparência e conformidade com as regras.
            </p>
          </div>

          {/* Filtros do Log */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro Rodada */}
            <select
              value={filtroRodada}
              onChange={e => setFiltroRodada(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 px-2.5 py-1.5 rounded-lg focus:outline-none"
            >
              <option value="todas">Todas as Rodadas</option>
              {rodadasDisponiveis.map(r => (
                <option key={r} value={r}>Rodada {r}</option>
              ))}
            </select>

            {/* Filtro Status */}
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 px-2.5 py-1.5 rounded-lg focus:outline-none"
            >
              <option value="todos">Todos os Status</option>
              <option value="sucesso">Apenas Sucessos</option>
              <option value="falha">Apenas Sem Vagas</option>
            </select>

            {/* Busca rápida */}
            <input
              type="text"
              value={termoBuscaLog}
              onChange={e => setTermoBuscaLog(e.target.value)}
              placeholder="Filtrar log..."
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 px-2.5 py-1.5 rounded-lg w-36 focus:outline-none"
            />
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <Play className="w-12 h-12 text-indigo-400 mx-auto mb-3 opacity-60" />
            <h4 className="text-base font-semibold text-slate-300">A distribuição ainda não foi executada</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Clique no botão "Executar Distribuição (Regra 01)" no topo da página para iniciar a alocação de vagas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-center w-16">Passo</th>
                  <th className="py-2.5 px-3 font-semibold text-center w-20">Rodada</th>
                  <th className="py-2.5 px-3 font-semibold text-center w-20">Ordem</th>
                  <th className="py-2.5 px-3 font-semibold">Policial</th>
                  <th className="py-2.5 px-3 font-semibold">Vaga Atribuída</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Justificativa / Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logsFiltrados.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-bold">
                      #{log.passo}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-300">
                        R{log.rodada}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-blue-400">
                        {log.ordemPolicial}º
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-semibold text-white">{log.policialNome}</div>
                      <div className="text-[11px] text-slate-500">{log.policialRE}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      {log.data ? (
                        <div>
                          <span className="font-bold text-emerald-400">{formatarDataBr(log.data)}</span>
                          <span className="text-slate-400 ml-1.5 font-sans">
                            &bull; {log.turnoNome} ({log.setor})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic font-sans">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      {log.sucesso ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Alocado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Sem Vaga
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans max-w-md">
                      {log.motivo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
