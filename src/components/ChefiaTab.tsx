import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  FileSpreadsheet, 
  Upload, 
  Download,
  Calendar as CalendarIcon, 
  Clock, 
  Building2, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Sparkles,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { VagaChefia, TurnoConfig, ConfiguracaoDejep, Policial } from '../types/dejep';
import { formatarDataBr, obterDiasDoMes } from '../utils/dejepEngine';
import { exportarChefiaExcel, baixarArquivoModelo, importarChefiaExcel } from '../utils/excelExport';
import { obterEstiloTurno } from '../utils/sampleData';

interface ChefiaTabProps {
  vagas: VagaChefia[];
  setVagas: React.Dispatch<React.SetStateAction<VagaChefia[]>>;
  turnos: TurnoConfig[];
  config: ConfiguracaoDejep;
  policiais: Policial[];
}

export const ChefiaTab: React.FC<ChefiaTabProps> = ({
  vagas,
  setVagas,
  turnos,
  config,
  policiais
}) => {
  const [turnoAbaAtiva, setTurnoAbaAtiva] = useState<string>('todos');
  const [modalNovaVaga, setModalNovaVaga] = useState<boolean>(false);
  const [modalGeradorLote, setModalGeradorLote] = useState<boolean>(false);
  const [vagaEmEdicao, setVagaEmEdicao] = useState<VagaChefia | null>(null);

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

  // Form State para Gerador em Lote
  const [loteData, setLoteData] = useState({
    turnoId: turnos[0]?.id || 't1',
    tipoSelecao: 'finais-de-semana' as 'finais-de-semana' | 'todos-os-dias' | 'dias-pares' | 'dias-impares',
    horario: turnos[0]?.horarioPadrao || '07:00 - 19:00',
    setor: 'Reforço Geral de Segurança',
    vagasPorDia: 1,
    prioridade: 'normal' as 'normal' | 'alta' | 'urgente',
    observacoes: 'Planejamento mensal do turno'
  });

  // Importar Planilha
  const handleImportarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const vagasImportadas = await importarChefiaExcel(file, turnos, config.mesAnoAtual);
      if (vagasImportadas.length === 0) {
        alert('Nenhuma solicitação de vaga encontrada no arquivo.');
        return;
      }
      setVagas(prev => [...prev, ...vagasImportadas]);
      alert(`${vagasImportadas.length} vagas importadas e adicionadas ao calendário!`);
    } catch (err: any) {
      alert(`Erro ao importar planilha: ${err?.message || err}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Filtra vagas por turno ativo
  const vagasFiltradasTurno = vagas.filter(v => {
    if (turnoAbaAtiva === 'todos') return true;
    return v.turnoId === turnoAbaAtiva;
  });

  const totalVagasSolicitadas = vagasFiltradasTurno.reduce((acc, v) => acc + v.vagasSolicitadas, 0);
  const totalVagasPreenchidas = vagasFiltradasTurno.reduce((acc, v) => acc + v.alocados.length, 0);

  // Dias do mês
  const diasDoMes = obterDiasDoMes(config.mesAnoAtual);

  const obterNomeDiaSemana = (dataYmd: string) => {
    const dataObj = new Date(dataYmd + 'T00:00:00');
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return dias[dataObj.getDay()];
  };

  // Abrir Modal
  const handleAbrirNovaVaga = (dataPreDefinida?: string) => {
    const turnoAlvo = turnos.find(t => t.id === (turnoAbaAtiva === 'todos' ? turnos[0]?.id : turnoAbaAtiva)) || turnos[0];
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

  const handleExcluirVaga = (vagaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Excluir esta solicitação de vaga?')) {
      setVagas(prev => prev.filter(v => v.id !== vagaId));
    }
  };

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
        id: `vaga-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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

  const handleExecutarGeradorLote = (e: React.FormEvent) => {
    e.preventDefault();
    const novasVagas: VagaChefia[] = [];

    diasDoMes.forEach(diaYmd => {
      const dataObj = new Date(diaYmd + 'T00:00:00');
      const diaSemana = dataObj.getDay();
      const diaNum = parseInt(diaYmd.split('-')[2], 10);

      let deveIncluir = false;
      if (loteData.tipoSelecao === 'todos-os-dias') deveIncluir = true;
      else if (loteData.tipoSelecao === 'finais-de-semana') deveIncluir = diaSemana === 0 || diaSemana === 6;
      else if (loteData.tipoSelecao === 'dias-pares') deveIncluir = diaNum % 2 === 0;
      else if (loteData.tipoSelecao === 'dias-impares') deveIncluir = diaNum % 2 !== 0;

      if (deveIncluir) {
        novasVagas.push({
          id: `vaga-lote-${Date.now()}-${diaNum}`,
          turnoId: loteData.turnoId,
          data: diaYmd,
          horario: loteData.horario,
          setor: loteData.setor,
          vagasSolicitadas: Number(loteData.vagasPorDia),
          alocados: [],
          prioridade: loteData.prioridade,
          observacoes: loteData.observacoes
        });
      }
    });

    setVagas(prev => [...prev, ...novasVagas]);
    setModalGeradorLote(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Institucional com Requisitos */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider border border-blue-500/30">
                [[Lista de DEJEP - Chefia]]
              </span>
              <span className="text-slate-400 text-xs">Exibição Exclusiva em Versão Calendário</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Calendário Mensal de Vagas e Horários dos Chefes de Turno
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              As demandas estão representadas na grade do calendário com a cor de cada turno. Faça o upload das listas para popular os dados ou clique nos dias para cadastrar vagas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleAbrirNovaVaga()}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Vaga</span>
            </button>

            <button
              onClick={() => setModalGeradorLote(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Gerador em Lote</span>
            </button>

            <button
              onClick={() => baixarArquivoModelo('chefia')}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Modelo (.xlsx)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Importar Planilha</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportarArquivo}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            <button
              onClick={() => exportarChefiaExcel(vagas, turnos, config.mesAnoAtual)}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {/* Legenda de Cores por Turno e Filtro de Abas */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mr-1">
              Cores dos Turnos:
            </span>

            <button
              onClick={() => setTurnoAbaAtiva('todos')}
              className={`px-3 py-1 rounded-md font-semibold border transition-all cursor-pointer ${
                turnoAbaAtiva === 'todos'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-xs'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Todos os Turnos ({vagas.length})
            </button>

            {turnos.map(turno => {
              const estilo = obterEstiloTurno(turno.id);
              const ativo = turnoAbaAtiva === turno.id;
              const count = vagas.filter(v => v.turnoId === turno.id).length;
              return (
                <button
                  key={turno.id}
                  onClick={() => setTurnoAbaAtiva(turno.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    estilo.badge
                  } ${ativo ? 'ring-2 ring-white/30' : 'opacity-70 hover:opacity-100'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${estilo.dot}`}></span>
                  <span>{turno.nome}</span>
                  <span className="text-[10px] font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="text-slate-400 text-xs">
            Vagas Solicitadas: <strong className="text-white">{totalVagasSolicitadas}</strong> | Atendidas: <strong className="text-emerald-400">{totalVagasPreenchidas}</strong>
          </div>
        </div>
      </div>

      {/* ========================================================
          VISUALIZAÇÃO EXCLUSIVA EM CALENDÁRIO MENSAL
         ======================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-400" />
              Grade de Vagas Solicitadas - {config.mesAnoAtual}
            </h3>
            <p className="text-xs text-slate-400">
              Clique em qualquer dia para adicionar uma solicitação de vaga ou clique na etiqueta colorida para editar.
            </p>
          </div>

          {vagas.length === 0 && (
            <div className="bg-amber-950/60 border border-amber-800 px-3 py-1.5 rounded-lg text-amber-300 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Em branco. Aguardando upload das listas para popular os dados.</span>
            </div>
          )}
        </div>

        {/* Grade do Calendário */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1">
            {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(d => (
              <div key={d} className="bg-slate-950/90 py-2 rounded-lg border border-slate-800/80">
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

              const vagasDoDia = vagasFiltradasTurno.filter(v => v.data === diaYmd);
              const totalVagasDia = vagasDoDia.reduce((a, v) => a + v.vagasSolicitadas, 0);

              return (
                <div
                  key={diaYmd}
                  onClick={() => handleAbrirNovaVaga(diaYmd)}
                  className={`min-h-[135px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                    vagasDoDia.length > 0
                      ? 'bg-slate-950/90 border-slate-700 hover:border-blue-500'
                      : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isFimDeSemana ? 'text-amber-400 font-extrabold' : 'text-slate-300'}`}>
                      {diaNum}
                    </span>
                    {totalVagasDia > 0 ? (
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-bold font-mono">
                        {totalVagasDia} v
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600 opacity-0 hover:opacity-100">+ Vaga</span>
                    )}
                  </div>

                  {/* Vagas com cores dos turnos */}
                  <div className="my-1.5 space-y-1 overflow-y-auto max-h-24">
                    {vagasDoDia.map(vaga => {
                      const turno = turnos.find(t => t.id === vaga.turnoId);
                      const estilo = obterEstiloTurno(vaga.turnoId);
                      const isPreenchida = vaga.alocados.length >= vaga.vagasSolicitadas;

                      return (
                        <div
                          key={vaga.id}
                          onClick={(e) => handleEditarVaga(vaga, e)}
                          className={`p-1.5 rounded border text-[10px] transition-all hover:scale-[1.02] ${estilo.bg} ${estilo.border}`}
                          title={`${turno?.nome} (${vaga.horario}) - ${vaga.setor}`}
                        >
                          <div className="flex items-center justify-between gap-1 font-bold">
                            <span className={estilo.text}>
                              {turno?.codigo || 'T'} &bull; {vaga.vagasSolicitadas} vaga(s)
                            </span>
                            <div className="flex items-center gap-1">
                              {isPreenchida && <span className="text-emerald-400 font-bold">&bull; OK</span>}
                              <button
                                onClick={(e) => handleExcluirVaga(vaga.id, e)}
                                className="text-slate-500 hover:text-red-400"
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                          <div className="text-slate-300 truncate font-sans">
                            {vaga.setor}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            {vaga.horario}
                          </div>
                        </div>
                      );
                    })}

                    {vagasDoDia.length === 0 && (
                      <div className="h-full flex items-center justify-center text-[10px] text-slate-600 italic py-2">
                        Sem demandas
                      </div>
                    )}
                  </div>

                  <div className="text-[9px] text-slate-500 text-right">
                    {obterNomeDiaSemana(diaYmd)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Nova Vaga */}
      {modalNovaVaga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-1">
              {vagaEmEdicao ? 'Editar Solicitação de Vaga' : 'Nova Solicitação de Vaga'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Informe os dados da diária para adicionar ao calendário do turno.
            </p>

            <form onSubmit={handleSalvarVaga} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Turno</label>
                  <select
                    value={formData.turnoId}
                    onChange={e => {
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data</label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={e => setFormData({ ...formData, data: e.target.value })}
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
                    onChange={e => setFormData({ ...formData, horario: e.target.value })}
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
                    onChange={e => setFormData({ ...formData, vagasSolicitadas: parseInt(e.target.value, 10) || 1 })}
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
                  onChange={e => setFormData({ ...formData, setor: e.target.value })}
                  placeholder="Ex: Portaria Principal, Muralha, Pavilhão I"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
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

      {/* Modal Gerador em Lote */}
      {modalGeradorLote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Gerador em Lote de Vagas</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Crie rapidamente solicitações recorrentes de DEJEP para o mês todo.
            </p>

            <form onSubmit={handleExecutarGeradorLote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Turno Destino</label>
                <select
                  value={loteData.turnoId}
                  onChange={e => {
                    const sel = turnos.find(t => t.id === e.target.value);
                    setLoteData({
                      ...loteData,
                      turnoId: e.target.value,
                      horario: sel?.horarioPadrao || loteData.horario
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                >
                  {turnos.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Padrão de Dias</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setLoteData({ ...loteData, tipoSelecao: 'finais-de-semana' })}
                    className={`p-2 rounded-lg border text-left cursor-pointer ${
                      loteData.tipoSelecao === 'finais-de-semana'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <strong className="block text-white">Finais de Semana</strong>
                    Sábados e domingos
                  </button>

                  <button
                    type="button"
                    onClick={() => setLoteData({ ...loteData, tipoSelecao: 'todos-os-dias' })}
                    className={`p-2 rounded-lg border text-left cursor-pointer ${
                      loteData.tipoSelecao === 'todos-os-dias'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <strong className="block text-white">Todos os Dias</strong>
                    Mês completo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Horário</label>
                  <input
                    type="text"
                    value={loteData.horario}
                    onChange={e => setLoteData({ ...loteData, horario: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Vagas por Dia</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={loteData.vagasPorDia}
                    onChange={e => setLoteData({ ...loteData, vagasPorDia: parseInt(e.target.value, 10) || 1 })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Setor / Posto</label>
                <input
                  type="text"
                  value={loteData.setor}
                  onChange={e => setLoteData({ ...loteData, setor: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalGeradorLote(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm cursor-pointer"
                >
                  Gerar no Calendário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
