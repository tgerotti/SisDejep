import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Upload, 
  Download, 
  Calendar as CalendarIcon, 
  Clock, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Search, 
  Printer, 
  Layers, 
  Shield, 
  Info,
  CalendarDays,
  FileCheck,
  Sparkles,
  Users,
  Archive
} from 'lucide-react';
import { VagaChefia, TurnoConfig, ConfiguracaoDejep, Policial, ListaArmazenada } from '../types/dejep';
import { formatarDataBr, obterDiasDoMes } from '../utils/dejepEngine';
import { baixarArquivoModelo, importarChefiaExcel } from '../utils/excelExport';
import { obterEstiloTurno } from '../utils/sampleData';

interface ChefiaPortalViewProps {
  vagas: VagaChefia[];
  setVagas: React.Dispatch<React.SetStateAction<VagaChefia[]>>;
  turnos: TurnoConfig[];
  config: ConfiguracaoDejep;
  policiais: Policial[];
  listasArmazenadas?: ListaArmazenada[];
  onCarregarListaArmazenada?: (id: string) => void;
}

export const ChefiaPortalView: React.FC<ChefiaPortalViewProps> = ({
  vagas,
  setVagas,
  turnos,
  config,
  policiais,
  listasArmazenadas = [],
  onCarregarListaArmazenada
}) => {
  const [abaChefia, setAbaChefia] = useState<'solicitacoes' | 'escala_final'>('solicitacoes');
  const [filtroTurno, setFiltroTurno] = useState<string>('todos');
  const [modalNovaVaga, setModalNovaVaga] = useState<boolean>(false);
  const [vagaEmEdicao, setVagaEmEdicao] = useState<VagaChefia | null>(null);
  const [diaSelecionadoModal, setDiaSelecionadoModal] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State para Nova Vaga
  const [formData, setFormData] = useState({
    turnoId: turnos[0]?.id || 't1',
    data: `${config.mesAnoAtual}-01`,
    horario: turnos[0]?.horarioPadrao || '07:00 - 19:00',
    setor: 'Portaria Principal e Muralha',
    vagasSolicitadas: 1,
    observacoes: '',
    prioridade: 'normal' as 'normal' | 'alta' | 'urgente'
  });

  // Dias do mês atual
  const diasDoMes = obterDiasDoMes(config.mesAnoAtual);

  // Filtragem por turno
  const vagasFiltradas = vagas.filter(v => {
    if (filtroTurno === 'todos') return true;
    return v.turnoId === filtroTurno;
  });

  const vagasAlocadasTotal = vagas.filter(v => v.alocados.length > 0);

  // Helper para dia da semana
  const obterNomeDiaSemana = (dataYmd: string) => {
    const dataObj = new Date(dataYmd + 'T00:00:00');
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return dias[dataObj.getDay()];
  };

  // Abrir Modal de Nova Vaga
  const handleAbrirNovaVaga = (dataPreDefinida?: string) => {
    const turnoAlvo = turnos.find(t => t.id === (filtroTurno === 'todos' ? turnos[0]?.id : filtroTurno)) || turnos[0];
    setFormData({
      turnoId: turnoAlvo ? turnoAlvo.id : 't1',
      data: dataPreDefinida || `${config.mesAnoAtual}-01`,
      horario: turnoAlvo ? turnoAlvo.horarioPadrao : '07:00 - 19:00',
      setor: 'Portaria Principal e Muralha',
      vagasSolicitadas: 1,
      observacoes: '',
      prioridade: 'normal'
    });
    setVagaEmEdicao(null);
    setModalNovaVaga(true);
  };

  // Abrir Edição
  const handleEditarVaga = (vaga: VagaChefia, e: React.MouseEvent) => {
    e.stopPropagation();
    setVagaEmEdicao(vaga);
    setFormData({
      turnoId: vaga.turnoId,
      data: vaga.data,
      horario: vaga.horario,
      setor: vaga.setor,
      vagasSolicitadas: vaga.vagasSolicitadas,
      observacoes: vaga.observacoes || '',
      prioridade: vaga.prioridade || 'normal'
    });
    setModalNovaVaga(true);
  };

  // Excluir Vaga
  const handleExcluirVaga = (vagaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Excluir esta vaga solicitada?')) {
      setVagas(prev => prev.filter(v => v.id !== vagaId));
    }
  };

  // Salvar Vaga
  const handleSalvarVaga = (e: React.FormEvent) => {
    e.preventDefault();
    if (vagaEmEdicao) {
      setVagas(prev => prev.map(v => {
        if (v.id === vagaEmEdicao.id) {
          return {
            ...v,
            ...formData,
            vagasSolicitadas: Number(formData.vagasSolicitadas)
          };
        }
        return v;
      }));
    } else {
      const nova: VagaChefia = {
        id: `vaga-chefia-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        turnoId: formData.turnoId,
        data: formData.data,
        horario: formData.horario,
        setor: formData.setor,
        vagasSolicitadas: Number(formData.vagasSolicitadas),
        alocados: [],
        observacoes: formData.observacoes,
        prioridade: formData.prioridade
      };
      setVagas(prev => [...prev, nova]);
    }
    setModalNovaVaga(false);
    setVagaEmEdicao(null);
  };

  // Importar Planilha de Datas da Chefia
  const handleImportarPlanilha = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const vagasImportadas = await importarChefiaExcel(file, turnos, config.mesAnoAtual);
      if (vagasImportadas.length === 0) {
        alert('Nenhuma solicitação de vaga válida encontrada. Verifique se utilizou o modelo oficial.');
        return;
      }
      setVagas(prev => [...prev, ...vagasImportadas]);
      alert(`${vagasImportadas.length} vagas carregadas e exibidas no calendário com sucesso!`);
    } catch (err: any) {
      alert(`Erro ao processar planilha: ${err?.message || err}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const totalSolicitadas = vagasFiltradas.reduce((a, v) => a + v.vagasSolicitadas, 0);
  const totalAtendidas = vagasFiltradas.reduce((a, v) => a + v.alocados.length, 0);

  return (
    <div className="space-y-6">
      {/* Banner Principal do Portal da Chefia */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider border border-blue-500/30">
                Portal do Chefe de Turno
              </span>
              <span className="text-slate-400 text-xs">{config.unidadePrisional}</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Visualização Exclusiva em Calendário Mensal
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Área restrita da Chefia. Envie a planilha de datas ou cadastre novas vagas clicando nos dias do calendário. Cada turno possui sua cor de identificação operacional.
            </p>
          </div>

          {/* Abas Internas da Chefia: Solicitações vs Escala Final */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800 self-start lg:self-auto">
            <button
              onClick={() => setAbaChefia('solicitacoes')}
              className={`px-3.5 py-2 text-xs font-bold rounded-md flex items-center gap-2 transition-all cursor-pointer ${
                abaChefia === 'solicitacoes'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Calendário de Demandas (Vagas)</span>
              <span className="bg-slate-800 px-1.5 py-0.2 rounded-full text-[10px] text-white">
                {vagas.length}
              </span>
            </button>

            <button
              onClick={() => setAbaChefia('escala_final')}
              className={`px-3.5 py-2 text-xs font-bold rounded-md flex items-center gap-2 transition-all cursor-pointer ${
                abaChefia === 'escala_final'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Calendário da Escala Final</span>
              <span className="bg-slate-800 px-1.5 py-0.2 rounded-full text-[10px] text-emerald-400">
                {vagasAlocadasTotal.reduce((a, v) => a + v.alocados.length, 0)}
              </span>
            </button>
          </div>
        </div>

        {/* Legenda de Cores dos Turnos (Requisito Explícito) */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mr-1">
              Cores dos Turnos:
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
                  title={`Filtrar vagas do ${turno.nome}`}
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
                Limpar Filtro
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">
              Vagas no Mês: <strong className="text-white">{totalSolicitadas}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              Escaladas: <strong className="text-emerald-400">{totalAtendidas}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Ações Rápidas da Chefia */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão 1: Criar Nova Vaga */}
          <button
            onClick={() => handleAbrirNovaVaga()}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Vaga de DEJEP</span>
          </button>

          {/* Botão 2: Enviar / Importar Planilha */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            title="Importar lista com as datas solicitadas pela Chefia"
          >
            <Upload className="w-4 h-4" />
            <span>Enviar Lista com as Datas (.xlsx)</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportarPlanilha}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {/* Botão 3: Baixar Modelo em Branco */}
          <button
            onClick={() => baixarArquivoModelo('chefia')}
            className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Baixar planilha modelo vazia"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Baixar Modelo (.xlsx)</span>
          </button>
        </div>

        {abaChefia === 'escala_final' && (
          <button
            onClick={() => window.print()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Calendário Oficial</span>
          </button>
        )}
      </div>

      {/* ========================================================
          VISUALIZAÇÃO EXCLUSIVA EM CALENDÁRIO: SOLICITAÇÕES
         ======================================================== */}
      {abaChefia === 'solicitacoes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
                Grade Mensal de Vagas Solicitadas pela Chefia ({config.mesAnoAtual})
              </h3>
              <p className="text-xs text-slate-400">
                Clique em qualquer dia para adicionar vagas ou clique nas etiquetas para editar.
              </p>
            </div>

            {vagas.length === 0 && (
              <span className="text-xs text-amber-400 bg-amber-950/60 border border-amber-800 px-3 py-1 rounded-md">
                Aguardando upload da planilha ou cadastro de vagas
              </span>
            )}
          </div>

          {/* Calendário Mensal em Grade */}
          <div className="space-y-1.5">
            {/* Dias da Semana */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1">
              {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(d => (
                <div key={d} className="bg-slate-950/90 py-2 rounded-lg border border-slate-800/80">
                  {d}
                </div>
              ))}
            </div>

            {/* Células dos Dias do Mês */}
            <div className="grid grid-cols-7 gap-2">
              {diasDoMes.map(diaYmd => {
                const dataObj = new Date(diaYmd + 'T00:00:00');
                const diaNum = diaYmd.split('-')[2];
                const diaSemana = dataObj.getDay();
                const isFimDeSemana = diaSemana === 0 || diaSemana === 6;

                // Vagas do dia
                const vagasDoDia = vagasFiltradas.filter(v => v.data === diaYmd);
                const totalVagasDia = vagasDoDia.reduce((a, v) => a + v.vagasSolicitadas, 0);

                return (
                  <div
                    key={diaYmd}
                    onClick={() => handleAbrirNovaVaga(diaYmd)}
                    className={`min-h-[125px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                      vagasDoDia.length > 0
                        ? 'bg-slate-950/90 border-slate-700 hover:border-blue-500'
                        : 'bg-slate-900/50 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    {/* Topo da Célula */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isFimDeSemana ? 'text-amber-400 font-extrabold' : 'text-slate-300'}`}>
                        {diaNum}
                      </span>

                      {totalVagasDia > 0 ? (
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono font-bold">
                          {totalVagasDia} {totalVagasDia === 1 ? 'vaga' : 'vagas'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600 opacity-0 hover:opacity-100">+ Vaga</span>
                      )}
                    </div>

                    {/* Vagas do Dia com Cores Específicas de Turno */}
                    <div className="my-1.5 space-y-1 overflow-y-auto max-h-24">
                      {vagasDoDia.map(vaga => {
                        const turno = turnos.find(t => t.id === vaga.turnoId);
                        const estilo = obterEstiloTurno(vaga.turnoId);
                        const isPreenchida = vaga.alocados.length >= vaga.vagasSolicitadas;

                        return (
                          <div
                            key={vaga.id}
                            onClick={(e) => handleEditarVaga(vaga, e)}
                            className={`p-1 rounded border text-[10px] transition-all hover:scale-[1.02] ${estilo.bg} ${estilo.border}`}
                            title={`${turno?.nome} (${vaga.horario}) - ${vaga.setor}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={`font-bold ${estilo.text} flex items-center gap-1`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${estilo.dot}`}></span>
                                {turno?.codigo || 'T'}: {vaga.vagasSolicitadas}v
                              </span>
                              <div className="flex items-center gap-1">
                                {isPreenchida && (
                                  <span className="text-emerald-400 font-bold" title="Preenchida">&bull; OK</span>
                                )}
                                <button
                                  onClick={(e) => handleExcluirVaga(vaga.id, e)}
                                  className="text-slate-500 hover:text-red-400 p-0.5"
                                  title="Excluir vaga"
                                >
                                  &times;
                                </button>
                              </div>
                            </div>
                            <div className="text-slate-300 truncate font-sans">
                              {vaga.setor}
                            </div>
                          </div>
                        );
                      })}

                      {vagasDoDia.length === 0 && (
                        <div className="h-full flex items-center justify-center text-[10px] text-slate-600 italic py-2">
                          Sem vagas
                        </div>
                      )}
                    </div>

                    {/* Rodapé da Célula */}
                    <div className="text-[9px] text-slate-500 text-right">
                      {isFimDeSemana ? 'Plantão' : 'Dia útil'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          VISUALIZAÇÃO EXCLUSIVA EM CALENDÁRIO: ESCALA FINAL
         ======================================================== */}
      {abaChefia === 'escala_final' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                Calendário Oficial de Policiais Escalados ({config.mesAnoAtual})
              </h3>
              <p className="text-xs text-slate-400">
                Visualização oficial em formato calendário com os policiais alocados por turno em cada dia.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {listasArmazenadas.length > 0 && onCarregarListaArmazenada && (
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
                  <Archive className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px] text-slate-400">Consultar Histórico:</span>
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
                      Selecionar mês...
                    </option>
                    {listasArmazenadas.map(l => (
                      <option key={l.id} value={l.id} className="bg-slate-900 text-white">
                        {l.titulo}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                Total Escalados: <strong className="text-emerald-400 font-bold">{vagasAlocadasTotal.reduce((a, v) => a + v.alocados.length, 0)}</strong>
              </div>
            </div>
          </div>

          {vagasAlocadasTotal.length === 0 ? (
            <div className="p-12 text-center bg-slate-950/60 rounded-xl border border-slate-800">
              <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-300">Nenhum policial escalado para este mês ainda</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Assim que a comissão administrativa executar a distribuição da Regra 01, os nomes dos policiais escalados e seus turnos aparecerão coloridos neste calendário.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* Cabeçalho Semanal */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1">
                {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(d => (
                  <div key={d} className="bg-slate-950/90 py-2 rounded-lg border border-slate-800/80">
                    {d}
                  </div>
                ))}
              </div>

              {/* Células com Policiais Escalados em Cores por Turno */}
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
                      className={`min-h-[140px] p-2 rounded-xl border flex flex-col justify-between ${
                        vagasDoDia.length > 0
                          ? 'bg-slate-950/90 border-slate-700'
                          : 'bg-slate-900/40 border-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${isFimDeSemana ? 'text-amber-400 font-extrabold' : 'text-slate-300'}`}>
                          {diaNum}
                        </span>
                        {vagasDoDia.length > 0 && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                            {vagasDoDia.reduce((a, v) => a + v.alocados.length, 0)} policial(is)
                          </span>
                        )}
                      </div>

                      {/* Lista de Policiais Escalados com Cores dos Turnos */}
                      <div className="space-y-1 overflow-y-auto max-h-28 text-[10px]">
                        {vagasDoDia.map(vaga => {
                          const turno = turnos.find(t => t.id === vaga.turnoId);
                          const estilo = obterEstiloTurno(vaga.turnoId);

                          return vaga.alocados.map((aloc, idx) => (
                            <div
                              key={`${vaga.id}-${idx}`}
                              className={`p-1 rounded border leading-tight ${estilo.bg} ${estilo.border}`}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span className={estilo.text}>{turno?.codigo || 'T'}</span>
                                <span className="text-slate-400 font-mono text-[9px]">{vaga.horario}</span>
                              </div>
                              <div className="font-semibold text-white truncate" title={aloc.policialNome}>
                                {aloc.policialNome}
                              </div>
                              <div className="text-[9px] text-slate-400 font-mono">
                                {aloc.policialRE}
                              </div>
                            </div>
                          ));
                        })}

                        {vagasDoDia.length === 0 && (
                          <div className="text-center text-slate-600 text-[10px] italic py-3">
                            Sem escala
                          </div>
                        )}
                      </div>

                      <div className="text-[9px] text-slate-500 text-right mt-1">
                        {obterNomeDiaSemana(diaYmd)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Nova Vaga da Chefia */}
      {modalNovaVaga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-1">
              {vagaEmEdicao ? 'Editar Demanda de Vaga' : 'Nova Solicitação de Vaga de DEJEP'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Informe os dados da diária para exibição no calendário do turno.
            </p>

            <form onSubmit={handleSalvarVaga} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Turno Solicitante</label>
                  <select
                    value={formData.turnoId}
                    onChange={(e) => {
                      const sel = turnos.find(t => t.id === e.target.value);
                      setFormData({
                        ...formData,
                        turnoId: e.target.value,
                        horario: sel?.horarioPadrao || formData.horario
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {turnos.map(t => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data da Vaga</label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Horário</label>
                  <input
                    type="text"
                    value={formData.horario}
                    onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Vagas Solicitadas</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.vagasSolicitadas}
                    onChange={(e) => setFormData({ ...formData, vagasSolicitadas: parseInt(e.target.value, 10) || 1 })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Setor / Posto Operacional</label>
                <input
                  type="text"
                  value={formData.setor}
                  onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                  placeholder="Ex: Portaria Principal, Sentinela, Pavilhão I"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observações da Chefia</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Justificativa da necessidade de reforço..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalNovaVaga(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm cursor-pointer"
                >
                  {vagaEmEdicao ? 'Salvar Alterações' : 'Adicionar ao Calendário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
