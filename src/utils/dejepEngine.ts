import { Policial, VagaChefia, DistribuicaoLog, EstatisticasDistribuicao, TurnoConfig } from '../types/dejep';

export interface ResultadoDistribuicao {
  vagasAtualizadas: VagaChefia[];
  policiaisAtualizados: Policial[];
  logs: DistribuicaoLog[];
  estatisticas: EstatisticasDistribuicao;
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

  // Loop de Rodadas
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

      // Encontra vagas da chefia nessas datas candidatas que ainda têm vagas abertas
      // Prioridade: Vagas com menos alocados ou datas mais próximas, evitando conflitos
      const vagasDisponiveis = vagas.filter(v => {
        if (!datasCandidatas.includes(v.data)) return false;
        return v.alocados.length < v.vagasSolicitadas;
      });

      if (vagasDisponiveis.length === 0) {
        // Nenhuma vaga aberta nas datas disponibilizadas pelo servidor nesta rodada
        logs.push({
          id: `log-${passo++}`,
          rodada,
          passo,
          ordemPolicial: policial.ordemEscolha,
          policialId: policial.id,
          policialNome: policial.nome,
          policialRE: policial.re,
          sucesso: false,
          motivo: `Sem vagas abertas da Chefia coincidentes com as ${datasCandidatas.length} datas restantes do policial nesta rodada.`,
          timestamp: new Date().toISOString()
        });
        continue;
      }

      // Critério de escolha do policial:
      // Seleciona a vaga ideal (preferência pela primeira data cronológica ou vaga com prioridade alta)
      vagasDisponiveis.sort((a, b) => {
        if (a.prioridade === 'urgente' && b.prioridade !== 'urgente') return -1;
        if (b.prioridade === 'urgente' && a.prioridade !== 'urgente') return 1;
        return a.data.localeCompare(b.data);
      });

      const vagaEscolhida = vagasDisponiveis[0];

      // Realiza a alocação
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
        motivo: `Alocado com sucesso na data ${formatarDataBr(vagaEscolhida.data)} - ${nomeTurno} (${vagaEscolhida.setor})`,
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
 * 
 * Exemplo:
 * Mês N:
 *   1º Policial A
 *   2º Policial B
 *   3º Policial C
 *   4º Policial D
 * 
 * Mês N+1:
 *   1º Policial B
 *   2º Policial C
 *   3º Policial D
 *   4º Policial A  (o 1º foi para o último lugar!)
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
