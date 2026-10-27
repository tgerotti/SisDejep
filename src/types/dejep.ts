export interface TurnoConfig {
  id: string;
  nome: string; // ex: "Turno 1", "Turno 2", "Turno 3", "Turno 4", "Administrativo"
  codigo: string; // ex: "T1", "T2", "T3", "T4", "ADM"
  horarioPadrao: string; // ex: "06:00 - 14:00" ou "07:00 - 15:00"
  cor: string; // Tailwind color or hex
  chefeNome?: string;
}

export interface AlocacaoDejep {
  policialId: string;
  policialNome: string;
  policialRE: string;
  rodada: number;
  dataHoraAlocacao: string;
}

export interface VagaChefia {
  id: string;
  turnoId: string;
  data: string; // Formato YYYY-MM-DD
  horario: string; // ex: "06:00 - 14:00" ou "14:00 - 22:00"
  setor: string; // ex: "Portaria Principal", "Muralha A", "Pavilhão 1", "Escolta Externa"
  vagasSolicitadas: number;
  alocados: AlocacaoDejep[];
  observacoes?: string;
  prioridade?: 'normal' | 'alta' | 'urgente';
}

export interface Policial {
  id: string;
  ordemEscolha: number; // 1, 2, 3... Respeitada rigorosamente
  nome: string;
  re: string; // Registro Funcional / Matrícula
  cargo: string; // Policial Penal, Agente de Segurança Penitenciária, etc.
  turnoOrigem: string; // Turno normal de trabalho do servidor
  datasDisponiveis: string[]; // Array de strings YYYY-MM-DD (mínimo 5, máximo 10)
  maxDejepMes: number; // Máximo que o policial deseja realizar (padrão 8)
  ativo: boolean;
  telefone?: string;
  email?: string;
}

export interface DistribuicaoLog {
  id: string;
  rodada: number;
  passo: number;
  ordemPolicial: number;
  policialId: string;
  policialNome: string;
  policialRE: string;
  vagaId?: string;
  data?: string;
  turnoNome?: string;
  setor?: string;
  sucesso: boolean;
  motivo: string;
  timestamp: string;
}

export interface EstatisticasDistribuicao {
  totalVagasSolicitadas: number;
  totalVagasPreenchidas: number;
  totalVagasNaoPreenchidas: number;
  totalPoliciaisAptos: number;
  totalPoliciaisAtendidos: number;
  totalDejepDistribuidas: number;
  rodadasExecutadas: number;
  taxaAtendimento: number; // porcentagem
}

export interface ConfiguracaoDejep {
  unidadePrisional: string;
  diretorGeral: string;
  diretorSeguranca: string;
  mesAnoAtual: string; // YYYY-MM
  limitePadraoDejep: number; // default 8
  minDatasObrigatorias: number; // default 5
  maxDatasObrigatorias: number; // default 10
  turnos: TurnoConfig[];
}
