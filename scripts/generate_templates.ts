import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const outputDir = path.resolve(process.cwd(), 'public/modelos');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ==========================================
// 1. MODELO: LISTA DE DEJEP - CHEFIA
// Com abas diferentes para Turno I, Turno II, Turno III, Turno IV e Diaristas
// ==========================================
const wbChefia = XLSX.utils.book_new();

// Aba de Instruções da Chefia
const instrucoesChefia = [
  ['ORIENTAÇÕES DE PREENCHIMENTO - LISTA DE DEJEP (CHEFIA)'],
  [''],
  ['1. Este arquivo é o modelo padrão para solicitação de diárias pelos Chefes de Turno.'],
  ['2. O sistema é organizado nos 4 plantões operacionais (Turno I, Turno II, Turno III, Turno IV) e Diaristas:'],
  ['   - Turno I: Diurno (07:00 às 19:00)'],
  ['   - Turno II: Noturno (19:00 às 07:00)'],
  ['   - Turno III: Diurno (07:00 às 19:00)'],
  ['   - Turno IV: Noturno (19:00 às 07:00)'],
  ['   - Diaristas: Horário Comercial de Segunda a Sexta (07:00 às 16:00)'],
  ['3. Preencha a data no formato AAAA-MM-DD (ex: 2026-11-05) ou DD/MM/AAAA (ex: 05/11/2026).'],
  ['4. Horário deve indicar início e término conforme o turno correspondente.'],
  ['5. Indique a quantidade de vagas necessárias e o Posto / Setor operacional.'],
  ['6. Salve o arquivo e importe diretamente no sistema na aba da Chefia.'],
  ['']
];
const wsInstrucoesChefia = XLSX.utils.aoa_to_sheet(instrucoesChefia);
XLSX.utils.book_append_sheet(wbChefia, wsInstrucoesChefia, 'Instruções');

// Aba Turno I (Diurno: 07:00 - 19:00)
const dadosT1 = [
  {
    'Data': '02/11/2026',
    'Horario': '07:00 - 19:00',
    'Setor_Posto': 'Portaria Principal e Muralha',
    'Vagas_Solicitadas': 2,
    'Prioridade': 'normal',
    'Observacoes': 'Reforço operacional diurno para abertura e triagem'
  },
  {
    'Data': '04/11/2026',
    'Horario': '07:00 - 19:00',
    'Setor_Posto': 'Pavilhão Habitacional I',
    'Vagas_Solicitadas': 1,
    'Prioridade': 'normal',
    'Observacoes': 'Apoio na movimentação interna'
  },
  {
    'Data': '07/11/2026',
    'Horario': '07:00 - 19:00',
    'Setor_Posto': 'Muralha e Sentinela Setor Norte',
    'Vagas_Solicitadas': 2,
    'Prioridade': 'alta',
    'Observacoes': 'Sábado de visitas gerais'
  },
  {
    'Data': '14/11/2026',
    'Horario': '07:00 - 19:00',
    'Setor_Posto': 'Controle de Acesso / Scanner Corporal',
    'Vagas_Solicitadas': 1,
    'Prioridade': 'normal',
    'Observacoes': 'Operação do scanner de bagagens'
  },
  {
    'Data': '21/11/2026',
    'Horario': '07:00 - 19:00',
    'Setor_Posto': 'Portaria Principal e Muralha',
    'Vagas_Solicitadas': 2,
    'Prioridade': 'alta',
    'Observacoes': 'Reforço operacional fim de semana'
  }
];
const wsT1 = XLSX.utils.json_to_sheet(dadosT1);
XLSX.utils.book_append_sheet(wbChefia, wsT1, 'Turno I (Diurno)');

// Aba Turno II (Noturno: 19:00 - 07:00)
const dadosT2 = [
  {
    'Data': '01/11/2026',
    'Horario': '19:00 - 07:00',
    'Setor_Posto': 'Controle de Acesso e Sentinela Sul',
    'Vagas_Solicitadas': 1,
    'Prioridade': 'normal',
    'Observacoes': 'Encerramento de expediente e tranca geral'
  },
  {
    'Data': '06/11/2026',
    'Horario': '19:00 - 07:00',
    'Setor_Posto': 'Muralha Setor Sul / Sentinela',
    'Vagas_Solicitadas': 1,
    'Prioridade': 'normal',
    'Observacoes': 'Vigilância noturna perimetral armada'
  },
  {
    'Data': '07/11/2026',
    'Horario': '19:00 - 07:00',
    'Setor_Posto': 'Pavilhão Habitacional II',
    'Vagas_Solicitadas': 2,
    'Prioridade': 'alta',
    'Observacoes': 'Sábado à noite - sentinela armada'
  },
  {
    'Data': '13/11/2026',
    'Horario': '19:00 - 07:00',
    'Setor_Posto': 'Muralha Setor Sul / Sentinela',
    'Vagas_Solicitadas': 1,
    'Prioridade': 'normal',
    'Observacoes': 'Vigilância externa'
  }
];
const wsT2 = XLSX.utils.json_to_sheet(dadosT2);
XLSX.utils.book_append_sheet(wbChefia, wsT2, 'Turno II (Noturno)');

// Aba Turno III (Diurno: 07:00 - 19:00)
const dadosT3 = [
  {
    'Data': '02/11/2026',
    'Horario': '07:00 - 19:00',
    'Setor_Posto': 'Vigilância Pavilhões e Câmeras',
    'Vagas_Solicitadas': 2,
    'Prioridade': 'normal',
    'Observacoes': 'Monitoramento CFTV e movimentação interna'
  },
  {
    'Data': '07/11/2026',
    'Horario': '07:00 - 19:00',
    'Setor_Posto': 'Sentinela Armada Muralha Leste',
    'Vagas_Solicitadas': 1,
    'Prioridade': 'alta',
    'Observacoes': 'Posto fixo de segurança diurno'
  },
  {
    'Data': '14/11/2026',
    'Horario': '07:00 - 19:00',
    'Setor_Posto': 'Vigilância Pavilhões e Câmeras',
    'Vagas_Solicitadas': 2,
    'Prioridade': 'normal',
    'Observacoes': 'Plantão de final de semana diurno'
  }
];
const wsT3 = XLSX.utils.json_to_sheet(dadosT3);
XLSX.utils.book_append_sheet(wbChefia, wsT3, 'Turno III (Diurno)');

// Aba Turno IV (Noturno: 19:00 - 07:00)
const dadosT4 = [
  {
    'Data': '06/11/2026',
    'Horario': '19:00 - 07:00',
    'Setor_Posto': 'Muralha Leste e Sentinela Armada',
    'Vagas_Solicitadas': 2,
    'Prioridade': 'urgente',
    'Observacoes': 'Sexta-feira noturna - reforço tático'
  },
  {
    'Data': '07/11/2026',
    'Horario': '19:00 - 07:00',
    'Setor_Posto': 'Muralha Leste e Sentinela Armada',
    'Vagas_Solicitadas': 2,
    'Prioridade': 'urgente',
    'Observacoes': 'Sábado noturno armado'
  },
  {
    'Data': '21/11/2026',
    'Horario': '19:00 - 07:00',
    'Setor_Posto': 'Muralha Leste e Sentinela Armada',
    'Vagas_Solicitadas': 2,
    'Prioridade': 'urgente',
    'Observacoes': 'Vigilância noturna sentinela'
  }
];
const wsT4 = XLSX.utils.json_to_sheet(dadosT4);
XLSX.utils.book_append_sheet(wbChefia, wsT4, 'Turno IV (Noturno)');

const caminhoChefia = path.join(outputDir, 'Modelo_Lista_DEJEP_Chefia.xlsx');
XLSX.writeFile(wbChefia, caminhoChefia);
console.log('Criado com sucesso:', caminhoChefia);

// ==========================================
// 2. MODELO: LISTA DE DEJEP - POLICIAIS APTOS
// Com Turno de Origem e Regras de Compatibilidade
// ==========================================
const wbPolicial = XLSX.utils.book_new();

// Aba de Instruções Policial
const instrucoesPolicial = [
  ['ORIENTAÇÕES DE PREENCHIMENTO - LISTA DE DEJEP (POLICIAIS APTOS)'],
  [''],
  ['1. A coluna "Ordem de Escolha" define rigorosamente a prioridade na distribuição.'],
  ['2. O 1º colocado deste mês será o ÚLTIMO no próximo mês, conforme a Regra de Rotatividade.'],
  ['3. OBRIGATÓRIO: Cada servidor deve disponibilizar entre 5 (mínimo) e 10 (máximo) datas.'],
  ['4. As datas devem ser informadas separadas por vírgula na coluna "Datas Disponibilizadas"'],
  ['   Exemplo: 02/11/2026, 04/11/2026, 07/11/2026, 09/11/2026, 11/11/2026, 14/11/2026'],
  ['   Ou em formato AAAA-MM-DD: 2026-11-02, 2026-11-04, 2026-11-07, 2026-11-09, 2026-11-11, 2026-11-14'],
  ['5. REGRAS OBRIGATÓRIAS DOS TURNOS:'],
  ['   - Policial do Turno I pode fazer DEJEP nos turnos II, III e IV (não no Turno I).'],
  ['   - Policial do Turno II pode fazer DEJEP nos turnos I, III e IV (não no Turno II).'],
  ['   - Policial do Turno III pode fazer DEJEP nos turnos I, II e IV (não no Turno III).'],
  ['   - Policial do Turno IV pode fazer DEJEP nos turnos I, II e III (não no Turno IV).'],
  ['   - Policial Diarista (expediente comercial seg-sex 07h-16h) pode fazer DEJEP:'],
  ['       * Nos Turnos II e IV (noturnos): APENAS às sextas-feiras e aos sábados.'],
  ['       * Nos Turnos I e III (diurnos): APENAS aos sábados e domingos.'],
  ['6. A coluna "Limite Max DEJEP" indica a quantidade máxima de diárias que o policial aceita (padrão 8).'],
  ['7. Status deve ser "Apto" para participar da distribuição.'],
  ['']
];
const wsInstrucoesPolicial = XLSX.utils.aoa_to_sheet(instrucoesPolicial);
XLSX.utils.book_append_sheet(wbPolicial, wsInstrucoesPolicial, 'Instruções');

// Aba Relação de Policiais
const dadosPoliciais = [
  {
    'Ordem de Escolha': 1,
    'Nome Completo': 'Carlos Eduardo Mendes',
    'RE / Matrícula': 'RE 104.921-3',
    'Cargo': 'Policial Penal - Classe Especial',
    'Turno de Origem': 'Turno I (Diurno)',
    'Datas Disponibilizadas (5 a 10 datas)': '01/11/2026, 03/11/2026, 05/11/2026, 08/11/2026, 10/11/2026, 15/11/2026, 17/11/2026, 22/11/2026',
    'Qtd Datas': 8,
    'Limite Max DEJEP': 6,
    'Status': 'Apto',
    'Telefone': '(11) 98765-1001'
  },
  {
    'Ordem de Escolha': 2,
    'Nome Completo': 'Juliana Beatriz Santos',
    'RE / Matrícula': 'RE 112.445-8',
    'Cargo': 'Policial Penal - Classe II',
    'Turno de Origem': 'Turno II (Noturno)',
    'Datas Disponibilizadas (5 a 10 datas)': '02/11/2026, 04/11/2026, 06/11/2026, 07/11/2026, 11/11/2026, 14/11/2026, 18/11/2026, 21/11/2026, 28/11/2026',
    'Qtd Datas': 9,
    'Limite Max DEJEP': 8,
    'Status': 'Apto',
    'Telefone': '(11) 98765-1002'
  },
  {
    'Ordem de Escolha': 3,
    'Nome Completo': 'Rodrigo Augusto Lima',
    'RE / Matrícula': 'RE 098.320-1',
    'Cargo': 'Policial Penal - Classe I',
    'Turno de Origem': 'Turno III (Diurno)',
    'Datas Disponibilizadas (5 a 10 datas)': '01/11/2026, 05/11/2026, 08/11/2026, 12/11/2026, 15/11/2026, 22/11/2026, 29/11/2026',
    'Qtd Datas': 7,
    'Limite Max DEJEP': 5,
    'Status': 'Apto',
    'Telefone': '(11) 98765-1003'
  },
  {
    'Ordem de Escolha': 4,
    'Nome Completo': 'Marcelo Antunes Ribeiro',
    'RE / Matrícula': 'RE 123.889-4',
    'Cargo': 'Policial Penal - Classe II',
    'Turno de Origem': 'Turno IV (Noturno)',
    'Datas Disponibilizadas (5 a 10 datas)': '02/11/2026, 04/11/2026, 06/11/2026, 09/11/2026, 11/11/2026, 13/11/2026, 16/11/2026, 18/11/2026, 23/11/2026, 25/11/2026',
    'Qtd Datas': 10,
    'Limite Max DEJEP': 8,
    'Status': 'Apto',
    'Telefone': '(11) 98765-1004'
  },
  {
    'Ordem de Escolha': 5,
    'Nome Completo': 'Fernanda Aparecida Costa',
    'RE / Matrícula': 'RE 118.774-2',
    'Cargo': 'Policial Penal - Classe I',
    'Turno de Origem': 'Diaristas',
    'Datas Disponibilizadas (5 a 10 datas)': '01/11/2026, 06/11/2026, 07/11/2026, 08/11/2026, 13/11/2026, 14/11/2026, 15/11/2026, 21/11/2026',
    'Qtd Datas': 8,
    'Limite Max DEJEP': 6,
    'Status': 'Apto',
    'Telefone': '(11) 98765-1005'
  },
  {
    'Ordem de Escolha': 6,
    'Nome Completo': 'Paulo Henrique Siqueira',
    'RE / Matrícula': 'RE 101.554-0',
    'Cargo': 'Policial Penal - Classe Especial',
    'Turno de Origem': 'Turno I (Diurno)',
    'Datas Disponibilizadas (5 a 10 datas)': '03/11/2026, 05/11/2026, 10/11/2026, 12/11/2026, 17/11/2026, 19/11/2026, 24/11/2026',
    'Qtd Datas': 7,
    'Limite Max DEJEP': 6,
    'Status': 'Apto',
    'Telefone': '(11) 98765-1006'
  },
  {
    'Ordem de Escolha': 7,
    'Nome Completo': 'Thiago Faria de Souza',
    'RE / Matrícula': 'RE 109.431-2',
    'Cargo': 'Policial Penal - Classe Especial',
    'Turno de Origem': 'Turno III (Diurno)',
    'Datas Disponibilizadas (5 a 10 datas)': '01/11/2026, 07/11/2026, 08/11/2026, 15/11/2026, 22/11/2026',
    'Qtd Datas': 5,
    'Limite Max DEJEP': 5,
    'Status': 'Apto',
    'Telefone': '(11) 98765-1012'
  }
];
const wsPoliciais = XLSX.utils.json_to_sheet(dadosPoliciais);
XLSX.utils.book_append_sheet(wbPolicial, wsPoliciais, 'Lista de Policiais Aptos');

const caminhoPolicial = path.join(outputDir, 'Modelo_Lista_DEJEP_Policial.xlsx');
XLSX.writeFile(wbPolicial, caminhoPolicial);
console.log('Criado com sucesso:', caminhoPolicial);
