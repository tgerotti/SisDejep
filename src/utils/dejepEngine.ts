import { Policial, VagaChefia, DistribuicaoLog, EstatisticasDistribuicao, TurnoConfig } from '../types/dejep';

export interface ResultadoDistribuicao {
  vagasAtualizadas: VagaChefia[];
  policiaisAtualizados: Policial[];
  logs: DistribuicaoLog[];
  estatisticas: EstatisticasDistribuicao;
}

export type TurnoCanônico = 'I' | 'II' | 'III' | 'IV' | 'DIARISTA';

/**
 * Identifica o turno canônico a partir de qualquer string, código ou ID
 */
export function identificarTurnoCanonico(turnoStrOrId: string): TurnoCanônico | null {
  if (!turnoStrOrId) return null;
  const s = turnoStrOrId.toString().trim().toLowerCase();

  // Diaristas (07h às 16h seg-sex)
  if (
    s.includes('diar') || 
    s.includes('adm') || 
    s === 'dia' ||
    s.includes('comercial') ||
    s.includes('escolta')
  ) {
    return 'DIARISTA';
  }

  // Turno III (Diurno 07h às 19h) - testar antes de I e II
  if (
    s === 't3' || 
    s === 'iii' || 
    s.includes('turno iii') || 
    s.includes('turno 3') || 
    s.includes('charlie') || 
    s === '3'
  ) {
    return 'III';
  }

  // Turno IV ou VI (Noturno 19h às 07h)
  if (
    s === 't4' || 
    s === 'iv' || 
    s === 'vi' || 
    s.includes('turno iv') || 
    s.includes('turno vi') || 
    s.includes('turno 4') || 
    s.includes('delta') || 
    s === '4'
  ) {
    return 'IV';
  }

  // Turno II (Noturno 19h às 07h)
  if (
    s === 't2' || 
    s === 'ii' || 
    s.includes('turno ii') || 
    s.includes('turno 2') || 
    s.includes('bravo') || 
    s === '2'
  ) {
    return 'II';
  }

  // Turno I (Diurno 07h às 19h)
  if (
    s === 't1' || 
    s === 'i' || 
    s.includes('turno i') || 
    s.includes('turno 1') || 
    s.includes('alfa') || 
    s === '1'
  ) {
    return 'I';
  }

  return null;
}

export function formatarTurnoNome(canonico: TurnoCanônico | null): string {
  switch (canonico) {
    case 'I': return 'Turno I (07h às 19h - Diurno)';
    case 'II': return 'Turno II (19h às 07h - Noturno)';
    case 'III': return 'Turno III (07h às 19h - Diurno)';
    case 'IV': return 'Turno IV (19h às 07h - Noturno)';
    case 'DIARISTA': return 'Diaristas (07h às 16h - Seg a Sex)';
    default: return 'Turno Não Identificado';
  }
}

export interface ValidacaoCompatibilidade {
  permitido: boolean;
  motivo?: string;
  diaSemanaNome?: string;
  diaSemanaNum?: number;
}

/**
 * Validação rigorosa das Regras de Turno para DEJEP:
 * - Turno I e III são diurnos (07h às 19h)
 * - Turno II e IV são noturnos (19h às 07h)
 * - Diaristas são diurnos de segunda a sexta no horário comercial (07h às 16h)
 *
 * Compatibilidade:
 * - Policial Turno I: pode fazer nos turnos II, III e IV (não no Turno I)
 * - Policial Turno II: pode fazer nos turnos I, III e IV (não no Turno II)
 * - Policial Turno III: pode fazer nos turnos I, II e IV (não no Turno III)
 * - Policial Turno IV: pode fazer nos turnos I, II e III (não no Turno IV)
 * - Policial Diarista: pode fazer nos turnos I, II, III e IV, sendo:
 *     - Nos Turnos II e IV (noturnos): APENAS sexta e sábado
 *     - Nos Turnos I e III (diurnos): APENAS sábado e domingo
 */
export function validarCompatibilidadeTurnoDejep(
  policialTurnoStr: string,
  vagaTurnoStrOrId: string,
  vagaData: string
): ValidacaoCompatibilidade {
  const turnoPolicial = identificarTurnoCanonico(policialTurnoStr);
  const turnoVaga = identificarTurnoCanonico(vagaTurnoStrOrId);

  // Parse dia da semana (0 = Domingo, 1 = Segunda, ..., 5 = Sexta, 6 = Sábado)
  let diaSemana = 0;
  let diaSemanaNome = '';
  const diasNomes = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  if (vagaData) {
    const partes = vagaData.split('-').map(Number);
    if (partes.length === 3) {
      const dataObj = new Date(partes[0], partes[1] - 1, partes[2]);
      diaSemana = dataObj.getDay();
      diaSemanaNome = diasNomes[diaSemana] || '';
    }
  }

  // Se não foi possível mapear canonicamente, compara texto puro
  if (!turnoPolicial || !turnoVaga) {
    if (policialTurnoStr && vagaTurnoStrOrId && policialTurnoStr.toLowerCase() === vagaTurnoStrOrId.toLowerCase()) {
      return {
        permitido: false,
        motivo: `Policial não pode fazer DEJEP no seu próprio turno de trabalho (${policialTurnoStr}).`,
        diaSemanaNome,
        diaSemanaNum: diaSemana
      };
    }
    return { permitido: true, diaSemanaNome, diaSemanaNum: diaSemana };
  }

  // 1. Proibição Universal: Policial NUNCA faz DEJEP no seu próprio turno de trabalho
  if (turnoPolicial === turnoVaga) {
    return {
      permitido: false,
      motivo: `Policial do ${formatarTurnoNome(turnoPolicial)} não pode atuar em DEJEP no seu próprio turno (${formatarTurnoNome(turnoVaga)}).`,
      diaSemanaNome,
      diaSemanaNum: diaSemana
    };
  }

  // 2. Não existe DEJEP na escala de Diarista (DEJEP é restrita aos plantões operacionais I, II, III e IV)
  if (turnoVaga === 'DIARISTA') {
    return {
      permitido: false,
      motivo: `DEJEP é restrita aos plantões operacionais de segurança (Turnos I, II, III e IV).`,
      diaSemanaNome,
      diaSemanaNum: diaSemana
    };
  }

  // 3. Regra dos DIARISTAS:
  // "O Policial que trabalha no turno diarista pode fazer DEJEP nos turnos I, II, III e IV, 
  //  nos Turnos II e IV, nos dias da semana sexta e sábado, 
  //  nos Turnos I e III, nos dias da semana sábado e domingo"
  if (turnoPolicial === 'DIARISTA') {
    // Turnos II e IV (Noturnos - 19h às 07h): apenas Sexta (5) e Sábado (6)
    if (turnoVaga === 'II' || turnoVaga === 'IV') {
      const diaPermitido = (diaSemana === 5 || diaSemana === 6);
      if (!diaPermitido) {
        return {
          permitido: false,
          diaSemanaNome,
          diaSemanaNum: diaSemana,
          motivo: `Diaristas só podem realizar DEJEP noturna (Turnos II e IV) às sextas-feiras e sábados (${vagaData} é ${diaSemanaNome}).`
        };
      }
      return { permitido: true, diaSemanaNome, diaSemanaNum: diaSemana };
    }

    // Turnos I e III (Diurnos - 07h às 19h): apenas Sábado (6) e Domingo (0)
    if (turnoVaga === 'I' || turnoVaga === 'III') {
      const diaPermitido = (diaSemana === 6 || diaSemana === 0);
      if (!diaPermitido) {
        return {
          permitido: false,
          diaSemanaNome,
          diaSemanaNum: diaSemana,
          motivo: `Diaristas só podem realizar DEJEP diurna (Turnos I e III) aos sábados e domingos (${vagaData} é ${diaSemanaNome}).`
        };
      }
      return { permitido: true, diaSemanaNome, diaSemanaNum: diaSemana };
    }
  }

  // 4. Policial do Turno I: pode fazer DEJEP nos turnos II, III e IV
  if (turnoPolicial === 'I') {
    if (['II', 'III', 'IV'].includes(turnoVaga)) {
      return { permitido: true, diaSemanaNome, diaSemanaNum: diaSemana };
    }
    return {
      permitido: false,
      diaSemanaNome,
      diaSemanaNum: diaSemana,
      motivo: `Policial do Turno I só pode fazer DEJEP nos Turnos II, III e IV.`
    };
  }

  // 5. Policial do Turno II: pode fazer DEJEP nos turnos I, III e IV
  if (turnoPolicial === 'II') {
    if (['I', 'III', 'IV'].includes(turnoVaga)) {
      return { permitido: true, diaSemanaNome, diaSemanaNum: diaSemana };
    }
    return {
      permitido: false,
      diaSemanaNome,
      diaSemanaNum: diaSemana,
      motivo: `Policial do Turno II só pode fazer DEJEP nos Turnos I, III e IV.`
    };
  }

  // 6. Policial do Turno III: pode fazer DEJEP nos turnos I, II e IV
  if (turnoPolicial === 'III') {
    if (['I', 'II', 'IV'].includes(turnoVaga)) {
      return { permitido: true, diaSemanaNome, diaSemanaNum: diaSemana };
    }
    return {
      permitido: false,
      diaSemanaNome,
      diaSemanaNum: diaSemana,
      motivo: `Policial do Turno III só pode fazer DEJEP nos Turnos I, II e IV.`
    };
  }

  // 7. Policial do Turno IV: pode fazer DEJEP nos turnos I, II e III
  if (turnoPolicial === 'IV') {
    if (['I', 'II', 'III'].includes(turnoVaga)) {
      return { permitido: true, diaSemanaNome, diaSemanaNum: diaSemana };
    }
    return {
      permitido: false,
      diaSemanaNome,
      diaSemanaNum: diaSemana,
      motivo: `Policial do Turno IV só pode fazer DEJEP nos Turnos I, II e III.`
    };
  }

  return { permitido: true, diaSemanaNome, diaSemanaNum: diaSemana };
}

/**
 * Valida se a lista de datas do policial cumpre a exigência de 5 a 10 datas
 */
export function validarDatasPolicial(datas: string[], min = 5, max = 10): { valido: boolean; mensagem: string } {
  const unicas = Array.from(new Set(datas));
  if (unicas.length < min) {
    return {
      valido: false,
      mensagem: `O policial deve disponibilizar no mínimo ${min} datas (atual: ${unicas.length}).`
    };
  }
  if (unicas.length > max) {
    return {
      valido: false,
      mensagem: `O policial deve disponibilizar no máximo ${max} datas (atual: ${unicas.length}).`
    };
  }
  return { valido: true, mensagem: `Datas válidas (${unicas.length} datas selecionadas).` };
}

/**
 * Executa a Distribuição Oficial de DEJEP conforme a Regra 01:
 * - Respeita rigorosamente a Ordem de Escolha dos Policiais (1º, 2º, 3º...)
 * - Processa em rodadas sucessivas (Rodada 1: 1ª vaga de cada um, Rodada 2: 2ª vaga, etc.)
 * - Policial só pode ser alocado em data que ele próprio disponibilizou (entre as 5 a 10 datas)
 * - Proibida dupla alocação no mesmo dia para o mesmo servidor
 * - Respeita as Regras Estritas de Turno:
 *     - Policial Turno I -> vagas nos Turnos II, III e IV
 *     - Policial Turno II -> vagas nos Turnos I, III e IV
 *     - Policial Turno III -> vagas nos Turnos I, II e IV
 *     - Policial Turno IV -> vagas nos Turnos I, II e III
 *     - Policial Diarista -> vagas nos Turnos II e IV (sextas e sábados) ou I e III (sábados e domingos)
 * - Respeita o teto mensal por policial (default 8 diárias) e a quantidade de vagas da Chefia
 */
export function executarDistribuicaoRegra01(
  vagasOriginais: VagaChefia[],
  policiaisOriginais: Policial[],
  turnos: TurnoConfig[],
  limiteMaximoPadrao = 8
): ResultadoDistribuicao {
  // Deep clone para não mutar estado original diretamente
  const vagas: VagaChefia[] = vagasOriginais.map(v => ({
    ...v,
    alocados: [] // reinicia alocações para uma distribuição limpa e auditável
  }));

  // Ordena policiais estritamente pela Ordem de Escolha (crescente: 1, 2, 3...)
  const policiais = [...policiaisOriginais]
    .filter(p => p.ativo)
    .sort((a, b) => a.ordemEscolha - b.ordemEscolha);

  const logs: DistribuicaoLog[] = [];
  let rodada = 1;
  let houveAlocacaoNaRodada = true;
  let passo = 1;

  // Mapa de controle: policialId -> Set de datas onde já possui DEJEP
  const alocacoesPolicialPorData = new Map<string, Set<string>>();
  // Mapa de controle: policialId -> quantidade total de DEJEPs atribuídas
  const totalDejepPorPolicial = new Map<string, number>();

  policiais.forEach(p => {
    alocacoesPolicialPorData.set(p.id, new Set<string>());
    totalDejepPorPolicial.set(p.id, 0);
  });

  const mapaTurnos = new Map<string, string>();
  turnos.forEach(t => mapaTurnos.set(t.id, t.nome));

  // Loop de Rodadas Sucessivas
  while (houveAlocacaoNaRodada && rodada <= limiteMaximoPadrao) {
    houveAlocacaoNaRodada = false;

    for (const policial of policiais) {
      const totalAtual = totalDejepPorPolicial.get(policial.id) || 0;
      const limitePolicial = Math.min(policial.maxDejepMes || limiteMaximoPadrao, limiteMaximoPadrao);

      // Se já atingiu o teto
      if (totalAtual >= limitePolicial) {
        continue;
      }

      // Procura vagas disponíveis compatíveis com as datas disponibilizadas pelo policial
      const datasDisponiveis = policial.datasDisponiveis || [];
      const datasJaAlocadas = alocacoesPolicialPorData.get(policial.id)!;

      // Filtra datas que o policial tem disponível E onde ele ainda não possui DEJEP
      const datasCandidatas = datasDisponiveis.filter(d => !datasJaAlocadas.has(d));

      if (datasCandidatas.length === 0) {
        // Policial não tem mais datas livres para esta rodada
        continue;
      }

      // Encontra vagas abertas da chefia nessas datas que atendem às regras estritas de turno
      const vagasCompativeis = vagas.filter(v => {
        if (!datasCandidatas.includes(v.data)) return false;
        if (v.alocados.length >= v.vagasSolicitadas) return false;

        // Validação das Regras Estritas de Turno e Dias da Semana
        const checagem = validarCompatibilidadeTurnoDejep(policial.turnoOrigem, v.turnoId, v.data);
        return checagem.permitido;
      });

      if (vagasCompativeis.length === 0) {
        // Analisa se havia vagas abertas mas que foram impedidas pelas regras de turno
        const vagasAbertasNasDatas = vagas.filter(v => 
          datasCandidatas.includes(v.data) && v.alocados.length < v.vagasSolicitadas
        );

        let motivo = `Sem vagas abertas da Chefia coincidentes com as ${datasCandidatas.length} datas restantes do policial nesta rodada.`;
        if (vagasAbertasNasDatas.length > 0) {
          const primeiroBloqueio = validarCompatibilidadeTurnoDejep(
            policial.turnoOrigem, 
            vagasAbertasNasDatas[0].turnoId, 
            vagasAbertasNasDatas[0].data
          );
          motivo = `Regra de Turno: ${primeiroBloqueio.motivo || 'incompatível entre turno de origem e vaga disponível'}`;
        }

        logs.push({
          id: `log-${passo++}`,
          rodada,
          passo,
          ordemPolicial: policial.ordemEscolha,
          policialId: policial.id,
          policialNome: policial.nome,
          policialRE: policial.re,
          sucesso: false,
          motivo,
          timestamp: new Date().toISOString()
        });
        continue;
      }

      // Critério de escolha do policial:
      // Prioridade: urgente primeiro, depois ordem cronológica da data
      vagasCompativeis.sort((a, b) => {
        if (a.prioridade === 'urgente' && b.prioridade !== 'urgente') return -1;
        if (b.prioridade === 'urgente' && a.prioridade !== 'urgente') return 1;
        return a.data.localeCompare(b.data);
      });

      const vagaEscolhida = vagasCompativeis[0];

      // Realiza a alocação oficial
      vagaEscolhida.alocados.push({
        policialId: policial.id,
        policialNome: policial.nome,
        policialRE: policial.re,
        rodada,
        dataHoraAlocacao: new Date().toISOString()
      });

      datasJaAlocadas.add(vagaEscolhida.data);
      totalDejepPorPolicial.set(policial.id, totalAtual + 1);
      houveAlocacaoNaRodada = true;

      const nomeTurno = mapaTurnos.get(vagaEscolhida.turnoId) || vagaEscolhida.turnoId;
      const partes = vagaEscolhida.data.split('-').map(Number);
      const diaObj = new Date(partes[0], partes[1] - 1, partes[2]);
      const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const diaSemana = diasNomes[diaObj.getDay()] || '';

      logs.push({
        id: `log-${passo++}`,
        rodada,
        passo,
        ordemPolicial: policial.ordemEscolha,
        policialId: policial.id,
        policialNome: policial.nome,
        policialRE: policial.re,
        vagaId: vagaEscolhida.id,
        data: vagaEscolhida.data,
        turnoNome: nomeTurno,
        setor: vagaEscolhida.setor,
        sucesso: true,
        motivo: `Alocado com sucesso: ${formatarDataBr(vagaEscolhida.data)} (${diaSemana}) no ${nomeTurno} (${vagaEscolhida.setor}) [Regra atendida: ${policial.turnoOrigem}]`,
        timestamp: new Date().toISOString()
      });
    }

    if (houveAlocacaoNaRodada) {
      rodada++;
    }
  }

  // Estatísticas finais
  let totalSolicitadas = 0;
  let totalPreenchidas = 0;

  vagas.forEach(v => {
    totalSolicitadas += v.vagasSolicitadas;
    totalPreenchidas += v.alocados.length;
  });

  const totalAtendidos = Array.from(totalDejepPorPolicial.values()).filter(q => q > 0).length;

  const estatisticas: EstatisticasDistribuicao = {
    totalVagasSolicitadas: totalSolicitadas,
    totalVagasPreenchidas: totalPreenchidas,
    totalVagasNaoPreenchidas: Math.max(0, totalSolicitadas - totalPreenchidas),
    totalPoliciaisAptos: policiais.length,
    totalPoliciaisAtendidos: totalAtendidos,
    totalDejepDistribuidas: totalPreenchidas,
    rodadasExecutadas: Math.max(1, rodada - 1),
    taxaAtendimento: totalSolicitadas > 0 ? Math.round((totalPreenchidas / totalSolicitadas) * 100) : 0
  };

  return {
    vagasAtualizadas: vagas,
    policiaisAtualizados: policiaisOriginais,
    logs,
    estatisticas
  };
}

/**
 * Regra de Rotatividade Mensal:
 * "o policial que escolher primeiro neste mês é o ultimo no próximo e assim por diante."
 */
export function rotacionarOrdemProximoMes(policiais: Policial[], limparDatas = true): Policial[] {
  if (policiais.length <= 1) return [...policiais];

  // Ordena por ordem atual
  const listaOrdenada = [...policiais].sort((a, b) => a.ordemEscolha - b.ordemEscolha);

  // O primeiro elemento vai para o final
  const primeiro = listaOrdenada[0];
  const restante = listaOrdenada.slice(1);
  const novaFila = [...restante, primeiro];

  // Reatribui as ordens de 1 até N
  return novaFila.map((p, index) => ({
    ...p,
    ordemEscolha: index + 1,
    // Limpa as datas para que o policial preencha as novas 5 a 10 datas do novo mês
    datasDisponiveis: limparDatas ? [] : p.datasDisponiveis
  }));
}

/**
 * Reordena manualmente a lista de policiais (caso a chefia precise inserir novo servidor ou ajustar)
 */
export function reordenarPoliciais(policiais: Policial[], policialId: string, novaPosicao: number): Policial[] {
  const lista = [...policiais].sort((a, b) => a.ordemEscolha - b.ordemEscolha);
  const indexAtual = lista.findIndex(p => p.id === policialId);
  if (indexAtual === -1) return policiais;

  const [item] = lista.splice(indexAtual, 1);
  const posicaoAjustada = Math.max(0, Math.min(novaPosicao - 1, lista.length));
  lista.splice(posicaoAjustada, 0, item);

  return lista.map((p, idx) => ({
    ...p,
    ordemEscolha: idx + 1
  }));
}

export function formatarDataBr(dataYmd: string): string {
  if (!dataYmd) return '';
  const partes = dataYmd.split('-');
  if (partes.length !== 3) return dataYmd;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function obterDiasDoMes(anoMes: string): string[] {
  const [ano, mes] = anoMes.split('-').map(Number);
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const dias: string[] = [];
  for (let d = 1; d <= diasNoMes; d++) {
    const diaFormatado = String(d).padStart(2, '0');
    const mesFormatado = String(mes).padStart(2, '0');
    dias.push(`${ano}-${mesFormatado}-${diaFormatado}`);
  }
  return dias;
}
