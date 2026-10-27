import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  RotateCw, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  FileSpreadsheet, 
  UserCheck, 
  ShieldCheck, 
  Sliders, 
  Info,
  CalendarDays,
  Download,
  Upload
} from 'lucide-react';
import { Policial, TurnoConfig, ConfiguracaoDejep } from '../types/dejep';
import { formatarDataBr, obterDiasDoMes, validarDatasPolicial, rotacionarOrdemProximoMes, reordenarPoliciais } from '../utils/dejepEngine';
import { exportarPoliciaisExcel, baixarArquivoModelo, importarPoliciaisExcel } from '../utils/excelExport';

interface PoliciaisTabProps {
  policiais: Policial[];
  setPoliciais: React.Dispatch<React.SetStateAction<Policial[]>>;
  turnos: TurnoConfig[];
  config: ConfiguracaoDejep;
  setConfig: React.Dispatch<React.SetStateAction<ConfiguracaoDejep>>;
  onAvancarMesRotatividade: () => void;
}

export const PoliciaisTab: React.FC<PoliciaisTabProps> = ({
  policiais,
  setPoliciais,
  turnos,
  config,
  setConfig,
  onAvancarMesRotatividade
}) => {
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [filtroTurno, setFiltroTurno] = useState<string>('todos');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const policiaisImportados = await importarPoliciaisExcel(file, config.mesAnoAtual);
      if (policiaisImportados.length === 0) {
        alert('Nenhum policial apto encontrado no arquivo. Verifique se as colunas correspondem ao modelo.');
        return;
      }
      if (window.confirm(`Foram identificados ${policiaisImportados.length} policiais aptos no arquivo.\n\nDeseja substituir a lista atual pela lista importada (OK) ou mesclar (Cancelar)?`)) {
        setPoliciais(policiaisImportados);
      } else {
        // Mesclar mantendo ordens
        const idsExistentes = new Set(policiais.map(p => p.re));
        const novosNaoDuplicados = policiaisImportados.filter(p => !idsExistentes.has(p.re));
        const mesclados = [...policiais, ...novosNaoDuplicados].map((p, idx) => ({ ...p, ordemEscolha: idx + 1 }));
        setPoliciais(mesclados);
      }
      alert(`${policiaisImportados.length} policiais carregados com sucesso!`);
    } catch (err: any) {
      alert(`Erro ao importar planilha: ${err?.message || err}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Modais
  const [modalNovoPolicial, setModalNovoPolicial] = useState<boolean>(false);
  const [policialEmEdicao, setPolicialEmEdicao] = useState<Policial | null>(null);
  const [policialGerenciandoDatas, setPolicialGerenciandoDatas] = useState<Policial | null>(null);
  const [modalRotatividadeConfirm, setModalRotatividadeConfirm] = useState<boolean>(false);

  // Form State para Novo / Editar Policial
  const [formData, setFormData] = useState({
    nome: '',
    re: '',
    cargo: 'Policial Penal - Classe II',
    turnoOrigem: turnos[0]?.nome || 'Turno 1 (Alfa)',
    maxDejepMes: 8,
    ativo: true,
    telefone: ''
  });

  // State temporário para o seletor de datas
  const [datasTemporarias, setDatasTemporarias] = useState<string[]>([]);

  // Filtra lista de policiais
  const policiaisFiltrados = [...policiais]
    .sort((a, b) => a.ordemEscolha - b.ordemEscolha)
    .filter(p => {
      const matchBusca = !termoBusca || 
        p.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        p.re.toLowerCase().includes(termoBusca.toLowerCase()) ||
        p.turnoOrigem.toLowerCase().includes(termoBusca.toLowerCase());

      const matchTurno = filtroTurno === 'todos' || p.turnoOrigem.includes(filtroTurno);

      return matchBusca && matchTurno;
    });

  // Abrir Modal de Novo Policial
  const handleAbrirNovoPolicial = () => {
    setPolicialEmEdicao(null);
    setFormData({
      nome: '',
      re: '',
      cargo: 'Policial Penal - Classe II',
      turnoOrigem: turnos[0]?.nome || 'Turno 1 (Alfa)',
      maxDejepMes: config.limitePadraoDejep || 8,
      ativo: true,
      telefone: ''
    });
    setModalNovoPolicial(true);
  };

  // Abrir Modal de Edição
  const handleAbrirEditarPolicial = (policial: Policial) => {
    setPolicialEmEdicao(policial);
    setFormData({
      nome: policial.nome,
      re: policial.re,
      cargo: policial.cargo,
      turnoOrigem: policial.turnoOrigem,
      maxDejepMes: policial.maxDejepMes,
      ativo: policial.ativo,
      telefone: policial.telefone || ''
    });
    setModalNovoPolicial(true);
  };

  // Salvar Policial
  const handleSalvarPolicial = (e: React.FormEvent) => {
    e.preventDefault();
    if (policialEmEdicao) {
      setPoliciais(prev => prev.map(p => {
        if (p.id === policialEmEdicao.id) {
          return {
            ...p,
            ...formData,
            maxDejepMes: Number(formData.maxDejepMes)
          };
        }
        return p;
      }));
    } else {
      // Nova ordem será a última posição
      const proximaOrdem = policiais.length > 0 
        ? Math.max(...policiais.map(p => p.ordemEscolha)) + 1 
        : 1;

      // Sugere 6 datas padrão no mês
      const diasDoMes = obterDiasDoMes(config.mesAnoAtual);
      const datasSugeridas = diasDoMes.slice(0, 6);

      const novo: Policial = {
        id: `pol-${Date.now()}`,
        ordemEscolha: proximaOrdem,
        nome: formData.nome,
        re: formData.re,
        cargo: formData.cargo,
        turnoOrigem: formData.turnoOrigem,
        datasDisponiveis: datasSugeridas,
        maxDejepMes: Number(formData.maxDejepMes),
        ativo: formData.ativo,
        telefone: formData.telefone
      };
      setPoliciais(prev => [...prev, novo]);
    }
    setModalNovoPolicial(false);
    setPolicialEmEdicao(null);
  };

  // Excluir Policial
  const handleExcluirPolicial = (id: string) => {
    if (window.confirm('Confirma a remoção deste policial da lista de aptos?')) {
      const restantes = policiais.filter(p => p.id !== id);
      // Reatribui ordem sequencial
      const reordenados = restantes
        .sort((a, b) => a.ordemEscolha - b.ordemEscolha)
        .map((p, idx) => ({ ...p, ordemEscolha: idx + 1 }));
      setPoliciais(reordenados);
    }
  };

  // Mover Posição na Fila (Subir / Descer)
  const handleMoverPosicao = (policialId: string, direcao: 'subir' | 'descer') => {
    const p = policiais.find(x => x.id === policialId);
    if (!p) return;

    const novaPosicao = direcao === 'subir' 
      ? Math.max(1, p.ordemEscolha - 1)
      : Math.min(policiais.length, p.ordemEscolha + 1);

    if (novaPosicao !== p.ordemEscolha) {
      const atualizados = reordenarPoliciais(policiais, policialId, novaPosicao);
      setPoliciais(atualizados);
    }
  };

  // Abrir Modal de Gerenciar Datas
  const handleAbrirGerenciarDatas = (policial: Policial) => {
    setPolicialGerenciandoDatas(policial);
    setDatasTemporarias([...policial.datasDisponiveis]);
  };

  // Alternar Data Selecionada
  const handleToggleData = (dataYmd: string) => {
    if (datasTemporarias.includes(dataYmd)) {
      setDatasTemporarias(prev => prev.filter(d => d !== dataYmd));
    } else {
      if (datasTemporarias.length >= config.maxDatasObrigatorias) {
        alert(`O limite máximo permitido por policial é de ${config.maxDatasObrigatorias} datas no mês.`);
        return;
      }
      setDatasTemporarias(prev => [...prev, dataYmd].sort());
    }
  };

  // Salvar Datas do Policial
  const handleSalvarDatasPolicial = () => {
    if (!policialGerenciandoDatas) return;

    const validacao = validarDatasPolicial(
      datasTemporarias, 
      config.minDatasObrigatorias, 
      config.maxDatasObrigatorias
    );

    if (!validacao.valido) {
      if (!window.confirm(`${validacao.mensagem}\n\nDeseja salvar mesmo com aviso? (O sistema exige de 5 a 10 datas para conformidade plena).`)) {
        return;
      }
    }

    setPoliciais(prev => prev.map(p => {
      if (p.id === policialGerenciandoDatas.id) {
        return {
          ...p,
          datasDisponiveis: datasTemporarias
        };
      }
      return p;
    }));

    setPolicialGerenciandoDatas(null);
  };

  // Helper rápido para preencher 6 datas automáticas
  const handleSelecionarDatasAutomaticas = (qtd = 6) => {
    const todosDias = obterDiasDoMes(config.mesAnoAtual);
    const selecionadas: string[] = [];
    const passo = Math.floor(todosDias.length / qtd);
    for (let i = 0; i < qtd; i++) {
      const idx = Math.min(i * passo + 1, todosDias.length - 1);
      selecionadas.push(todosDias[idx]);
    }
    setDatasTemporarias(selecionadas);
  };

  // Confirmação e Execução da Rotatividade Mensal
  const handleExecutarRotatividade = () => {
    onAvancarMesRotatividade();
    setModalRotatividadeConfirm(false);
  };

  // Policial que escolhe primeiro no mês atual
  const primeiroPolicial = [...policiais].sort((a, b) => a.ordemEscolha - b.ordemEscolha)[0];
  const segundoPolicial = [...policiais].sort((a, b) => a.ordemEscolha - b.ordemEscolha)[1];

  return (
    <div className="space-y-6">
      {/* Banner Principal com Regra de Ordem de Escolha e Rotatividade */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider border border-blue-500/30">
                [[Lista de DEJEP - Policial]]
              </span>
              <span className="text-slate-400 text-xs">Servidores Aptos e Ordem de Prioridade</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Policiais Aptos a Realizarem DEJEP no Mês
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Cada policial deve disponibilizar <strong>no mínimo 5 e no máximo 10 datas</strong> para a realização de DEJEP. A ordem de escolha é rigorosamente respeitada na distribuição: <span className="text-blue-300 font-medium">o policial que escolher primeiro neste mês será o último no próximo mês</span>, promovendo rotatividade contínua e justa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAbrirNovoPolicial}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Policial</span>
            </button>

            <button
              onClick={() => setModalRotatividadeConfirm(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
              title="Avançar mês aplicando a regra de rotatividade: 1º vira último"
            >
              <RotateCw className="w-4 h-4" />
              <span>Avançar Mês (Rotatividade)</span>
            </button>

            {/* Baixar Modelo Policiais */}
            <button
              onClick={() => baixarArquivoModelo('policial')}
              className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
              title="Baixar planilha modelo XLS/XLSX com regras de 5 a 10 datas e ordem de escolha"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Modelo (.xlsx)</span>
            </button>

            {/* Importar Planilha Policiais */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
              title="Importar relação de policiais aptos a partir de planilha Excel/CSV"
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
              onClick={() => exportarPoliciaisExcel(policiais, config.mesAnoAtual)}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {/* Destaque da Rotatividade Atual */}
        {primeiroPolicial && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wide">
                  1º Colocado no Mês Atual ({config.mesAnoAtual})
                </span>
                <strong className="text-sm text-emerald-400">
                  {primeiroPolicial.nome} ({primeiroPolicial.re})
                </strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Origem: {primeiroPolicial.turnoOrigem} | {primeiroPolicial.datasDisponiveis.length} datas ofertadas
                </p>
              </div>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-1 rounded text-xs font-bold">
                1ª Escolha
              </span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wide">
                  Regra de Rotatividade para o Próximo Mês
                </span>
                <p className="text-xs text-slate-300">
                  <span className="text-amber-400 font-semibold">{primeiroPolicial.nome}</span> irá para o final ({policiais.length}º lugar).
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {segundoPolicial ? (
                    <>
                      Novo 1º colocado: <strong className="text-white">{segundoPolicial.nome}</strong>
                    </>
                  ) : ''}
                </p>
              </div>
              <RotateCw className="w-6 h-6 text-indigo-400 animate-spin-slow opacity-80" />
            </div>
          </div>
        )}
      </div>

      {/* Barra de Filtros e Resumo de Conformidade */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Busca */}
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={termoBusca}
              onChange={e => setTermoBusca(e.target.value)}
              placeholder="Buscar por nome, RE ou turno..."
              className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-200 pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 placeholder-slate-500"
            />
          </div>

          {/* Filtro Turno */}
          <select
            value={filtroTurno}
            onChange={e => setFiltroTurno(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-sm text-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="todos">Todos os Turnos</option>
            {turnos.map(t => (
              <option key={t.id} value={t.nome}>{t.nome}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Total de Aptos: <strong className="text-white">{policiais.length}</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-medium">Exigência: 5 a 10 datas por policial</span>
        </div>
      </div>

      {/* Tabela Oficial de Policiais */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold text-center w-28">Ordem de Escolha</th>
                <th className="py-3 px-4 font-semibold">Policial / Servidor</th>
                <th className="py-3 px-4 font-semibold">RE / Matrícula</th>
                <th className="py-3 px-4 font-semibold">Turno de Origem</th>
                <th className="py-3 px-4 font-semibold">Datas Disponibilizadas</th>
                <th className="py-3 px-4 font-semibold text-center">Máx DEJEP</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {policiaisFiltrados.map((policial) => {
                const totalDatas = policial.datasDisponiveis.length;
                const datasValidas = totalDatas >= config.minDatasObrigatorias && totalDatas <= config.maxDatasObrigatorias;
                const isPrimeiro = policial.ordemEscolha === 1;

                return (
                  <tr 
                    key={policial.id} 
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isPrimeiro ? 'bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Ordem de Escolha */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs ${
                          isPrimeiro
                            ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-sm ring-2 ring-amber-400/40'
                            : policial.ordemEscolha <= 3
                            ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {policial.ordemEscolha}º
                        </span>

                        {/* Botões de Mover Fila */}
                        <div className="flex flex-col">
                          <button
                            onClick={() => handleMoverPosicao(policial.id, 'subir')}
                            disabled={policial.ordemEscolha === 1}
                            className="text-slate-500 hover:text-white disabled:opacity-20 p-0.5"
                            title="Subir posição na fila"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoverPosicao(policial.id, 'descer')}
                            disabled={policial.ordemEscolha === policiais.length}
                            className="text-slate-500 hover:text-white disabled:opacity-20 p-0.5"
                            title="Descer posição na fila"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Nome e Cargo */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{policial.nome}</span>
                            {isPrimeiro && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold uppercase">
                                Escolhe 1º
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 block">{policial.cargo}</span>
                        </div>
                      </div>
                    </td>

                    {/* RE */}
                    <td className="py-3 px-4 font-mono text-xs text-slate-300">
                      {policial.re}
                    </td>

                    {/* Turno Origem */}
                    <td className="py-3 px-4">
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                        {policial.turnoOrigem}
                      </span>
                    </td>

                    {/* Datas Disponibilizadas (5 a 10) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAbrirGerenciarDatas(policial)}
                          className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
                            datasValidas
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/50'
                              : 'bg-red-950/50 text-red-300 border-red-800 hover:bg-red-900/50 animate-pulse'
                          }`}
                          title="Clique para gerenciar as datas disponibilizadas pelo policial"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="font-bold">{totalDatas}</span>
                          <span className="text-[11px] opacity-80">/ 10 datas</span>
                        </button>

                        {!datasValidas && (
                          <span className="text-[11px] text-red-400 flex items-center gap-1" title="Exigido: Mínimo 5, Máximo 10 datas">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {totalDatas < config.minDatasObrigatorias ? 'Menos de 5' : 'Mais de 10'}
                          </span>
                        )}
                      </div>

                      {/* Preview resumido das primeiras datas */}
                      <div className="text-[11px] text-slate-400 mt-1 truncate max-w-xs font-mono">
                        {policial.datasDisponiveis.map(d => d.split('-')[2]).join(', ')} ({policial.datasDisponiveis.length} dias)
                      </div>
                    </td>

                    {/* Limite Máx */}
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-200">
                      {policial.maxDejepMes} diárias
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {policial.ativo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Apto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          Inapto / Licença
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleAbrirGerenciarDatas(policial)}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 rounded transition-colors"
                          title="Gerenciar Datas Disponibilizadas"
                        >
                          <CalendarDays className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAbrirEditarPolicial(policial)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Editar Policial"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExcluirPolicial(policial.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
                          title="Remover Policial"
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
      </div>

      {/* Modal Gerenciador de Datas (Mín 5, Máx 10) */}
      {policialGerenciandoDatas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-xl shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Datas Disponibilizadas pelo Servidor
                </h3>
                <p className="text-xs text-slate-400">
                  {policialGerenciandoDatas.nome} ({policialGerenciandoDatas.re}) - {policialGerenciandoDatas.turnoOrigem}
                </p>
              </div>

              {/* Contador de Datas com Validação */}
              <div className={`px-3 py-1 rounded-lg border text-xs font-bold ${
                datasTemporarias.length >= config.minDatasObrigatorias && datasTemporarias.length <= config.maxDatasObrigatorias
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-amber-950 text-amber-300 border-amber-700 animate-pulse'
              }`}>
                {datasTemporarias.length} de 10 datas selecionadas
              </div>
            </div>

            {/* Aviso de Regras */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 mb-4 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong>Regra Obrigatória:</strong> O policial deve disponibilizar no mínimo 5 e no máximo 10 datas em que tem disponibilidade para a realização de DEJEP no mês.
              </div>
            </div>

            {/* Calendário Interativo de Dias do Mês */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
              <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-xs font-bold text-slate-500 uppercase">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {obterDiasDoMes(config.mesAnoAtual).map(diaYmd => {
                  const dataObj = new Date(diaYmd + 'T00:00:00');
                  const diaSemana = dataObj.getDay();
                  const diaNum = diaYmd.split('-')[2];
                  const isSelecionada = datasTemporarias.includes(diaYmd);
                  const isFimDeSemana = diaSemana === 0 || diaSemana === 6;

                  return (
                    <button
                      key={diaYmd}
                      type="button"
                      onClick={() => handleToggleData(diaYmd)}
                      className={`h-11 rounded-lg border font-medium text-xs flex flex-col items-center justify-center transition-all ${
                        isSelecionada
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      <span>{diaNum}</span>
                      <span className={`text-[9px] ${isSelecionada ? 'text-blue-200' : isFimDeSemana ? 'text-amber-400' : 'text-slate-500'}`}>
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][diaSemana]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ações Rápidas de Seleção */}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelecionarDatasAutomaticas(6)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700"
                >
                  Sugerir 6 Datas
                </button>
                <button
                  type="button"
                  onClick={() => setDatasTemporarias([])}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700"
                >
                  Limpar Seleção
                </button>
              </div>

              <span className="text-[11px] text-slate-500">
                Mínimo: 5 | Máximo: 10
              </span>
            </div>

            {/* Botões do Rodapé */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPolicialGerenciandoDatas(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarDatasPolicial}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm"
              >
                Salvar Datas ({datasTemporarias.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro / Edição Policial */}
      {modalNovoPolicial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-1">
              {policialEmEdicao ? 'Editar Policial Apto' : 'Cadastrar Novo Policial Apto'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Preencha os dados funcionais do servidor apto para escalas de DEJEP.
            </p>

            <form onSubmit={handleSalvarPolicial} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Carlos Eduardo Mendes"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">RE / Matrícula</label>
                  <input
                    type="text"
                    value={formData.re}
                    onChange={e => setFormData({ ...formData, re: e.target.value })}
                    placeholder="Ex: RE 104.921-3"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cargo / Graduação</label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Turno de Origem</label>
                  <select
                    value={formData.turnoOrigem}
                    onChange={e => setFormData({ ...formData, turnoOrigem: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {turnos.map(t => (
                      <option key={t.id} value={t.nome}>{t.nome}</option>
                    ))}
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Limite Máx DEJEP / Mês</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.maxDejepMes}
                    onChange={e => setFormData({ ...formData, maxDejepMes: parseInt(e.target.value, 10) || 8 })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status Funcional</label>
                  <select
                    value={formData.ativo ? 'ativo' : 'inativo'}
                    onChange={e => setFormData({ ...formData, ativo: e.target.value === 'ativo' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ativo">Apto para DEJEP</option>
                    <option value="inativo">Inapto / Licença Médica</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalNovoPolicial(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm"
                >
                  {policialEmEdicao ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Rotatividade Mensal */}
      {modalRotatividadeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-950 border border-indigo-700 flex items-center justify-center text-indigo-400">
                <RotateCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Executar Rotatividade Mensal</h3>
                <p className="text-xs text-slate-400">Aplicação da Regra Estrita de Rodízio de Escolha</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300 mb-4">
              <p className="leading-relaxed">
                De acordo com a especificação do sistema:
              </p>
              <div className="p-3 bg-indigo-950/40 rounded-lg border border-indigo-800/60 text-indigo-200 font-medium">
                "O policial que escolher primeiro neste mês é o último no próximo e assim por diante."
              </div>

              <div className="space-y-1.5 pt-1 text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>O atual 1º ({primeiroPolicial?.nome}) irá para a posição {policiais.length}º.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  <span>O atual 2º ({segundoPolicial?.nome}) se tornará o novo 1º da fila.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  <span>O mês avançará automaticamente no sistema, preparando a nova grade.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalRotatividadeConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecutarRotatividade}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Confirmar e Avançar Mês
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
