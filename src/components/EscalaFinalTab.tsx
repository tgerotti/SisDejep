import React, { useState } from 'react';
import { 
  Printer, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Shield, 
  Calendar as CalendarIcon, 
  Users, 
  Search, 
  Filter,
  CheckCircle2,
  Archive,
  Save,
  Clock,
  Trash2,
  ChevronRight,
  BookmarkCheck
} from 'lucide-react';
import { VagaChefia, Policial, TurnoConfig, ConfiguracaoDejep, DistribuicaoLog, ListaArmazenada } from '../types/dejep';
import { formatarDataBr, obterDiasDoMes } from '../utils/dejepEngine';
import { exportarEscalaOficialExcel } from '../utils/excelExport';
import { obterEstiloTurno } from '../utils/sampleData';

interface EscalaFinalTabProps {
  vagas: VagaChefia[];
  policiais: Policial[];
  turnos: TurnoConfig[];
  config: ConfiguracaoDejep;
  logs: DistribuicaoLog[];
  listasArmazenadas: ListaArmazenada[];
  onArmazenarEscala: () => void;
  onCarregarListaArmazenada: (id: string) => void;
  onExcluirListaArmazenada: (id: string) => void;
}

export const EscalaFinalTab: React.FC<EscalaFinalTabProps> = ({
  vagas,
  policiais,
  turnos,
  config,
  logs,
  listasArmazenadas,
  onArmazenarEscala,
  onCarregarListaArmazenada,
  onExcluirListaArmazenada
}) => {
  const [filtroTurno, setFiltroTurno] = useState<string>('todos');
  const [copiado, setCopiado] = useState<boolean>(false);
  const [modalHistorico, setModalHistorico] = useState<boolean>(false);

  const diasDoMes = obterDiasDoMes(config.mesAnoAtual);

  // Vagas que possuem policiais escalados
  const vagasAlocadas = vagas
    .filter(v => v.alocados.length > 0)
    .sort((a, b) => a.data.localeCompare(b.data));

  // Filtra por turno
  const vagasFiltradas = vagasAlocadas.filter(v => {
    if (filtroTurno !== 'todos' && v.turnoId !== filtroTurno) return false;
    return true;
  });

  const totalDejeps = vagasAlocadas.reduce((a, v) => a + v.alocados.length, 0);

  const obterNomeDiaSemana = (dataYmd: string) => {
    const dataObj = new Date(dataYmd + 'T00:00:00');
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return dias[dataObj.getDay()];
  };

  // Copiar para Boletim Interno
  const handleCopiarBoletim = () => {
    let texto = `*ESCALA OFICIAL DE DEJEP - ${config.mesAnoAtual}*\n`;
    texto += `${config.unidadePrisional}\n`;
    texto += `Distribuição homologada via Sistema DEJEP\n\n`;

    vagasAlocadas.forEach(v => {
      const turno = turnos.find(t => t.id === v.turnoId);
      const diaSemana = obterNomeDiaSemana(v.data);
      texto += `📅 *${formatarDataBr(v.data)} (${diaSemana})* - ${turno?.nome} [${v.horario}]\n`;
      texto += `   Posto: ${v.setor}\n`;
      v.alocados.forEach(a => {
        texto += `   👮 ${a.policialNome} (${a.policialRE})\n`;
      });
      texto += `\n`;
    });

    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ações e Armazenamento */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-emerald-500/30">
                Lista Oficial Homologada
              </span>
              <span className="text-slate-400 text-xs">Exibição Exclusiva em Calendário Mensal</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Mapa Calendário de Escala Oficial de DEJEP ({config.mesAnoAtual})
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Relação oficial de policiais penais escalados exibida diretamente no calendário mensal. Salve esta lista para armazenamento permanente e consulta histórica.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor Rápido de Consulta de Listas Armazenadas */}
            {listasArmazenadas.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
                <Archive className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] text-slate-400">Consultar:</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      onCarregarListaArmazenada(e.target.value);
                    }
                  }}
                  defaultValue=""
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-medium"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-400">
                    Histórico ({listasArmazenadas.length} salvas)
                  </option>
                  {listasArmazenadas.map(l => (
                    <option key={l.id} value={l.id} className="bg-slate-900 text-white">
                      {l.titulo} ({new Date(l.dataCriacao).toLocaleDateString('pt-BR')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botão de Armazenar a Lista Atual */}
            <button
              onClick={onArmazenarEscala}
              disabled={totalDejeps === 0}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              title="Armazena permanentemente a escala deste mês no banco de consultas históricas"
            >
              <Save className="w-4 h-4" />
              <span>Armazenar Lista</span>
            </button>

            {/* Botão de Histórico de Listas Armazenadas */}
            <button
              onClick={() => setModalHistorico(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Archive className="w-4 h-4 text-blue-400" />
              <span>Gerenciar Histórico ({listasArmazenadas.length})</span>
            </button>

            {/* Imprimir */}
            <button
              onClick={() => window.print()}
              disabled={totalDejeps === 0}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>

            {/* Exportar Excel */}
            <button
              onClick={() => exportarEscalaOficialExcel(vagas, policiais, turnos, logs, config)}
              disabled={totalDejeps === 0}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Exportar Excel</span>
            </button>

            {/* Copiar Boletim */}
            <button
              onClick={handleCopiarBoletim}
              disabled={totalDejeps === 0}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? 'Copiado!' : 'Copiar p/ Boletim'}</span>
            </button>
          </div>
        </div>

        {/* Legenda de Cores dos Turnos */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mr-1">
              Legenda de Turnos:
            </span>
            {turnos.map(turno => {
              const estilo = obterEstiloTurno(turno.id);
              const ativo = filtroTurno === 'todos' || filtroTurno === turno.id;
              return (
                <button
                  key={turno.id}
                  onClick={() => setFiltroTurno(prev => prev === turno.id ? 'todos' : turno.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    estilo.badge
                  } ${ativo ? 'opacity-100 ring-1 ring-white/20' : 'opacity-40'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${estilo.dot}`}></span>
                  <span>{turno.nome}</span>
                  <span className="text-[10px] opacity-75 font-mono">({turno.horarioPadrao})</span>
                </button>
              );
            })}

            {filtroTurno !== 'todos' && (
              <button
                onClick={() => setFiltroTurno('todos')}
                className="text-[11px] text-slate-400 hover:text-white underline ml-1 cursor-pointer"
              >
                Ver Todos
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400">
            Total de DEJEPs Escaladas: <strong className="text-emerald-400 font-bold">{totalDejeps}</strong>
          </div>
        </div>
      </div>

      {/* ÁREA DE IMPRESSÃO / FOLHA DA ESCALA (FORMATO EXCLUSIVO CALENDÁRIO) */}
      <div className="bg-slate-900 print:bg-white print:text-black border border-slate-800 print:border-none rounded-xl p-6 sm:p-8 shadow-md">
        {/* Cabeçalho Institucional Oficial */}
        <div className="border-b-2 border-slate-700 print:border-black pb-4 mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Shield className="w-8 h-8 text-blue-400 print:text-black" />
            <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white print:text-black">
              SECRETARIA DA ADMINISTRAÇÃO PENITENCIÁRIA
            </h1>
          </div>
          <h2 className="text-sm font-semibold text-slate-300 print:text-gray-800 uppercase tracking-wide">
            {config.unidadePrisional}
          </h2>
          <div className="text-xs font-bold text-blue-400 print:text-black mt-2 uppercase tracking-widest bg-slate-950/60 print:bg-gray-100 py-1 px-4 inline-block rounded border border-slate-800 print:border-gray-300">
            CALENDÁRIO OFICIAL DE ESCALA MENSAL DE DEJEP - {config.mesAnoAtual}
          </div>
        </div>

        {totalDejeps === 0 ? (
          <div className="p-16 text-center">
            <CalendarIcon className="w-14 h-14 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">Nenhuma escala gerada para este mês ainda</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              O sistema está em branco aguardando o upload das listas de vagas e policiais ou a execução da Regra 01 de Distribuição.
            </p>
          </div>
        ) : (
          /* Grade Oficial em Calendário */
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 print:text-black uppercase tracking-wider py-1">
              {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(d => (
                <div key={d} className="bg-slate-950/90 print:bg-gray-200 py-2 rounded-lg border border-slate-800/80 print:border-gray-400">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {diasDoMes.map(diaYmd => {
                const dataObj = new Date(diaYmd + 'T00:00:00');
                const diaNum = diaYmd.split('-')[2];
                const diaSemana = dataObj.getDay();
                const isFimDeSemana = diaSemana === 0 || diaSemana === 6;

                const vagasDoDia = vagasFiltradas.filter(v => v.data === diaYmd && v.alocados.length > 0);

                return (
                  <div
                    key={diaYmd}
                    className={`min-h-[145px] p-2 rounded-xl border flex flex-col justify-between ${
                      vagasDoDia.length > 0
                        ? 'bg-slate-950/90 print:bg-white border-slate-700 print:border-gray-400'
                        : 'bg-slate-900/40 print:bg-gray-50 border-slate-800/50 print:border-gray-300'
                    }`}
                  >
                    {/* Topo do Dia */}
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${isFimDeSemana ? 'text-amber-400 print:text-black font-extrabold' : 'text-slate-300 print:text-black'}`}>
                        {diaNum}
                      </span>
                      {vagasDoDia.length > 0 && (
                        <span className="text-[10px] bg-emerald-950 print:bg-gray-200 text-emerald-300 print:text-black px-1.5 py-0.2 rounded font-bold font-mono">
                          {vagasDoDia.reduce((a, v) => a + v.alocados.length, 0)} DEJEP(s)
                        </span>
                      )}
                    </div>

                    {/* Relação dos Policiais com a cor de seu turno */}
                    <div className="space-y-1.5 overflow-y-auto max-h-32 text-[10px]">
                      {vagasDoDia.map(vaga => {
                        const turno = turnos.find(t => t.id === vaga.turnoId);
                        const estilo = obterEstiloTurno(vaga.turnoId);

                        return vaga.alocados.map((aloc, idx) => (
                          <div
                            key={`${vaga.id}-${idx}`}
                            className={`p-1.5 rounded border leading-tight ${estilo.bg} ${estilo.border} print:bg-gray-100 print:border-gray-400`}
                          >
                            <div className="flex items-center justify-between font-bold mb-0.5">
                              <span className={`${estilo.text} print:text-black flex items-center gap-1`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${estilo.dot} print:bg-black`}></span>
                                {turno?.codigo || 'T'}
                              </span>
                              <span className="text-slate-400 print:text-gray-600 font-mono text-[9px]">{vaga.horario}</span>
                            </div>
                            <div className="font-bold text-white print:text-black truncate" title={aloc.policialNome}>
                              {aloc.policialNome}
                            </div>
                            <div className="text-[9px] text-slate-300 print:text-gray-700 flex items-center justify-between font-mono">
                              <span>{aloc.policialRE}</span>
                              <span className="text-[8px] opacity-75">R{aloc.rodada}</span>
                            </div>
                            <div className="text-[8px] text-slate-400 print:text-gray-500 truncate mt-0.5">
                              {vaga.setor}
                            </div>
                          </div>
                        ));
                      })}

                      {vagasDoDia.length === 0 && (
                        <div className="text-center text-slate-600 print:text-gray-400 text-[10px] italic py-3">
                          Sem escala
                        </div>
                      )}
                    </div>

                    {/* Rodapé do Dia */}
                    <div className="text-[9px] text-slate-500 print:text-gray-500 text-right mt-1">
                      {obterNomeDiaSemana(diaYmd)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rodapé Oficial para Assinaturas e Normas */}
        <div className="mt-12 pt-8 border-t-2 border-slate-700 print:border-black text-xs text-slate-400 print:text-black">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="border-t border-slate-600 print:border-black pt-2 mx-auto max-w-xs">
                <strong className="block text-white print:text-black">{config.diretorSeguranca}</strong>
                <span className="text-[11px] text-slate-400 print:text-gray-600">Diretor do Centro de Segurança e Disciplina</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <span className="text-[11px] font-mono text-slate-400 print:text-black uppercase">
                Homologada em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </span>
              <span className="text-[10px] text-slate-400 print:text-black mt-0.5">
                Autenticidade garantida via Sistema Informatizado DEJEP
              </span>
            </div>

            <div>
              <div className="border-t border-slate-600 print:border-black pt-2 mx-auto max-w-xs">
                <strong className="block text-white print:text-black">{config.diretorGeral}</strong>
                <span className="text-[11px] text-slate-400 print:text-gray-600">Diretor Geral da Unidade Prisional</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Listas Armazenadas para Consulta */}
      {modalHistorico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-xl shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Listas de DEJEP Armazenadas para Consulta</h3>
              </div>
              <button
                onClick={() => setModalHistorico(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                &times; Fechar
              </button>
            </div>

            {listasArmazenadas.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Archive className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p>Nenhuma lista armazenada no repositório ainda.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ao criar e homologar uma escala, clique em "Armazenar Lista para Consulta" para arquivá-la permanentemente.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {listasArmazenadas.map(lista => (
                  <div
                    key={lista.id}
                    className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-white">{lista.titulo}</strong>
                        <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded font-mono">
                          {lista.mesAno}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Salva em: {new Date(lista.dataCriacao).toLocaleString('pt-BR')} &bull; {lista.vagas.filter(v => v.alocados.length > 0).reduce((a, v) => a + v.alocados.length, 0)} vagas preenchidas
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onCarregarListaArmazenada(lista.id);
                          setModalHistorico(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer"
                        title="Carregar para consultar agora no calendário"
                      >
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>Consultar</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir o registro armazenado "${lista.titulo}"?`)) {
                            onExcluirListaArmazenada(lista.id);
                          }
                        }}
                        className="text-slate-500 hover:text-red-400 p-1.5"
                        title="Excluir do histórico"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
