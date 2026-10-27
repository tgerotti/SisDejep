import { ConfiguracaoDejep, Policial, TurnoConfig, VagaChefia } from '../types/dejep';

export const TURNOS_PADRAO: TurnoConfig[] = [
  {
    id: 't1',
    codigo: 'I',
    nome: 'Turno I (Diurno)',
    horarioPadrao: '07:00 - 19:00',
    cor: 'blue',
    chefeNome: 'Chefe de Plantão Turno I'
  },
  {
    id: 't2',
    codigo: 'II',
    nome: 'Turno II (Noturno)',
    horarioPadrao: '19:00 - 07:00',
    cor: 'emerald',
    chefeNome: 'Chefe de Plantão Turno II'
  },
  {
    id: 't3',
    codigo: 'III',
    nome: 'Turno III (Diurno)',
    horarioPadrao: '07:00 - 19:00',
    cor: 'purple',
    chefeNome: 'Chefe de Plantão Turno III'
  },
  {
    id: 't4',
    codigo: 'IV',
    nome: 'Turno IV (Noturno)',
    horarioPadrao: '19:00 - 07:00',
    cor: 'amber',
    chefeNome: 'Chefe de Plantão Turno IV'
  },
  {
    id: 'dia',
    codigo: 'DIA',
    nome: 'Diaristas',
    horarioPadrao: '07:00 - 16:00',
    cor: 'rose',
    chefeNome: 'Coordenação Diaristas'
  }
];

export function obterEstiloTurno(turnoCodigoOuId: string): {
  bg: string;
  border: string;
  text: string;
  badge: string;
  dot: string;
  nomeLegivel: string;
} {
  const chave = (turnoCodigoOuId || '').toLowerCase().trim();

  // Diaristas (segunda a sexta 07h às 16h)
  if (chave.includes('diar') || chave.includes('adm') || chave === 'dia') {
    return {
      bg: 'bg-rose-950/80',
      border: 'border-rose-500/60',
      text: 'text-rose-300',
      badge: 'bg-rose-900/60 text-rose-200 border-rose-500/50',
      dot: 'bg-rose-400',
      nomeLegivel: 'Diaristas (07h-16h)'
    };
  }

  // Turno III (Diurno 07h às 19h)
  if (chave.includes('iii') || chave.includes('turno 3') || chave.includes('t3') || chave.includes('charlie') || chave === '3') {
    return {
      bg: 'bg-purple-950/80',
      border: 'border-purple-500/60',
      text: 'text-purple-300',
      badge: 'bg-purple-900/60 text-purple-200 border-purple-500/50',
      dot: 'bg-purple-400',
      nomeLegivel: 'Turno III (07h-19h)'
    };
  }

  // Turno IV ou VI (Noturno 19h às 07h)
  if (chave.includes('iv') || chave.includes('vi') || chave.includes('turno 4') || chave.includes('t4') || chave.includes('delta') || chave === '4') {
    return {
      bg: 'bg-amber-950/80',
      border: 'border-amber-500/60',
      text: 'text-amber-300',
      badge: 'bg-amber-900/60 text-amber-200 border-amber-500/50',
      dot: 'bg-amber-400',
      nomeLegivel: 'Turno IV (19h-07h)'
    };
  }

  // Turno II (Noturno 19h às 07h)
  if (chave.includes('ii') || chave.includes('turno 2') || chave.includes('t2') || chave.includes('bravo') || chave === '2') {
    return {
      bg: 'bg-emerald-950/80',
      border: 'border-emerald-500/60',
      text: 'text-emerald-300',
      badge: 'bg-emerald-900/60 text-emerald-200 border-emerald-500/50',
      dot: 'bg-emerald-400',
      nomeLegivel: 'Turno II (19h-07h)'
    };
  }

  // Turno I (Diurno 07h às 19h)
  return {
    bg: 'bg-blue-950/80',
    border: 'border-blue-500/60',
    text: 'text-blue-300',
    badge: 'bg-blue-900/60 text-blue-200 border-blue-500/50',
    dot: 'bg-blue-400',
    nomeLegivel: 'Turno I (07h-19h)'
  };
}

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

  // Turno I (Diurno: 07:00 às 19:00)
  const diasT1 = ['02', '04', '06', '07', '09', '11', '13', '14', '16', '18', '20', '21', '23', '25', '27', '28'];
  diasT1.forEach((dia, idx) => {
    vagas.push({
      id: `vaga-${idContador++}`,
      turnoId: 't1',
      data: `${mesAno}-${dia}`,
      horario: '07:00 - 19:00',
      setor: idx % 2 === 0 ? 'Portaria Principal e Muralha' : 'Pavilhão Habitacional I',
      vagasSolicitadas: idx % 3 === 0 ? 2 : 1,
      alocados: [],
      observacoes: 'Reforço diurno para movimentação e portaria'
    });
  });

  // Turno II (Noturno: 19:00 às 07:00)
  const diasT2 = ['01', '03', '05', '08', '10', '12', '15', '17', '19', '22', '24', '26', '29', '30'];
  diasT2.forEach((dia, idx) => {
    vagas.push({
      id: `vaga-${idContador++}`,
      turnoId: 't2',
      data: `${mesAno}-${dia}`,
      horario: '19:00 - 07:00',
      setor: idx % 2 === 0 ? 'Controle de Acesso e Sentinela Sul' : 'Muralha e Vigilância Noturna',
      vagasSolicitadas: 1,
      alocados: [],
      observacoes: 'Plantão noturno de segurança perimetral'
    });
  });

  // Turno III (Diurno: 07:00 às 19:00)
  const diasT3 = ['02', '06', '07', '09', '13', '14', '16', '20', '21', '23', '27', '28'];
  diasT3.forEach((dia, idx) => {
    vagas.push({
      id: `vaga-${idContador++}`,
      turnoId: 't3',
      data: `${mesAno}-${dia}`,
      horario: '07:00 - 19:00',
      setor: 'Vigilância Pavilhões e Câmeras',
      vagasSolicitadas: idx % 2 === 0 ? 2 : 1,
      alocados: [],
      prioridade: 'normal',
      observacoes: 'Posto operacional diurno'
    });
  });

  // Turno IV (Noturno: 19:00 às 07:00)
  const diasT4 = ['01', '07', '08', '14', '15', '21', '22', '28', '29'];
  diasT4.forEach((dia) => {
    vagas.push({
      id: `vaga-${idContador++}`,
      turnoId: 't4',
      data: `${mesAno}-${dia}`,
      horario: '19:00 - 07:00',
      setor: 'Muralha Leste e Sentinela Armada',
      vagasSolicitadas: 2,
      alocados: [],
      prioridade: 'urgente',
      observacoes: 'Plantão noturno armado de final de semana'
    });
  });

  return vagas;
}

export function gerarPoliciaisIniciais(mesAno = '2026-11'): Policial[] {
  return [
    {
      id: 'pol-1',
      ordemEscolha: 1,
      nome: 'Carlos Eduardo Mendes',
      re: 'RE 104.921-3',
      cargo: 'Policial Penal - Classe Especial',
      turnoOrigem: 'Turno I (Diurno)',
      datasDisponiveis: [
        `${mesAno}-01`, `${mesAno}-03`, `${mesAno}-05`, `${mesAno}-08`,
        `${mesAno}-10`, `${mesAno}-15`, `${mesAno}-17`, `${mesAno}-22`
      ],
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
      turnoOrigem: 'Turno II (Noturno)',
      datasDisponiveis: [
        `${mesAno}-02`, `${mesAno}-04`, `${mesAno}-06`, `${mesAno}-07`,
        `${mesAno}-11`, `${mesAno}-14`, `${mesAno}-18`, `${mesAno}-21`, `${mesAno}-28`
      ],
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
      turnoOrigem: 'Turno III (Diurno)',
      datasDisponiveis: [
        `${mesAno}-01`, `${mesAno}-05`, `${mesAno}-08`, `${mesAno}-12`,
        `${mesAno}-15`, `${mesAno}-22`, `${mesAno}-29`
      ],
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
      turnoOrigem: 'Turno IV (Noturno)',
      datasDisponiveis: [
        `${mesAno}-02`, `${mesAno}-04`, `${mesAno}-06`, `${mesAno}-09`,
        `${mesAno}-11`, `${mesAno}-13`, `${mesAno}-16`, `${mesAno}-18`, `${mesAno}-23`, `${mesAno}-25`
      ],
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
      turnoOrigem: 'Diaristas',
      // Diarista: sextas e sábados para noturno (II e IV), sábados e domingos para diurno (I e III)
      // Ex: Nov/2026: 01 (Dom), 06 (Sex), 07 (Sáb), 08 (Dom), 13 (Sex), 14 (Sáb), 15 (Dom), 20 (Sex), 21 (Sáb)
      datasDisponiveis: [
        `${mesAno}-01`, `${mesAno}-06`, `${mesAno}-07`, `${mesAno}-08`,
        `${mesAno}-13`, `${mesAno}-14`, `${mesAno}-15`, `${mesAno}-21`
      ],
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
      turnoOrigem: 'Turno I (Diurno)',
      datasDisponiveis: [
        `${mesAno}-03`, `${mesAno}-05`, `${mesAno}-10`, `${mesAno}-12`,
        `${mesAno}-17`, `${mesAno}-19`, `${mesAno}-24`
      ],
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
      turnoOrigem: 'Turno II (Noturno)',
      datasDisponiveis: [
        `${mesAno}-02`, `${mesAno}-04`, `${mesAno}-07`, `${mesAno}-09`,
        `${mesAno}-14`, `${mesAno}-16`, `${mesAno}-21`, `${mesAno}-23`
      ],
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
      turnoOrigem: 'Turno III (Diurno)',
      datasDisponiveis: [
        `${mesAno}-01`, `${mesAno}-03`, `${mesAno}-08`, `${mesAno}-10`,
        `${mesAno}-15`, `${mesAno}-17`, `${mesAno}-22`, `${mesAno}-24`
      ],
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
      turnoOrigem: 'Turno IV (Noturno)',
      datasDisponiveis: [
        `${mesAno}-02`, `${mesAno}-06`, `${mesAno}-09`, `${mesAno}-13`,
        `${mesAno}-16`, `${mesAno}-20`
      ],
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
      turnoOrigem: 'Turno I (Diurno)',
      datasDisponiveis: [
        `${mesAno}-01`, `${mesAno}-05`, `${mesAno}-08`, `${mesAno}-12`,
        `${mesAno}-15`, `${mesAno}-19`, `${mesAno}-22`, `${mesAno}-26`
      ],
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
      turnoOrigem: 'Turno II (Noturno)',
      datasDisponiveis: [
        `${mesAno}-02`, `${mesAno}-06`, `${mesAno}-07`, `${mesAno}-13`,
        `${mesAno}-14`, `${mesAno}-20`, `${mesAno}-27`
      ],
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
      turnoOrigem: 'Turno III (Diurno)',
      datasDisponiveis: [
        `${mesAno}-01`, `${mesAno}-07`, `${mesAno}-08`, `${mesAno}-15`, `${mesAno}-22`
      ],
      maxDejepMes: 5,
      ativo: true,
      telefone: '(11) 98765-1012'
    }
  ];
}
