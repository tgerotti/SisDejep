import React, { useState } from 'react';
import { 
  Printer, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Shield, 
  Calendar, 
  Users, 
  Search, 
  Filter,
  CheckCircle2,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';
import { VagaChefia, Policial, TurnoConfig, ConfiguracaoDejep, DistribuicaoLog } from '../types/dejep';
import { formatarDataBr, obterDiasDoMes } from '../utils/dejepEngine';
import { exportarEscalaOficialExcel } from '../utils/excelExport';

interface EscalaFinalTabProps {
  vagas: VagaChefia[];
  policiais: Policial[];
  turnos: TurnoConfig[];
  config: ConfiguracaoDejep;
  logs: DistribuicaoLog[];
}

export const EscalaFinalTab: React.FC<EscalaFinalTabProps> = ({
  vagas,
  policiais,
  turnos,
  config,
  logs
}) => {
  const [visao, setVisao] = useState<'lista' | 'matriz'>('lista');
  const [filtroTurno, setFiltroTurno] = useState<string>('todos');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [copiado, setCopiado] = useState<boolean>(false);

  // Vagas que possuem alocação
  const vagasAlocadas = vagas
    .filter(v => v.alocados.length > 0)
    .sort((a, b) => a.data.localeCompare(b.data));

  // Filtra por turno e busca
  const vagasFiltradas = vagasAlocadas.filter(v => {
    if (filtroTurno !== 'todos' && v.turnoId !== filtroTurno) return false;
    if (termoBusca) {
      const b = termoBusca.toLowerCase();
      const turno = turnos.find(t => t.id === v.turnoId);
      return (
        v.data.includes(b) ||
        v.setor.toLowerCase().includes(b) ||
        (turno && turno.nome.toLowerCase().includes(b)) ||
        v.alocados.some(a => a.policialNome.toLowerCase().includes(b) || a.policialRE.toLowerCase().includes(b))
      );
    }
    return true;
  });

  const obterNomeDiaSemana = (dataYmd: string) => {
    const dataObj = new Date(dataYmd + 'T00:00:00');
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return dias[dataObj.getDay()];
  };

  // Imprimir Escala
  const handleImprimir = () => {
    window.print();
  };

  // Copiar para Boletim Interno
  const handleCopiarBoletim = () => {
    let texto = `*ESCALA OFICIAL DE DEJEP - ${config.mesAnoAtual}*\n`;
    texto += `${config.unidadePrisional}\n`;
    texto += `Distribuição realizada conforme Regra 01 (Ordem de Escolha & Rotatividade)\n\n`;

    vagasAlocadas.forEach(v => {
      const turno = turnos.find(t => t.id === v.turnoId);
      const diaSemana = obterNomeDiaSemana(v.data);
      texto += `📅 *${formatarDataBr(v.data)} (${diaSemana})* - ${turno?.nome} [${v.horario}]\n`;
      texto += `   Setor: ${v.setor}\n`;
      v.alocados.forEach(a => {
        texto += `   👮 ${a.policialNome} (${a.policialRE}) - R${a.rodada}\n`;
      });
      texto += `\n`;
    });

    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  const diasDoMes = obterDiasDoMes(config.mesAnoAtual);

  return (
    <div className="space-y-6">
      {/* Barra de Ações - Oculta na Impressão */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-emerald-500/30">
                Documento Oficial
              </span>
              <span className="text-slate-400 text-xs">Publicação e Divulgação da Escala Mensal</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Mapa Oficial de Escala de DEJEP ({config.mesAnoAtual})
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Escala consolidada pronta para publicação em Boletim Interno, afixação em mural e assinatura dos Diretores e Chefes de Turno.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleImprimir}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Gerar PDF</span>
            </button>

            <button
              onClick={() => exportarEscalaOficialExcel(vagas, policiais, turnos, logs, config)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium px-3.5 py-2 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Exportar Excel Oficial</span>
            </button>

            <button
              onClick={handleCopiarBoletim}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium px-3.5 py-2 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors"
            >
              {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? 'Copiado!' : 'Copiar p/ WhatsApp/Boletim'}</span>
            </button>
          </div>
        </div>

        {/* Controles de Visualização e Filtro */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Botões Lista vs Matriz */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setVisao('lista')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                  visao === 'lista' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Relação Diária</span>
              </button>
              <button
                onClick={() => setVisao('matriz')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                  visao === 'matriz' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Matriz Mensal</span>
              </button>
            </div>

            {/* Filtro Turno */}
            <select
              value={filtroTurno}
              onChange={e => setFiltroTurno(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-1.5 rounded-lg focus:outline-none"
            >
              <option value="todos">Todos os Turnos</option>
              {turnos.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-400">
            Total de DEJEPs Escaladas: <strong className="text-emerald-400 font-bold">{vagasAlocadas.reduce((a, v) => a + v.alocados.length, 0)}</strong>
          </div>
        </div>
      </div>

      {/* ÁREA OFICIAL DE IMPRESSÃO / FOLHA DA ESCALA */}
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
            ESCALA OFICIAL DE DIÁRIA ESPECIAL DE JORNADA EXTRAORDINÁRIA DE TRABALHO (DEJEP)
          </div>
          <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
            Mês de Referência: <strong className="text-white print:text-black uppercase">{config.mesAnoAtual}</strong> | Publicação em Boletim Interno
          </p>
        </div>

        {/* Visão Relação Diária */}
        {visao === 'lista' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 print:text-black">
              <thead className="bg-slate-950/80 print:bg-gray-200 text-slate-400 print:text-black uppercase text-[11px] border-b border-slate-800 print:border-black">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Data</th>
                  <th className="py-2.5 px-3 font-bold">Dia da Semana</th>
                  <th className="py-2.5 px-3 font-bold">Turno</th>
                  <th className="py-2.5 px-3 font-bold">Horário</th>
                  <th className="py-2.5 px-3 font-bold">Setor / Posto</th>
                  <th className="py-2.5 px-3 font-bold">Policial Escalado</th>
                  <th className="py-2.5 px-3 font-bold">RE / Matrícula</th>
                  <th className="py-2.5 px-3 font-bold text-center">Ordem / Rodada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                {vagasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 print:text-gray-500 italic">
                      Nenhuma vaga escalada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  vagasFiltradas.flatMap((vaga) => {
                    const turno = turnos.find(t => t.id === vaga.turnoId);
                    const diaSemana = obterNomeDiaSemana(vaga.data);
                    const isFimDeSemana = diaSemana.includes('Sábado') || diaSemana.includes('Domingo');

                    return vaga.alocados.map((aloc, idx) => {
                      const policial = policiais.find(p => p.id === aloc.policialId);
                      return (
                        <tr 
                          key={`${vaga.id}-${idx}`}
                          className="hover:bg-slate-800/30 print:hover:bg-transparent transition-colors"
                        >
                          <td className="py-2 px-3 font-bold text-white print:text-black font-mono">
                            {formatarDataBr(vaga.data)}
                          </td>
                          <td className={`py-2 px-3 ${isFimDeSemana ? 'text-amber-400 print:text-black font-semibold' : 'text-slate-400 print:text-gray-700'}`}>
                            {diaSemana}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-semibold">{turno?.nome || vaga.turnoId}</span>
                          </td>
                          <td className="py-2 px-3 font-mono">
                            {vaga.horario}
                          </td>
                          <td className="py-2 px-3">
                            {vaga.setor}
                          </td>
                          <td className="py-2 px-3 font-bold text-white print:text-black">
                            {aloc.policialNome}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-300 print:text-black">
                            {aloc.policialRE}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="bg-slate-800 print:bg-gray-100 text-slate-300 print:text-black px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700 print:border-gray-300">
                              {policial ? `${policial.ordemEscolha}º` : '-'} (R{aloc.rodada})
                            </span>
                          </td>
                        </tr>
                      );
                    });
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Visão Matriz Geral de Escala */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] text-slate-300 print:text-black border-collapse">
              <thead>
                <tr className="bg-slate-950 print:bg-gray-200 border-b border-slate-800 print:border-black">
                  <th className="py-2 px-2 sticky left-0 bg-slate-950 print:bg-gray-200 z-10 w-44 font-bold border-r border-slate-800 print:border-black">
                    Policial / Servidor
                  </th>
                  <th className="py-2 px-1 text-center w-12 border-r border-slate-800 print:border-black">RE</th>
                  <th className="py-2 px-1 text-center w-10 border-r border-slate-800 print:border-black">Ord.</th>
                  {diasDoMes.map(d => (
                    <th key={d} className="py-2 px-1 text-center min-w-[28px] font-mono border-r border-slate-800/60 print:border-gray-300">
                      {d.split('-')[2]}
                    </th>
                  ))}
                  <th className="py-2 px-2 text-center font-bold bg-slate-950 print:bg-gray-200">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                {policiais
                  .sort((a, b) => a.ordemEscolha - b.ordemEscolha)
                  .map(policial => {
                    let totalAlocadas = 0;
                    return (
                      <tr key={policial.id} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                        <td className="py-1.5 px-2 font-semibold text-white print:text-black sticky left-0 bg-slate-900 print:bg-white z-10 border-r border-slate-800 print:border-black truncate max-w-[176px]">
                          {policial.nome}
                        </td>
                        <td className="py-1.5 px-1 font-mono text-[10px] text-slate-400 print:text-black text-center border-r border-slate-800 print:border-black">
                          {policial.re.replace('RE ', '')}
                        </td>
                        <td className="py-1.5 px-1 text-center font-bold text-blue-400 print:text-black border-r border-slate-800 print:border-black">
                          {policial.ordemEscolha}º
                        </td>
                        {diasDoMes.map(diaYmd => {
                          const vagaDoDia = vagas.find(v => v.data === diaYmd && v.alocados.some(a => a.policialId === policial.id));
                          if (vagaDoDia) {
                            totalAlocadas++;
                            const turno = turnos.find(t => t.id === vagaDoDia.turnoId);
                            return (
                              <td 
                                key={diaYmd} 
                                className="py-1 px-0.5 text-center bg-blue-600/30 print:bg-gray-300 border-r border-slate-800/60 print:border-gray-300"
                                title={`${formatarDataBr(diaYmd)}: ${turno?.nome} (${vagaDoDia.setor})`}
                              >
                                <span className="font-bold text-[10px] text-white print:text-black">
                                  {turno?.codigo || 'X'}
                                </span>
                              </td>
                            );
                          }
                          return (
                            <td key={diaYmd} className="py-1 px-0.5 text-center border-r border-slate-800/40 print:border-gray-200 text-slate-700 print:text-gray-300">
                              -
                            </td>
                          );
                        })}
                        <td className="py-1.5 px-2 text-center font-bold text-emerald-400 print:text-black">
                          {totalAlocadas}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* Rodapé Oficial para Assinaturas e Normas */}
        <div className="mt-12 pt-8 border-t-2 border-slate-700 print:border-black text-xs text-slate-400 print:text-black">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* Assinatura Chefe de Segurança */}
            <div>
              <div className="border-t border-slate-600 print:border-black pt-2 mx-auto max-w-xs">
                <strong className="block text-white print:text-black">{config.diretorSeguranca}</strong>
                <span className="text-[11px] text-slate-400 print:text-gray-600">Diretor do Centro de Segurança e Disciplina</span>
              </div>
            </div>

            {/* Certificação do Sistema */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-[11px] font-mono text-slate-400 print:text-black uppercase">
                Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </span>
              <span className="text-[10px] text-slate-400 print:text-black mt-0.5">
                Autenticidade garantida via Sistema Informatizado DEJEP
              </span>
            </div>

            {/* Assinatura Diretor Geral */}
            <div>
              <div className="border-t border-slate-600 print:border-black pt-2 mx-auto max-w-xs">
                <strong className="block text-white print:text-black">{config.diretorGeral}</strong>
                <span className="text-[11px] text-slate-400 print:text-gray-600">Diretor Geral da Unidade Prisional</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
