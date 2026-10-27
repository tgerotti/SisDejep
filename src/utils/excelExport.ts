import * as XLSX from 'xlsx';
import { Policial, VagaChefia, TurnoConfig, ConfiguracaoDejep, DistribuicaoLog } from '../types/dejep';
import { formatarDataBr } from './dejepEngine';

/**
 * Função para baixar diretamente o arquivo modelo oficial XLSX
 */
export function baixarArquivoModelo(tipo: 'chefia' | 'policial') {
  const nomeArquivo = tipo === 'chefia' 
    ? 'Modelo_Lista_DEJEP_Chefia.xlsx' 
    : 'Modelo_Lista_DEJEP_Policial.xlsx';
  
  const link = document.createElement('a');
  link.href = `/modelos/${nomeArquivo}`;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Normaliza qualquer formato de data (DD/MM/AAAA, AAAA-MM-DD ou serial do Excel) para YYYY-MM-DD
 */
function normalizarDataParaYmd(valor: any, mesAnoPadrao = '2026-11'): string {
  if (!valor) return `${mesAnoPadrao}-01`;

  // Se for número serial de data do Excel
  if (typeof valor === 'number') {
    const dataObj = XLSX.SSF.parse_date_code(valor);
    if (dataObj) {
      const y = dataObj.y;
      const m = String(dataObj.m).padStart(2, '0');
      const d = String(dataObj.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(valor).trim();

  // Se já for YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Se for DD/MM/AAAA
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Se for DD/MM
  if (/^\d{1,2}\/\d{1,2}$/.test(str)) {
    const [d, m] = str.split('/');
    const [anoPadrao] = mesAnoPadrao.split('-');
    return `${anoPadrao}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Se for apenas o dia número (ex: "7")
  if (/^\d{1,2}$/.test(str)) {
    const [ano, mes] = mesAnoPadrao.split('-');
    return `${ano}-${mes}-${str.padStart(2, '0')}`;
  }

  return str;
}

/**
 * Importa solicitações de vagas da Chefia a partir de uma planilha Excel
 * Suporta abas separadas por turno ou planilha única!
 */
export async function importarChefiaExcel(
  file: File, 
  turnos: TurnoConfig[], 
  mesAnoPadrao = '2026-11'
): Promise<VagaChefia[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const novasVagas: VagaChefia[] = [];
  let contador = 1;

  for (const sheetName of wb.SheetNames) {
    // Ignora abas de instrução
    if (sheetName.toLowerCase().includes('instruç') || sheetName.toLowerCase().includes('instruc')) {
      continue;
    }

    const ws = wb.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);

    // Tenta identificar o turno pela aba
    const turnoEncontrado = turnos.find(t => 
      sheetName.toLowerCase().includes(t.nome.toLowerCase()) ||
      sheetName.toLowerCase().includes(t.codigo.toLowerCase()) ||
      t.nome.toLowerCase().includes(sheetName.toLowerCase())
    );

    const defaultTurnoId = turnoEncontrado ? turnoEncontrado.id : (turnos[0]?.id || 't1');

    for (const row of rows) {
      // Procura campos flexíveis
      const dataRaw = row['Data'] || row['DATA'] || row['Data da Vaga'] || row['data'];
      if (!dataRaw) continue;

      const dataFormatada = normalizarDataParaYmd(dataRaw, mesAnoPadrao);
      const horario = row['Horario'] || row['Horário'] || row['HORARIO'] || turnoEncontrado?.horarioPadrao || '06:00 - 14:00';
      const setor = row['Setor_Posto'] || row['Setor / Posto'] || row['Setor'] || row['Posto'] || 'Reforço Geral';
      const vagasSolicitadas = parseInt(row['Vagas_Solicitadas'] || row['Vagas Solicitadas'] || row['Vagas'] || 1, 10) || 1;
      const prioridadeRaw = String(row['Prioridade'] || 'normal').toLowerCase();
      const prioridade = (prioridadeRaw === 'alta' || prioridadeRaw === 'urgente') ? prioridadeRaw : 'normal';
      const observacoes = row['Observacoes'] || row['Observações'] || '';

      // Turno especificado na linha ou pelo nome da aba
      let turnoIdLinha = defaultTurnoId;
      const turnoLinhaNome = row['Turno'] || row['TURNO'];
      if (turnoLinhaNome) {
        const tMatch = turnos.find(t => t.nome.toLowerCase().includes(String(turnoLinhaNome).toLowerCase()) || t.codigo.toLowerCase() === String(turnoLinhaNome).toLowerCase());
        if (tMatch) turnoIdLinha = tMatch.id;
      }

      novasVagas.push({
        id: `vaga-imp-${Date.now()}-${contador++}`,
        turnoId: turnoIdLinha,
        data: dataFormatada,
        horario: String(horario).trim(),
        setor: String(setor).trim(),
        vagasSolicitadas,
        alocados: [],
        prioridade,
        observacoes: String(observacoes).trim()
      });
    }
  }

  return novasVagas;
}

/**
 * Importa policiais aptos a partir de uma planilha Excel
 * Valida Ordem de Escolha e lista de 5 a 10 datas disponibilizadas
 */
export async function importarPoliciaisExcel(
  file: File, 
  mesAnoPadrao = '2026-11'
): Promise<Policial[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const novosPoliciais: Policial[] = [];

  // Pega a primeira aba válida (não instruções)
  let sheetName = wb.SheetNames[0];
  for (const s of wb.SheetNames) {
    if (!s.toLowerCase().includes('instruç') && !s.toLowerCase().includes('instruc')) {
      sheetName = s;
      break;
    }
  }

  const ws = wb.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(ws);

  let ordemAuto = 1;

  for (const row of rows) {
    const nome = row['Nome Completo'] || row['Nome'] || row['NOME'] || row['Servidor'];
    if (!nome) continue;

    const re = row['RE / Matrícula'] || row['RE'] || row['Matrícula'] || `RE ${Math.floor(100000 + Math.random() * 900000)}`;
    const cargo = row['Cargo / Posto'] || row['Cargo'] || 'Policial Penal - Classe II';
    const turnoOrigem = row['Turno de Origem'] || row['Turno'] || 'Turno 1 (Alfa)';
    const ordemRaw = parseInt(row['Ordem de Escolha'] || row['Ordem'] || ordemAuto, 10);
    const ordemEscolha = isNaN(ordemRaw) ? ordemAuto : ordemRaw;
    ordemAuto++;

    const maxDejepMes = parseInt(row['Limite Máx DEJEP'] || row['Limite Max DEJEP'] || row['Max DEJEP'] || 8, 10) || 8;
    const statusRaw = String(row['Status'] || 'Apto').toLowerCase();
    const ativo = !statusRaw.includes('inapto') && !statusRaw.includes('licença') && !statusRaw.includes('afastado');
    const telefone = row['Telefone'] || '';

    // Extrai e normaliza as datas disponibilizadas (separadas por vírgula, ponto e vírgula ou traço)
    const datasRaw = row['Datas Disponibilizadas (5 a 10 datas)'] || row['Datas Disponibilizadas'] || row['Datas'] || '';
    const pedacos = String(datasRaw).split(/[,;|\n]+/).map(s => s.trim()).filter(Boolean);
    const datasNormalizadas = Array.from(new Set(pedacos.map(d => normalizarDataParaYmd(d, mesAnoPadrao)))).sort();

    novosPoliciais.push({
      id: `pol-imp-${Date.now()}-${ordemAuto}`,
      ordemEscolha,
      nome: String(nome).trim(),
      re: String(re).trim(),
      cargo: String(cargo).trim(),
      turnoOrigem: String(turnoOrigem).trim(),
      datasDisponiveis: datasNormalizadas,
      maxDejepMes,
      ativo,
      telefone: String(telefone).trim()
    });
  }

  // Ordena por ordem de escolha
  return novosPoliciais.sort((a, b) => a.ordemEscolha - b.ordemEscolha);
}

/**
 * Exporta a Lista da Chefia para Excel com abas separadas para cada turno!
 */
export function exportarChefiaExcel(vagas: VagaChefia[], turnos: TurnoConfig[], mesAno: string) {
  const wb = XLSX.utils.book_new();

  // Aba Consolidada (Todas as vagas)
  const dadosGerais = vagas.map(v => {
    const turno = turnos.find(t => t.id === v.turnoId);
    return {
      'Data': formatarDataBr(v.data),
      'Turno': turno?.nome || v.turnoId,
      'Horário': v.horario,
      'Setor / Posto': v.setor,
      'Vagas Solicitadas': v.vagasSolicitadas,
      'Vagas Preenchidas': v.alocados.length,
      'Status': v.alocados.length >= v.vagasSolicitadas ? 'Preenchida' : v.alocados.length > 0 ? 'Parcial' : 'Aberta',
      'Policiais Escalados': v.alocados.map(a => `${a.policialNome} (${a.policialRE})`).join('; '),
      'Observações': v.observacoes || ''
    };
  });
  const wsGeral = XLSX.utils.json_to_sheet(dadosGerais);
  XLSX.utils.book_append_sheet(wb, wsGeral, 'Geral - Todas Vagas');

  // Abas separadas para cada turno conforme especificação!
  turnos.forEach(turno => {
    const vagasTurno = vagas.filter(v => v.turnoId === turno.id);
    const dadosTurno = vagasTurno.map(v => ({
      'Data': formatarDataBr(v.data),
      'Horário': v.horario,
      'Setor / Posto': v.setor,
      'Vagas Solicitadas': v.vagasSolicitadas,
      'Vagas Preenchidas': v.alocados.length,
      'Status': v.alocados.length >= v.vagasSolicitadas ? 'Preenchida' : v.alocados.length > 0 ? 'Parcial' : 'Aberta',
      'Policiais Escalados': v.alocados.map(a => `${a.policialNome} (${a.policialRE})`).join('; '),
      'Observações': v.observacoes || ''
    }));

    const wsTurno = XLSX.utils.json_to_sheet(dadosTurno);
    const nomeAba = turno.nome.substring(0, 30).replace(/[/\\?*[\]]/g, '-');
    XLSX.utils.book_append_sheet(wb, wsTurno, nomeAba);
  });

  XLSX.writeFile(wb, `DEJEP_Lista_Chefia_${mesAno}.xlsx`);
}

/**
 * Exporta a Lista de Policiais com Ordem de Escolha e Datas para Excel
 */
export function exportarPoliciaisExcel(policiais: Policial[], mesAno: string) {
  const wb = XLSX.utils.book_new();

  const dados = [...policiais]
    .sort((a, b) => a.ordemEscolha - b.ordemEscolha)
    .map(p => ({
      'Ordem de Escolha': p.ordemEscolha,
      'Nome Completo': p.nome,
      'RE / Matrícula': p.re,
      'Cargo / Posto': p.cargo,
      'Turno de Origem': p.turnoOrigem,
      'Qtd Datas Disponibilizadas': p.datasDisponiveis.length,
      'Datas Disponibilizadas': p.datasDisponiveis.map(d => formatarDataBr(d)).join(', '),
      'Limite Máx DEJEP': p.maxDejepMes,
      'Status': p.ativo ? 'Apto' : 'Inapto / Afastado',
      'Telefone': p.telefone || ''
    }));

  const ws = XLSX.utils.json_to_sheet(dados);
  XLSX.utils.book_append_sheet(wb, ws, 'Lista Policiais Aptos');
  XLSX.writeFile(wb, `DEJEP_Lista_Policiais_${mesAno}.xlsx`);
}

/**
 * Exporta Mapa Completo de Escala Oficial com Estatísticas e Auditoria
 */
export function exportarEscalaOficialExcel(
  vagas: VagaChefia[],
  policiais: Policial[],
  turnos: TurnoConfig[],
  logs: DistribuicaoLog[],
  config: ConfiguracaoDejep
) {
  const wb = XLSX.utils.book_new();

  // 1. Escala Final
  const dadosEscala: any[] = [];
  vagas.forEach(v => {
    const turno = turnos.find(t => t.id === v.turnoId);
    if (v.alocados.length === 0) {
      dadosEscala.push({
        'Data': formatarDataBr(v.data),
        'Turno': turno?.nome || v.turnoId,
        'Horário': v.horario,
        'Setor': v.setor,
        'Ordem Escolha': '-',
        'Policial Escalado': 'NÃO PREENCHIDA',
        'RE': '-',
        'Rodada': '-'
      });
    } else {
      v.alocados.forEach(aloc => {
        const pol = policiais.find(p => p.id === aloc.policialId);
        dadosEscala.push({
          'Data': formatarDataBr(v.data),
          'Turno': turno?.nome || v.turnoId,
          'Horário': v.horario,
          'Setor': v.setor,
          'Ordem Escolha': pol ? `${pol.ordemEscolha}º` : '-',
          'Policial Escalado': aloc.policialNome,
          'RE': aloc.policialRE,
          'Rodada de Escolha': `Rodada ${aloc.rodada}`
        });
      });
    }
  });

  const wsEscala = XLSX.utils.json_to_sheet(dadosEscala);
  XLSX.utils.book_append_sheet(wb, wsEscala, 'Escala Oficial DEJEP');

  // 2. Resumo por Servidor
  const resumoServidores = policiais.map(p => {
    let count = 0;
    const datasAlocadas: string[] = [];
    vagas.forEach(v => {
      v.alocados.forEach(a => {
        if (a.policialId === p.id) {
          count++;
          datasAlocadas.push(formatarDataBr(v.data));
        }
      });
    });

    return {
      'Ordem Escolha': p.ordemEscolha,
      'Policial': p.nome,
      'RE': p.re,
      'Turno Origem': p.turnoOrigem,
      'Datas Disponibilizadas (Qtd)': p.datasDisponiveis.length,
      'DEJEPs Atribuídas': count,
      'Datas Alocadas': datasAlocadas.join(', ')
    };
  });

  const wsServidores = XLSX.utils.json_to_sheet(resumoServidores);
  XLSX.utils.book_append_sheet(wb, wsServidores, 'Resumo por Policial');

  // 3. Log de Auditoria (Regra 01)
  const dadosAudit = logs.map(l => ({
    'Passo': l.passo,
    'Rodada': l.rodada,
    'Ordem Policial': `${l.ordemPolicial}º`,
    'Policial': l.policialNome,
    'RE': l.policialRE,
    'Data Atribuída': l.data ? formatarDataBr(l.data) : '-',
    'Turno': l.turnoNome || '-',
    'Setor': l.setor || '-',
    'Status': l.sucesso ? 'ALOCADO' : 'SEM VAGA',
    'Justificativa / Motivo': l.motivo
  }));

  const wsAudit = XLSX.utils.json_to_sheet(dadosAudit);
  XLSX.utils.book_append_sheet(wb, wsAudit, 'Auditoria Regra 01');

  XLSX.writeFile(wb, `DEJEP_Mapa_Oficial_${config.mesAnoAtual}.xlsx`);
}
