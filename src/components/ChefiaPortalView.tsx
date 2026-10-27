import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Upload, 
  Download, 
  Calendar, 
  Clock, 
  Building2, 
  FileSpreadsheet, 
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
  FileCheck
} from 'lucide-react';
import { VagaChefia, TurnoConfig, ConfiguracaoDejep, Policial } from '../types/dejep';
import { formatarDataBr, obterDiasDoMes } from '../utils/dejepEngine';
import { baixarArquivoModelo, importarChefiaExcel, exportarChefiaExcel } from '../utils/excelExport';

interface ChefiaPortalViewProps {
  vagas: VagaChefia[];
  setVagas: React.Dispatch<React.SetStateAction<VagaChefia[]>>;
  turnos: TurnoConfig[];
  config: ConfiguracaoDejep;
  policiais: Policial[];
  onIrParaEscalaFinal?: () => void;
}

export const ChefiaPortalView: React.FC<ChefiaPortalViewProps> = ({
  vagas,
  setVagas,
  turnos,
  config,
  policiais
}) => {
  const [abaChefia, setAbaChefia] = useState<'solicitacoes' | 'escala_final'>('solicitacoes');
  const [turnoSelecionado, setTurnoSelecionado] = useState<string>('todos');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [modalNovaVaga, setModalNovaVaga] = useState<boolean>(false);
  const [vagaEmEdicao, setVagaEmEdicao] = useState<VagaChefia | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State para Nova Vaga
  const [formData, setFormData] = useState({
    turnoId: turnos[0]?.id || 't1',
    data: `${config.mesAnoAtual}-01`,
    horario: turnos[0]?.horarioPadrao || '06:00 - 14:00',
    setor: 'Portaria Principal e Muralha',
    vagasSolicitadas: 1,
    observacoes: '',
    prioridade: 'normal' as 'normal' | 'alta' | 'urgente'
  });

  // Vagas filtradas
  const vagasTurno = vagas.filter(v => {
    if (turnoSelecionado === 'todos') return true;
    return v.turnoId === turnoSelecionado;
  });

  const vagasExibidas = vagasTurno.filter(v => {
    if (!termoBusca) return true;
    const b = termoBusca.toLowerCase();
    const t = turnos.find(x => x.id === v.turnoId);
    return (
      v.data.includes(b) ||
      v.setor.toLowerCase().includes(b) ||
      (t && t.nome.toLowerCase().includes(b)) ||
      (v.observacoes && v.observacoes.toLowerCase().includes(b))
    );
  }).sort((a, b) => a.data.localeCompare(b.data));

  // Vagas com escala final preenchida
  const vagasComAlocacao = vagas
    .filter(v => v.alocados.length > 0)
    .filter(v => turnoSelecionado === 'todos' || v.turnoId === turnoSelecionado)
    .sort((a, b) => a.data.localeCompare(b.data));

  const obterNomeDiaSemana = (dataYmd: string) => {
    const dataObj = new Date(dataYmd + 'T00:00:00');
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return dias[dataObj.getDay()];
  };

  // Abrir Modal de Nova Vaga
  const handleAbrirNovaVaga = () => {
    const turnoAlvo = turnos.find(t => t.id === (turnoSelecionado === 'todos' ? turnos[0]?.id : turnoSelecionado)) || turnos[0];
    setFormData({
      turnoId: turnoAlvo ? turnoAlvo.id : 't1',
      data: `${config.mesAnoAtual}-01`,
      horario: turnoAlvo ? turnoAlvo.horarioPadrao : '06:00 - 14:00',
      setor: 'Portaria Principal e Muralha',
      vagasSolicitadas: 1,
      observacoes: '',
      prioridade: 'normal'
    });
    setVagaEmEdicao(null);
    setModalNovaVaga(true);
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
        id: `vaga-chefia-${Date.now()}`,
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
      if (window.confirm(`Foram identificadas ${vagasImportadas.length} solicitações de vagas no arquivo.\n\nDeseja adicionar às solicitações existentes (OK) ou substituir tudo (Cancelar)?`)) {
        setVagas(prev => [...prev, ...vagasImportadas]);
      } else {
        setVagas(vagasImportadas);
      }
      alert(`${vagasImportadas.length} solicitações de vagas enviadas com sucesso!`);
    } catch (err: any) {
      alert(`Erro ao processar planilha: ${err?.message || err}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const totalSolicitadas = vagasTurno.reduce((a, v) => a + v.vagasSolicitadas, 0);
  const totalPreenchidas = vagasTurno.reduce((a, v) => a + v.alocados.length, 0);

  return (
    <div className="space-y-6">
      {/* Banner Exclusivo do Portal da Chefia */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider border border-blue-500/30">
                Portal do Chefe de Turno
              </span>
              <span className="text-slate-400 text-xs">{config.unidadePrisional}</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Envio de Demandas de DEJEP & Escala Final
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Área simplificada para os Chefes de Turno. Cadastre novas vagas extraordinárias para o mês, envie a lista oficial em planilha Excel e consulte a escala final homologada.
            </p>
          </div>

          {/* Abas Internas da Chefia */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setAbaChefia('solicitacoes')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                abaChefia === 'solicitacoes'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Solicitar Vagas / Enviar Lista</span>
              <span className="bg-slate-800 px-1.5 py-0.2 rounded-full text-[10px]">
                {vagas.length}
              </span>
            </button>

            <button
              onClick={() => setAbaChefia('escala_final')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                abaChefia === 'escala_final'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Escala Final Gerada</span>
              <span className="bg-slate-800 px-1.5 py-0.2 rounded-full text-[10px] text-emerald-400">
                {vagasComAlocacao.reduce((a, v) => a + v.alocados.length, 0)}
              </span>
            </button>
          </div>
        </div>

        {/* Resumo do Mês e Turno */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Filtrar por Turno:</span>
            <select
              value={turnoSelecionado}
              onChange={(e) => setTurnoSelecionado(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="todos">Todos os Meus Turnos</option>
              {turnos.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Vagas Solicitadas no Mês: <strong className="text-white">{totalSolicitadas}</strong></span>
            <span>Atendidas pela Escala: <strong className="text-emerald-400">{totalPreenchidas}</strong></span>
          </div>
        </div>
      </div>

      {/* ABA 1: SOLICITAR VAGAS E ENVIAR LISTA */}
      {abaChefia === 'solicitacoes' && (
        <div className="space-y-4">
          {/* Barra de Ações Principais da Chefia */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Botão 1: Criar Nova Vaga */}
              <button
                onClick={handleAbrirNovaVaga}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Nova Vaga de DEJEP</span>
              </button>

              {/* Botão 2: Enviar / Importar Planilha com Datas */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                title="Carregar a planilha preenchida com as datas do mês"
              >
                <Upload className="w-4 h-4" />
                <span>Enviar Lista de Datas (.xlsx)</span>
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
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold px-3.5 py-2.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Baixar planilha modelo vazia para preencher"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Baixar Modelo (.xlsx)</span>
              </button>
            </div>

            {/* Busca rápida */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Buscar por data ou setor..."
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Relação de Solicitações do Turno */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {vagasExibidas.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-300">Nenhuma solicitação cadastrada para este mês</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Clique em "Criar Nova Vaga de DEJEP" ou utilize o botão "Enviar Lista de Datas (.xlsx)" para carregar sua relação de diárias solicitadas.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={handleAbrirNovaVaga}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Criar Vaga
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3.5 py-2 rounded-lg border border-slate-700 inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" /> Enviar Arquivo
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Data / Dia</th>
                      <th className="py-3 px-4 font-semibold">Turno</th>
                      <th className="py-3 px-4 font-semibold">Horário</th>
                      <th className="py-3 px-4 font-semibold">Setor / Posto Operacional</th>
                      <th className="py-3 px-4 font-semibold text-center">Vagas Solicitadas</th>
                      <th className="py-3 px-4 font-semibold">Status de Atendimento</th>
                      <th className="py-3 px-4 font-semibold">Policiais Escalados</th>
                      <th className="py-3 px-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {vagasExibidas.map(vaga => {
                      const turno = turnos.find(t => t.id === vaga.turnoId);
                      const diaSemana = obterNomeDiaSemana(vaga.data);
                      const isFimDeSemana = diaSemana.includes('Sábado') || diaSemana.includes('Domingo');
                      const preenchida = vaga.alocados.length >= vaga.vagasSolicitadas;
                      const parcial = vaga.alocados.length > 0 && !preenchida;

                      return (
                        <tr key={vaga.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white font-mono">{formatarDataBr(vaga.data)}</div>
                            <span className={`text-[11px] ${isFimDeSemana ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                              {diaSemana}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-medium text-slate-200">
                            {turno?.nome || vaga.turnoId}
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-300">
                            {vaga.horario}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{vaga.setor}</div>
                            {vaga.observacoes && (
                              <p className="text-[11px] text-slate-400 truncate max-w-xs">{vaga.observacoes}</p>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center font-bold text-white text-sm">
                            {vaga.vagasSolicitadas}
                          </td>

                          <td className="py-3 px-4">
                            {preenchida ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Atendida ({vaga.alocados.length}/{vaga.vagasSolicitadas})
                              </span>
                            ) : parcial ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <AlertCircle className="w-3.5 h-3.5" /> Parcial ({vaga.alocados.length}/{vaga.vagasSolicitadas})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Aguardando Distribuição
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {vaga.alocados.length === 0 ? (
                              <span className="text-slate-500 italic text-[11px]">Ainda não distribuído</span>
                            ) : (
                              <div className="space-y-1">
                                {vaga.alocados.map((aloc, idx) => (
                                  <div key={idx} className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                                    <strong className="text-slate-200">{aloc.policialNome}</strong>
                                    <span className="text-slate-500 ml-1 font-mono">({aloc.policialRE})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
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
                                }}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                                title="Editar vaga"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Excluir esta solicitação de vaga?')) {
                                    setVagas(prev => prev.filter(v => v.id !== vaga.id));
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded"
                                title="Excluir vaga"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: LISTA FINAL GERADA (ESCALA OFICIAL) */}
      {abaChefia === 'escala_final' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Escala Final Homologada de DEJEP ({config.mesAnoAtual})
              </h3>
              <p className="text-xs text-slate-400">
                Relação dos policiais penais escalados para atender às vagas solicitadas pela Chefia de Turno.
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Escala</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {vagasComAlocacao.length === 0 ? (
              <div className="p-12 text-center">
                <Info className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-300">A escala oficial deste mês ainda não foi homologada</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  A Comissão / Administração executará a distribuição automatizada da Regra 01. Assim que concluída, a relação de policiais aparecerá aqui automaticamente.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">Data</th>
                      <th className="py-2.5 px-4 font-bold">Dia da Semana</th>
                      <th className="py-2.5 px-4 font-bold">Turno</th>
                      <th className="py-2.5 px-4 font-bold">Horário</th>
                      <th className="py-2.5 px-4 font-bold">Setor / Posto</th>
                      <th className="py-2.5 px-4 font-bold">Policial Escalado</th>
                      <th className="py-2.5 px-4 font-bold">RE / Matrícula</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {vagasComAlocacao.flatMap(vaga => {
                      const turno = turnos.find(t => t.id === vaga.turnoId);
                      const diaSemana = obterNomeDiaSemana(vaga.data);
                      const isFimDeSemana = diaSemana.includes('Sábado') || diaSemana.includes('Domingo');

                      return vaga.alocados.map((aloc, idx) => (
                        <tr key={`${vaga.id}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-bold text-white">
                            {formatarDataBr(vaga.data)}
                          </td>
                          <td className={`py-2.5 px-4 ${isFimDeSemana ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
                            {diaSemana}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-200">
                            {turno?.nome || vaga.turnoId}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-300">
                            {vaga.horario}
                          </td>
                          <td className="py-2.5 px-4 text-slate-200 font-medium">
                            {vaga.setor}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-white">
                            {aloc.policialNome}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-300">
                            {aloc.policialRE}
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Nova Vaga da Chefia */}
      {modalNovaVaga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-1">
              {vagaEmEdicao ? 'Editar Solicitação de Vaga' : 'Nova Solicitação de Vaga da Chefia'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Informe os dados da diária especial solicitada para o seu turno.
            </p>

            <form onSubmit={handleSalvarVaga} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Turno</label>
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data</label>
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
                  placeholder="Ex: Portaria Principal, Muralha, Pavilhão I"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observações da Demanda</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Justificativa da necessidade operacional..."
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
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm"
                >
                  {vagaEmEdicao ? 'Salvar Alterações' : 'Cadastrar Vaga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
