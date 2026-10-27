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
  ChevronRight
} from 'lucide-react';
import { VagaChefia, TurnoConfig, ConfiguracaoDejep, Policial } from '../types/dejep';
import { formatarDataBr, obterDiasDoMes } from '../utils/dejepEngine';
import { exportarChefiaExcel, baixarArquivoModelo, importarChefiaExcel } from '../utils/excelExport';

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
  // Aba ativa de turno: 'todos' ou o ID do turno ('t1', 't2', etc.)
  const [turnoAbaAtiva, setTurnoAbaAtiva] = useState<string>('todos');
  const [modoVisualizacao, setModoVisualizacao] = useState<'tabela' | 'calendario'>('tabela');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const vagasImportadas = await importarChefiaExcel(file, turnos, config.mesAnoAtual);
      if (vagasImportadas.length === 0) {
        alert('Nenhuma solicitação de vaga válida encontrada no arquivo. Verifique se o formato corresponde ao modelo.');
        return;
      }
      if (window.confirm(`Foram identificadas ${vagasImportadas.length} solicitações de vagas no arquivo.\n\nDeseja adicionar às vagas existentes (OK) ou substituir tudo (Cancelar)?`)) {
        setVagas(prev => [...prev, ...vagasImportadas]);
      } else {
        setVagas(vagasImportadas);
      }
      alert(`${vagasImportadas.length} vagas importadas com sucesso!`);
    } catch (err: any) {
      alert(`Erro ao importar planilha: ${err?.message || err}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  // Modais
  const [modalNovaVaga, setModalNovaVaga] = useState<boolean>(false);
  const [modalGeradorLote, setModalGeradorLote] = useState<boolean>(false);
  const [vagaEmEdicao, setVagaEmEdicao] = useState<VagaChefia | null>(null);

  // Form State para Nova Vaga / Edição
  const [formData, setFormData] = useState({
    turnoId: turnos[0]?.id || 't1',
    data: `${config.mesAnoAtual}-01`,
    horario: turnos[0]?.horarioPadrao || '06:00 - 14:00',
    setor: 'Portaria Principal e Muralha',
    vagasSolicitadas: 1,
    observacoes: '',
    prioridade: 'normal' as 'normal' | 'alta' | 'urgente'
  });

  // Form State para Gerador em Lote
  const [loteData, setLoteData] = useState({
    turnoId: turnos[0]?.id || 't1',
    tipoSelecao: 'finais-de-semana' as 'finais-de-semana' | 'todos-os-dias' | 'dias-pares' | 'dias-impares',
    horario: turnos[0]?.horarioPadrao || '06:00 - 14:00',
    setor: 'Reforço Geral de Segurança',
    vagasPorDia: 1,
    prioridade: 'normal' as 'normal' | 'alta' | 'urgente',
    observacoes: 'Gerado automaticamente pelo planejamento mensal do turno'
  });

  // Filtra vagas por turno ativo
  const vagasFiltradasTurno = vagas.filter(v => {
    if (turnoAbaAtiva === 'todos') return true;
    return v.turnoId === turnoAbaAtiva;
  });

  // Filtra por termo de busca
  const vagasExibidas = vagasFiltradasTurno.filter(v => {
    if (!termoBusca) return true;
    const busca = termoBusca.toLowerCase();
    const turno = turnos.find(t => t.id === v.turnoId);
    return (
      v.data.includes(busca) ||
      v.setor.toLowerCase().includes(busca) ||
      (turno && turno.nome.toLowerCase().includes(busca)) ||
      (v.observacoes && v.observacoes.toLowerCase().includes(busca)) ||
      v.alocados.some(a => a.policialNome.toLowerCase().includes(busca) || a.policialRE.toLowerCase().includes(busca))
    );
  }).sort((a, b) => a.data.localeCompare(b.data));

  // Turno selecionado
  const turnoAtualObj = turnos.find(t => t.id === turnoAbaAtiva);

  // Estatísticas para a aba selecionada
  const totalVagasSolicitadas = vagasFiltradasTurno.reduce((acc, v) => acc + v.vagasSolicitadas, 0);
  const totalVagasPreenchidas = vagasFiltradasTurno.reduce((acc, v) => acc + v.alocados.length, 0);
  const totalVagasAbertas = Math.max(0, totalVagasSolicitadas - totalVagasPreenchidas);
  const percentualAtendimento = totalVagasSolicitadas > 0 ? Math.round((totalVagasPreenchidas / totalVagasSolicitadas) * 100) : 0;

  // Abrir Modal de Nova Vaga
  const handleAbrirNovaVaga = (turnoIdPadrao?: string) => {
    const turnoAlvo = turnos.find(t => t.id === (turnoIdPadrao || turnoAbaAtiva)) || turnos[0];
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

  // Abrir Modal de Edição
  const handleEditarVaga = (vaga: VagaChefia) => {
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

  // Salvar Vaga (Nova ou Editada)
  const handleSalvarVaga = (e: React.FormEvent) => {
    e.preventDefault();
    if (vagaEmEdicao) {
      // Edição
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
      // Nova
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

  // Excluir Vaga
  const handleExcluirVaga = (vagaId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta solicitação de vaga?')) {
      setVagas(prev => prev.filter(v => v.id !== vagaId));
    }
  };

  // Gerador em Lote
  const handleExecutarGeradorLote = (e: React.FormEvent) => {
    e.preventDefault();
    const dias = obterDiasDoMes(config.mesAnoAtual);
    const novasVagas: VagaChefia[] = [];

    dias.forEach(diaYmd => {
      const dataObj = new Date(diaYmd + 'T00:00:00');
      const diaSemana = dataObj.getDay(); // 0 = Dom, 6 = Sab
      const diaNum = parseInt(diaYmd.split('-')[2], 10);

      let deveIncluir = false;
      if (loteData.tipoSelecao === 'todos-os-dias') {
        deveIncluir = true;
      } else if (loteData.tipoSelecao === 'finais-de-semana') {
        deveIncluir = diaSemana === 0 || diaSemana === 6;
      } else if (loteData.tipoSelecao === 'dias-pares') {
        deveIncluir = diaNum % 2 === 0;
      } else if (loteData.tipoSelecao === 'dias-impares') {
        deveIncluir = diaNum % 2 !== 0;
      }

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

  // Desalocar policial manualmente
  const handleRemoverAlocacao = (vagaId: string, policialId: string) => {
    setVagas(prev => prev.map(v => {
      if (v.id === vagaId) {
        return {
          ...v,
          alocados: v.alocados.filter(a => a.policialId !== policialId)
        };
      }
      return v;
    }));
  };

  // Helper para dia da semana
  const obterNomeDiaSemana = (dataYmd: string) => {
    const dataObj = new Date(dataYmd + 'T00:00:00');
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return dias[dataObj.getDay()];
  };

  return (
    <div className="space-y-6">
      {/* Header com Descrição das Especificações */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider border border-blue-500/30">
                [[Lista de DEJEP - Chefia]]
              </span>
              <span className="text-slate-400 text-xs">Preenchimento Mensal das Demandas de Turno</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Relação de Vagas e Horários Solicitados pelos Chefes de Turno
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Relação de datas, horários e postos operacionais solicitados pela Chefia de cada turno para o mês. As solicitações estão organizadas em abas individuais para cada turno e consolidadas na visão geral.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleAbrirNovaVaga()}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Vaga</span>
            </button>

            <button
              onClick={() => setModalGeradorLote(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium px-3.5 py-2 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors"
              title="Gerar vagas em massa para finais de semana ou dias corridos"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Gerador em Lote</span>
            </button>

            {/* Baixar Modelo Oficial */}
            <button
              onClick={() => baixarArquivoModelo('chefia')}
              className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
              title="Baixar planilha modelo XLS/XLSX com abas por turno para preenchimento da Chefia"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Modelo (.xlsx)</span>
            </button>

            {/* Importar Planilha Preenchida */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
              title="Carregar planilha preenchida da Chefia (XLSX, XLS ou CSV)"
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
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
              title="Exportar pasta de trabalho Excel com abas separadas para cada turno"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Abas Diferentes para Cada Turno (Requisito Explícito do Usuário) */}
      <div className="border-b border-slate-800 bg-slate-900/60 rounded-xl p-1.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {/* Aba Todos os Turnos */}
          <button
            onClick={() => setTurnoAbaAtiva('todos')}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              turnoAbaAtiva === 'todos'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Todos os Turnos (Geral)</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${turnoAbaAtiva === 'todos' ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-300'}`}>
              {vagas.length}
            </span>
          </button>

          {/* Abas Individuais dos Turnos */}
          {turnos.map(turno => {
            const countTurno = vagas.filter(v => v.turnoId === turno.id).length;
            const isAtivo = turnoAbaAtiva === turno.id;
            return (
              <button
                key={turno.id}
                onClick={() => setTurnoAbaAtiva(turno.id)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  isAtivo
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-blue-300" />
                <span>{turno.nome}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isAtivo ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {countTurno}
                </span>
              </button>
            );
          })}
        </div>

        {/* Alternador de Modo de Visualização */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setModoVisualizacao('tabela')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              modoVisualizacao === 'tabela' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tabela
          </button>
          <button
            onClick={() => setModoVisualizacao('calendario')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              modoVisualizacao === 'calendario' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Calendário
          </button>
        </div>
      </div>

      {/* Banner de Detalhes do Turno Atual */}
      {turnoAtualObj ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400 font-bold text-lg">
              {turnoAtualObj.codigo}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{turnoAtualObj.nome}</h3>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  Horário Padrão: {turnoAtualObj.horarioPadrao}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {turnoAtualObj.chefeNome || 'Chefia de Turno'}
              </p>
            </div>
          </div>

          {/* Cards de Métricas do Turno */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Vagas Solicitadas</span>
              <strong className="text-base text-white">{totalVagasSolicitadas}</strong>
            </div>
            <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Preenchidas</span>
              <strong className="text-base text-emerald-400">{totalVagasPreenchidas}</strong>
            </div>
            <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Em Aberto</span>
              <strong className="text-base text-amber-400">{totalVagasAbertas}</strong>
            </div>
            <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Atendimento</span>
              <strong className="text-base text-blue-400">{percentualAtendimento}%</strong>
            </div>
          </div>
        </div>
      ) : (
        /* Visão Consolidada Geral */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400">Total Vagas Solicitadas</span>
            <div className="text-2xl font-bold text-white mt-1">{totalVagasSolicitadas}</div>
            <span className="text-xs text-slate-500">em todos os turnos</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400">Vagas Preenchidas</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{totalVagasPreenchidas}</div>
            <span className="text-xs text-emerald-500/80">policiais escalados</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400">Vagas em Aberto</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{totalVagasAbertas}</div>
            <span className="text-xs text-amber-500/80">disponíveis para alocação</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-xs text-slate-400">Índice de Cobertura</span>
            <div className="text-2xl font-bold text-blue-400 mt-1">{percentualAtendimento}%</div>
            <span className="text-xs text-blue-500/80">das vagas supridas</span>
          </div>
        </div>
      )}

      {/* Barra de Filtro e Busca */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={termoBusca}
            onChange={e => setTermoBusca(e.target.value)}
            placeholder="Buscar por data, setor, policial escalado ou observação..."
            className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-200 pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />
        </div>

        <div className="text-xs text-slate-400">
          Exibindo <strong>{vagasExibidas.length}</strong> de {vagasFiltradasTurno.length} registros
        </div>
      </div>

      {/* Visualização em Tabela */}
      {modoVisualizacao === 'tabela' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {vagasExibidas.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-300">Nenhuma vaga cadastrada para este turno</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Utilize o botão "+ Nova Vaga" ou o "Gerador em Lote" para preencher as solicitações mensais da Chefia.
              </p>
              <button
                onClick={() => handleAbrirNovaVaga()}
                className="mt-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Vaga
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/70 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Data / Dia</th>
                    <th className="py-3 px-4 font-semibold">Turno</th>
                    <th className="py-3 px-4 font-semibold">Horário</th>
                    <th className="py-3 px-4 font-semibold">Setor / Posto</th>
                    <th className="py-3 px-4 font-semibold text-center">Vagas</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Policiais Escalados</th>
                    <th className="py-3 px-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {vagasExibidas.map(vaga => {
                    const turno = turnos.find(t => t.id === vaga.turnoId);
                    const isCheia = vaga.alocados.length >= vaga.vagasSolicitadas;
                    const isParcial = vaga.alocados.length > 0 && !isCheia;
                    const diaSemana = obterNomeDiaSemana(vaga.data);
                    const isFimDeSemana = diaSemana === 'Sábado' || diaSemana === 'Domingo';

                    return (
                      <tr key={vaga.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Data */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-white flex items-center gap-1.5">
                            <span>{formatarDataBr(vaga.data)}</span>
                            {vaga.prioridade === 'urgente' && (
                              <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.2 rounded font-bold uppercase">
                                Urgente
                              </span>
                            )}
                          </div>
                          <span className={`text-xs ${isFimDeSemana ? 'text-amber-400 font-medium' : 'text-slate-500'}`}>
                            {diaSemana}
                          </span>
                        </td>

                        {/* Turno */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            {turno?.nome || vaga.turnoId}
                          </span>
                        </td>

                        {/* Horário */}
                        <td className="py-3 px-4 font-mono text-xs text-slate-300">
                          {vaga.horario}
                        </td>

                        {/* Setor */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-white">{vaga.setor}</div>
                          {vaga.observacoes && (
                            <p className="text-xs text-slate-400 truncate max-w-xs" title={vaga.observacoes}>
                              {vaga.observacoes}
                            </p>
                          )}
                        </td>

                        {/* Vagas Solicitadas vs Preenchidas */}
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono text-sm font-bold text-white">
                            {vaga.alocados.length}
                          </span>
                          <span className="text-xs text-slate-500"> / {vaga.vagasSolicitadas}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {isCheia ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Preenchida
                            </span>
                          ) : isParcial ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Parcial ({vaga.alocados.length}/{vaga.vagasSolicitadas})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Aberta
                            </span>
                          )}
                        </td>

                        {/* Policiais Escalados */}
                        <td className="py-3 px-4">
                          {vaga.alocados.length === 0 ? (
                            <span className="text-xs text-slate-500 italic">Nenhum policial alocado</span>
                          ) : (
                            <div className="space-y-1">
                              {vaga.alocados.map((aloc, idx) => (
                                <div 
                                  key={idx} 
                                  className="flex items-center justify-between gap-2 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-xs"
                                >
                                  <div>
                                    <span className="font-medium text-slate-200">{aloc.policialNome}</span>
                                    <span className="text-slate-500 ml-1 font-mono">({aloc.policialRE})</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1 rounded border border-indigo-800">
                                      R{aloc.rodada}
                                    </span>
                                    <button
                                      onClick={() => handleRemoverAlocacao(vaga.id, aloc.policialId)}
                                      className="text-slate-500 hover:text-red-400 p-0.5 rounded"
                                      title="Remover policial desta vaga"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditarVaga(vaga)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                              title="Editar vaga"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleExcluirVaga(vaga.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                              title="Excluir vaga"
                            >
                              <Trash2 className="w-4 h-4" />
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
      ) : (
        /* Visualização em Calendário Mensal */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-400" />
              Mapa Mensal de Demandas da Chefia ({config.mesAnoAtual})
            </h3>
            <span className="text-xs text-slate-400">Clique em um dia para adicionar vaga</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
              <div key={dia} className="text-center font-bold text-xs uppercase text-slate-500 py-1 bg-slate-950/60 rounded">
                {dia}
              </div>
            ))}

            {obterDiasDoMes(config.mesAnoAtual).map(diaYmd => {
              const dataObj = new Date(diaYmd + 'T00:00:00');
              const diaNum = diaYmd.split('-')[2];
              const vagasDoDia = vagasFiltradasTurno.filter(v => v.data === diaYmd);
              const totalVagasDia = vagasDoDia.reduce((acc, v) => acc + v.vagasSolicitadas, 0);
              const totalAlocadosDia = vagasDoDia.reduce((acc, v) => acc + v.alocados.length, 0);

              return (
                <div
                  key={diaYmd}
                  className={`min-h-[100px] p-2 rounded-lg border transition-all flex flex-col justify-between ${
                    vagasDoDia.length > 0
                      ? 'bg-slate-950/80 border-slate-700 hover:border-blue-500'
                      : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">{diaNum}</span>
                    {totalVagasDia > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        totalAlocadosDia >= totalVagasDia
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {totalAlocadosDia}/{totalVagasDia} vagas
                      </span>
                    )}
                  </div>

                  {/* Lista de vagas do dia */}
                  <div className="my-1 space-y-1 overflow-y-auto max-h-16 text-[10px]">
                    {vagasDoDia.map(v => {
                      const turno = turnos.find(t => t.id === v.turnoId);
                      return (
                        <div 
                          key={v.id} 
                          className="bg-slate-800/80 p-1 rounded border border-slate-700 truncate"
                          title={`${turno?.nome} (${v.horario}) - ${v.setor}`}
                        >
                          <span className="font-semibold text-blue-300">{turno?.codigo || 'T'}: </span>
                          <span className="text-slate-300">{v.setor}</span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, data: diaYmd }));
                      setModalNovaVaga(true);
                    }}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-medium text-left flex items-center gap-1 mt-1"
                  >
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Nova Vaga / Edição */}
      {modalNovaVaga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-1">
              {vagaEmEdicao ? 'Editar Solicitação de Vaga da Chefia' : 'Nova Solicitação de Vaga da Chefia'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Informe os dados da diária especial solicitada pelo Chefe de Turno.
            </p>

            <form onSubmit={handleSalvarVaga} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Turno */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Turno Solicitante</label>
                  <select
                    value={formData.turnoId}
                    onChange={e => {
                      const selectedTurno = turnos.find(t => t.id === e.target.value);
                      setFormData({
                        ...formData,
                        turnoId: e.target.value,
                        horario: selectedTurno?.horarioPadrao || formData.horario
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {turnos.map(t => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Data */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data da Vaga</label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={e => setFormData({ ...formData, data: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Horário */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Horário da DEJEP</label>
                  <input
                    type="text"
                    value={formData.horario}
                    onChange={e => setFormData({ ...formData, horario: e.target.value })}
                    placeholder="Ex: 06:00 - 14:00"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {/* Quantidade de Vagas */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Qtd de Vagas</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.vagasSolicitadas}
                    onChange={e => setFormData({ ...formData, vagasSolicitadas: parseInt(e.target.value, 10) || 1 })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Setor / Posto */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Setor / Posto Operacional</label>
                <input
                  type="text"
                  value={formData.setor}
                  onChange={e => setFormData({ ...formData, setor: e.target.value })}
                  placeholder="Ex: Portaria Principal, Muralha Norte, Pavilhão 2, Escolta Externa"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Prioridade</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'alta', 'urgente'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, prioridade: p })}
                      className={`py-1.5 text-xs font-medium rounded-lg border capitalize ${
                        formData.prioridade === p
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observações da Chefia</label>
                <textarea
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Justificativa da demanda extraordinária, requisitos ou atribuições do posto..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalNovaVaga(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
                >
                  {vagaEmEdicao ? 'Salvar Alterações' : 'Cadastrar Vaga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gerador em Lote */}
      {modalGeradorLote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Gerador em Lote de Vagas da Chefia</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Crie rapidamente solicitações recorrentes de DEJEP para o mês todo com um clique.
            </p>

            <form onSubmit={handleExecutarGeradorLote} className="space-y-4">
              {/* Turno */}
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {turnos.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>

              {/* Padrão de Dias */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Padrão de Dias do Mês</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setLoteData({ ...loteData, tipoSelecao: 'finais-de-semana' })}
                    className={`p-2 rounded-lg border text-left ${
                      loteData.tipoSelecao === 'finais-de-semana'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <strong className="block text-white">Finais de Semana</strong>
                    Todos os sábados e domingos
                  </button>

                  <button
                    type="button"
                    onClick={() => setLoteData({ ...loteData, tipoSelecao: 'todos-os-dias' })}
                    className={`p-2 rounded-lg border text-left ${
                      loteData.tipoSelecao === 'todos-os-dias'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <strong className="block text-white">Todos os Dias</strong>
                    Diariamente no mês inteiro
                  </button>

                  <button
                    type="button"
                    onClick={() => setLoteData({ ...loteData, tipoSelecao: 'dias-pares' })}
                    className={`p-2 rounded-lg border text-left ${
                      loteData.tipoSelecao === 'dias-pares'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <strong className="block text-white">Dias Pares</strong>
                    Plantões intercalados (pares)
                  </button>

                  <button
                    type="button"
                    onClick={() => setLoteData({ ...loteData, tipoSelecao: 'dias-impares' })}
                    className={`p-2 rounded-lg border text-left ${
                      loteData.tipoSelecao === 'dias-impares'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <strong className="block text-white">Dias Ímpares</strong>
                    Plantões intercalados (ímpares)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Horário */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Horário</label>
                  <input
                    type="text"
                    value={loteData.horario}
                    onChange={e => setLoteData({ ...loteData, horario: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono"
                  />
                </div>

                {/* Vagas por dia */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Vagas por Dia</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={loteData.vagasPorDia}
                    onChange={e => setLoteData({ ...loteData, vagasPorDia: parseInt(e.target.value, 10) || 1 })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
                  />
                </div>
              </div>

              {/* Setor */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Setor / Posto</label>
                <input
                  type="text"
                  value={loteData.setor}
                  onChange={e => setLoteData({ ...loteData, setor: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
                />
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalGeradorLote(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Gerar Vagas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
