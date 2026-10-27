import { ConfiguracaoDejep, Policial, TurnoConfig, VagaChefia } from '../types/dejep';

export const TURNOS_PADRAO: TurnoConfig[] = [
  {
    id: 't1',
    codigo: 'T1',
    nome: 'Turno 1 (Alfa)',
    horarioPadrao: '06:00 - 14:00',
    cor: 'blue',
    chefeNome: 'Chefe de Turno Inspetor Marcos Silveira'
  },
  {
    id: 't2',
    codigo: 'T2',
    nome: 'Turno 2 (Bravo)',
    horarioPadrao: '14:00 - 22:00',
    cor: 'emerald',
    chefeNome: 'Chefe de Turno Subtenente Valter Prado'
  },
  {
    id: 't3',
    codigo: 'T3',
    nome: 'Turno 3 (Charlie)',
    horarioPadrao: '22:00 - 06:00',
    cor: 'purple',
    chefeNome: 'Chefe de Turno Renato Albuquerque'
  },
  {
    id: 't4',
    codigo: 'T4',
    nome: 'Turno 4 (Delta)',
    horarioPadrao: '07:00 - 19:00',
    cor: 'amber',
    chefeNome: 'Chefe de Turno Eduardo Ferreira'
  },
  {
    id: 'adm',
    codigo: 'ADM',
    nome: 'Administrativo / Escolta',
    horarioPadrao: '08:00 - 16:00',
    cor: 'slate',
    chefeNome: 'Coord. de Escolta e Apoio Operacional'
  }
];

export const CONFIG_INICIAL: ConfiguracaoDejep = {
  unidadePrisional: 'Penitenciária Estadual de Regime Fechado - Unidade Central',
  diretorGeral: 'Dr. Fernando Vasconcellos - Diretor Geral',
  diretorSeguranca: 'Inspetor Chefe Rogério Magalhães - Chefe de Segurança e Disciplina',
  mesAnoAtual: '2026-11',
  limitePadraoDejep: 8,
  minDatasObrigatorias: 5,
  maxDatasObrigatorias: 10,
  turnos: TURNOS_PADRAO
};

export function gerarVagasIniciais(mesAno = '2026-11'): VagaChefia[] {
  const vagas: VagaChefia[] = [];
  let idContador = 1;

  // Turno 1 (Alfa) - Solicitações nos finais de semana e dias operacionais
  const diasT1 = ['02', '04', '06', '07', '09', '11', '13', '14', '16', '18', '20', '21', '23', '25', '27', '28'];
  diasT1.forEach((dia, idx) => {
    vagas.push({
      id: `vaga-${idContador++}`,
      turnoId: 't1',
      data: `${mesAno}-${dia}`,
      horario: '06:00 - 14:00',
      setor: idx % 2 === 0 ? 'Portaria Principal e Muralha' : 'Pavilhão Habitacional I',
      vagasSolicitadas: idx % 3 === 0 ? 2 : 1,
      alocados: [],
      observacoes: 'Reforço de segurança para movimentação interna de custodiados'
    });
  });

  // Turno 2 (Bravo)
  const diasT2 = ['01', '03', '05', '08', '10', '12', '15', '17', '19', '22', '24', '26', '29', '30'];
  diasT2.forEach((dia, idx) => {
    vagas.push({
      id: `vaga-${idContador++}`,
      turnoId: 't2',
      data: `${mesAno}-${dia}`,
      horario: '14:00 - 22:00',
      setor: idx % 2 === 0 ? 'Controle de Acesso e Raio X' : 'Muralha Setor Sul / Sentinela',
      vagasSolicitadas: 1,
      alocados: [],
      observacoes: 'Vigilância perimetral e controle de visitas virtuais'
    });
  });

  // Turno 3 (Charlie - Noturno)
  const diasT3 = ['02', '06', '07', '09', '13', '14', '16', '20', '21', '23', '27', '28'];
  diasT3.forEach((dia, idx) => {
    vagas.push({
      id: `vaga-${idContador++}`,
      turnoId: 't3',
      data: `${mesAno}-${dia}`,
      horario: '22:00 - 06:00',
      setor: 'Vigilância Noturna Pavilhões e Câmeras',
      vagasSolicitadas: idx % 2 === 0 ? 2 : 1,
      alocados: [],
      prioridade: 'urgente',
      observacoes: 'Posto estratégico noturno de sentinela armada'
    });
  });

  // Turno 4 (Delta - 12h)
  const diasT4 = ['01', '07', '08', '14', '15', '21', '22', '28', '29'];
  diasT4.forEach((dia, idx) => {
    vagas.push({
      id: `vaga-${idContador++}`,
      turnoId: 't4',
      data: `${mesAno}-${dia}`,
      horario: '07:00 - 19:00',
      setor: 'Plantão Extraordinário Geral de Final de Semana',
      vagasSolicitadas: 2,
      alocados: [],
      observacoes: 'Apoio aos dias de visitação presencial de familiares'
    });
  });

  // Administrativo / Escolta
  const diasAdm = ['03', '05', '10', '12', '17', '19', '24', '26'];
  diasAdm.forEach((dia) => {
    vagas.push({
      id: `vaga-${idContador++}`,
      turnoId: 'adm',
      data: `${mesAno}-${dia}`,
      horario: '08:00 - 16:00',
      setor: 'Escolta Hospitalar e Fórum',
      vagasSolicitadas: 1,
      alocados: [],
      observacoes: 'Apoio tático em audiências e consultas médicas externas'
    });
  });

  return vagas;
}

export function gerarPoliciaisIniciais(mesAno = '2026-11'): Policial[] {
  return [
    {
      id: 'pol-1',
      ordemEscolha: 1, // 1º colocado: escolhe primeiro este mês (será o último no próximo)
      nome: 'Carlos Eduardo Mendes',
      re: 'RE 104.921-3',
      cargo: 'Policial Penal - Classe Especial',
      turnoOrigem: 'Turno 1 (Alfa)',
      datasDisponiveis: [
        `${mesAno}-02`, `${mesAno}-04`, `${mesAno}-07`, `${mesAno}-09`,
        `${mesAno}-11`, `${mesAno}-14`, `${mesAno}-18`, `${mesAno}-21`
      ], // 8 datas (dentro do intervalo 5 a 10)
      maxDejepMes: 6,
      ativo: true,
      telefone: '(11) 98765-1001'
    },
    {
      id: 'pol-2',
      ordemEscolha: 2,
      nome: 'Juliana Beatriz Santos',
      re: 'RE 112.445-8',
      cargo: 'Policial Penal - Classe II',
      turnoOrigem: 'Turno 2 (Bravo)',
      datasDisponiveis: [
        `${mesAno}-01`, `${mesAno}-03`, `${mesAno}-05`, `${mesAno}-08`,
        `${mesAno}-12`, `${mesAno}-15`, `${mesAno}-19`, `${mesAno}-24`, `${mesAno}-29`
      ], // 9 datas
      maxDejepMes: 8,
      ativo: true,
      telefone: '(11) 98765-1002'
    },
    {
      id: 'pol-3',
      ordemEscolha: 3,
      nome: 'Rodrigo Augusto Lima',
      re: 'RE 098.320-1',
      cargo: 'Policial Penal - Classe I',
      turnoOrigem: 'Turno 3 (Charlie)',
      datasDisponiveis: [
        `${mesAno}-02`, `${mesAno}-06`, `${mesAno}-07`, `${mesAno}-13`,
        `${mesAno}-16`, `${mesAno}-20`, `${mesAno}-27`
      ], // 7 datas
      maxDejepMes: 5,
      ativo: true,
      telefone: '(11) 98765-1003'
    },
    {
      id: 'pol-4',
      ordemEscolha: 4,
      nome: 'Marcelo Antunes Ribeiro',
      re: 'RE 123.889-4',
      cargo: 'Policial Penal - Classe II',
      turnoOrigem: 'Turno 4 (Delta)',
      datasDisponiveis: [
        `${mesAno}-01`, `${mesAno}-07`, `${mesAno}-08`, `${mesAno}-14`,
        `${mesAno}-15`, `${mesAno}-21`, `${mesAno}-22`, `${mesAno}-28`, `${mesAno}-29`, `${mesAno}-30`
      ], // 10 datas (máximo permitido)
      maxDejepMes: 8,
      ativo: true,
      telefone: '(11) 98765-1004'
    },
    {
      id: 'pol-5',
      ordemEscolha: 5,
      nome: 'Fernanda Aparecida Costa',
      re: 'RE 118.774-2',
      cargo: 'Policial Penal - Classe I',
      turnoOrigem: 'Administrativo',
      datasDisponiveis: [
        `${mesAno}-03`, `${mesAno}-05`, `${mesAno}-10`, `${mesAno}-12`,
        `${mesAno}-17`, `${mesAno}-19`
      ], // 6 datas
      maxDejepMes: 6,
      ativo: true,
      telefone: '(11) 98765-1005'
    },
    {
      id: 'pol-6',
      ordemEscolha: 6,
      nome: 'Paulo Henrique Siqueira',
      re: 'RE 101.554-0',
      cargo: 'Policial Penal - Classe Especial',
      turnoOrigem: 'Turno 1 (Alfa)',
      datasDisponiveis: [
        `${mesAno}-04`, `${mesAno}-06`, `${mesAno}-11`, `${mesAno}-13`,
        `${mesAno}-18`, `${mesAno}-20`, `${mesAno}-25`
      ], // 7 datas
      maxDejepMes: 6,
      ativo: true,
      telefone: '(11) 98765-1006'
    },
    {
      id: 'pol-7',
      ordemEscolha: 7,
      nome: 'Leandro Vinicius Prado',
      re: 'RE 129.004-9',
      cargo: 'Policial Penal - Classe I',
      turnoOrigem: 'Turno 2 (Bravo)',
      datasDisponiveis: [
        `${mesAno}-03`, `${mesAno}-05`, `${mesAno}-10`, `${mesAno}-12`,
        `${mesAno}-17`, `${mesAno}-22`, `${mesAno}-26`, `${mesAno}-30`
      ], // 8 datas
      maxDejepMes: 6,
      ativo: true,
      telefone: '(11) 98765-1007'
    },
    {
      id: 'pol-8',
      ordemEscolha: 8,
      nome: 'Ana Carolina Nogueira',
      re: 'RE 115.340-7',
      cargo: 'Policial Penal - Classe II',
      turnoOrigem: 'Turno 3 (Charlie)',
      datasDisponiveis: [
        `${mesAno}-06`, `${mesAno}-09`, `${mesAno}-13`, `${mesAno}-16`,
        `${mesAno}-20`, `${mesAno}-23`, `${mesAno}-27`, `${mesAno}-28`
      ], // 8 datas
      maxDejepMes: 8,
      ativo: true,
      telefone: '(11) 98765-1008'
    },
    {
      id: 'pol-9',
      ordemEscolha: 9,
      nome: 'Gustavo Barbosa Vieira',
      re: 'RE 107.892-6',
      cargo: 'Policial Penal - Classe I',
      turnoOrigem: 'Turno 4 (Delta)',
      datasDisponiveis: [
        `${mesAno}-07`, `${mesAno}-08`, `${mesAno}-14`, `${mesAno}-15`,
        `${mesAno}-21`, `${mesAno}-22`
      ], // 6 datas
      maxDejepMes: 5,
      ativo: true,
      telefone: '(11) 98765-1009'
    },
    {
      id: 'pol-10',
      ordemEscolha: 10,
      nome: 'Wellington Moraes da Silva',
      re: 'RE 120.665-1',
      cargo: 'Policial Penal - Classe II',
      turnoOrigem: 'Turno 1 (Alfa)',
      datasDisponiveis: [
        `${mesAno}-02`, `${mesAno}-07`, `${mesAno}-09`, `${mesAno}-14`,
        `${mesAno}-16`, `${mesAno}-21`, `${mesAno}-23`, `${mesAno}-28`
      ], // 8 datas
      maxDejepMes: 6,
      ativo: true,
      telefone: '(11) 98765-1010'
    },
    {
      id: 'pol-11',
      ordemEscolha: 11,
      nome: 'Renata Cristina Barbosa',
      re: 'RE 131.229-8',
      cargo: 'Policial Penal - Classe I',
      turnoOrigem: 'Turno 2 (Bravo)',
      datasDisponiveis: [
        `${mesAno}-01`, `${mesAno}-05`, `${mesAno}-08`, `${mesAno}-15`,
        `${mesAno}-19`, `${mesAno}-24`, `${mesAno}-29`
      ], // 7 datas
      maxDejepMes: 6,
      ativo: true,
      telefone: '(11) 98765-1011'
    },
    {
      id: 'pol-12',
      ordemEscolha: 12,
      nome: 'Thiago Faria de Souza',
      re: 'RE 109.431-2',
      cargo: 'Policial Penal - Classe Especial',
      turnoOrigem: 'Turno 3 (Charlie)',
      datasDisponiveis: [
        `${mesAno}-02`, `${mesAno}-07`, `${mesAno}-09`, `${mesAno}-14`, `${mesAno}-21`
      ], // 5 datas (mínimo obrigatório)
      maxDejepMes: 5,
      ativo: true,
      telefone: '(11) 98765-1012'
    }
  ];
}
