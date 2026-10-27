import React from 'react';
import { 
  Shield, 
  Calendar, 
  Users, 
  Layers, 
  FileSpreadsheet, 
  Server, 
  RotateCw, 
  Settings, 
  Printer,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { ConfiguracaoDejep } from '../types/dejep';
import { baixarArquivoModelo } from '../utils/excelExport';

interface NavbarProps {
  abaAtiva: 'chefia' | 'policiais' | 'distribuicao' | 'escala' | 'apache';
  setAbaAtiva: (aba: 'chefia' | 'policiais' | 'distribuicao' | 'escala' | 'apache') => void;
  config: ConfiguracaoDejep;
  onAbrirConfig: () => void;
  onAlterarMesAno: (novoMesAno: string) => void;
  totalVagas: number;
  totalPoliciais: number;
  totalAlocadas: number;
  modoAcesso: 'admin' | 'chefia';
  setModoAcesso: (modo: 'admin' | 'chefia') => void;
}

const MESES = [
  { valor: '01', nome: 'Janeiro' },
  { valor: '02', nome: 'Fevereiro' },
  { valor: '03', nome: 'Março' },
  { valor: '04', nome: 'Abril' },
  { valor: '05', nome: 'Maio' },
  { valor: '06', nome: 'Junho' },
  { valor: '07', nome: 'Julho' },
  { valor: '08', nome: 'Agosto' },
  { valor: '09', nome: 'Setembro' },
  { valor: '10', nome: 'Outubro' },
  { valor: '11', nome: 'Novembro' },
  { valor: '12', nome: 'Dezembro' }
];

const ANOS = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

export const Navbar: React.FC<NavbarProps> = ({
  abaAtiva,
  setAbaAtiva,
  config,
  onAbrirConfig,
  onAlterarMesAno,
  totalVagas,
  totalPoliciais,
  totalAlocadas,
  modoAcesso,
  setModoAcesso
}) => {
  const [ano, mes] = config.mesAnoAtual.split('-');
  const mesAtualObj = MESES.find(m => m.valor === mes) || MESES[10];
  const mesFormatado = `${mesAtualObj.nome} / ${ano}`;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      {/* Top Banner Institucional */}
      <div className="bg-slate-950/80 px-4 py-1.5 border-b border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-300">SISTEMA INFORMATIZADO DE DEJEP</span>
            <span className="text-slate-600">|</span>
            <span className="truncate max-w-xs">{config.unidadePrisional}</span>
          </div>

          {/* Seletor de Perfil / Modo de Acesso Solicitado pelo Usuário */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-[11px] font-medium">
            <button
              onClick={() => setModoAcesso('chefia')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                modoAcesso === 'chefia'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Acesso da Chefia de Turno: apenas enviar lista com datas ou criar nova vaga e ver a lista final gerada"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Portal da Chefia</span>
            </button>
            <button
              onClick={() => setModoAcesso('admin')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                modoAcesso === 'admin'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Acesso completo de Administração: controle de policiais, distribuição Regra 01, Apache e configurações"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configuração & Gestão</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {/* Links Rápidos para Baixar Modelos XLS */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded px-2 py-0.5">
            <span className="text-slate-400 font-semibold">Modelos XLS:</span>
            <button
              onClick={() => baixarArquivoModelo('chefia')}
              className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-medium cursor-pointer"
              title="Baixar Modelo XLSX da Chefia com abas por turno"
            >
              Chefia (Turnos)
            </button>
            <span className="text-slate-600">&bull;</span>
            <button
              onClick={() => baixarArquivoModelo('policial')}
              className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-medium cursor-pointer"
              title="Baixar Modelo XLSX dos Policiais (5 a 10 datas e ordem de escolha)"
            >
              Policiais (5 a 10 datas)
            </button>
          </div>

          <span className="bg-blue-950/80 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded font-mono hidden sm:inline">
            Apache Ready: .htaccess configurado
          </span>
          <span className="text-slate-400">
            Período: <strong className="text-white">{mesFormatado}</strong>
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo e Título */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md border ${
              modoAcesso === 'chefia'
                ? 'bg-gradient-to-br from-blue-700 to-cyan-800 border-blue-500/40'
                : 'bg-gradient-to-br from-indigo-700 to-purple-900 border-indigo-500/40'
            }`}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  DEJEP 
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    modoAcesso === 'chefia'
                      ? 'text-cyan-300 bg-cyan-950/70 border-cyan-700/60'
                      : 'text-indigo-300 bg-indigo-950/70 border-indigo-700/60'
                  }`}>
                    {modoAcesso === 'chefia' ? 'Portal Chefia de Turno' : 'Painel de Configuração'}
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {modoAcesso === 'chefia' 
                  ? 'Envio de demandas de datas/vagas e consulta da escala final' 
                  : 'Gestão completa de turnos, policiais aptos, regra de distribuição e parâmetros'}
              </p>
            </div>
          </div>

          {/* Abas de Navegação (Apenas para modo Administrador) */}
          {modoAcesso === 'admin' ? (
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setAbaAtiva('chefia')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border ${
                  abaAtiva === 'chefia'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border-transparent'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Vagas Chefia</span>
                <span className={`text-xs px-1.5 py-0.2 rounded-full ${abaAtiva === 'chefia' ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {totalVagas}
                </span>
              </button>

              <button
                onClick={() => setAbaAtiva('policiais')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border ${
                  abaAtiva === 'policiais'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border-transparent'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Lista Policiais</span>
                <span className={`text-xs px-1.5 py-0.2 rounded-full ${abaAtiva === 'policiais' ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {totalPoliciais}
                </span>
              </button>

              <button
                onClick={() => setAbaAtiva('distribuicao')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border ${
                  abaAtiva === 'distribuicao'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border-transparent'
                }`}
              >
                <RotateCw className="w-4 h-4" />
                <span>Regra 01 (Distribuição)</span>
                {totalAlocadas > 0 && (
                  <span className="text-xs px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {totalAlocadas}/{totalVagas}
                  </span>
                )}
              </button>

              <button
                onClick={() => setAbaAtiva('escala')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border ${
                  abaAtiva === 'escala'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border-transparent'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>Escala Final</span>
              </button>

              <button
                onClick={() => setAbaAtiva('apache')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border ${
                  abaAtiva === 'apache'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-900/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border-transparent'
                }`}
                title="Instruções de execução no Apache Server com .htaccess"
              >
                <Server className="w-4 h-4" />
                <span className="hidden md:inline">Apache</span>
              </button>
            </nav>
          ) : (
            /* Modo Chefia: Exibe apenas aviso do perfil e instrução clara */
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>Acesso restrito para demandas e consulta de escalas dos turnos</span>
            </div>
          )}

          {/* Seletores de Mês e Ano (Solicitados pelo Usuário) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950/90 border border-slate-700/80 rounded-lg p-1 text-xs shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-blue-400 ml-1 shrink-0" />
              
              {/* Dropdown Mês */}
              <select
                value={mes}
                onChange={(e) => onAlterarMesAno(`${ano}-${e.target.value}`)}
                className="bg-slate-900 border border-slate-700 hover:border-slate-500 text-white font-medium text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                title="Selecione o mês"
              >
                {MESES.map((m) => (
                  <option key={m.valor} value={m.valor}>
                    {m.nome}
                  </option>
                ))}
              </select>

              {/* Dropdown Ano */}
              <select
                value={ano}
                onChange={(e) => onAlterarMesAno(`${e.target.value}-${mes}`)}
                className="bg-slate-900 border border-slate-700 hover:border-slate-500 text-white font-semibold font-mono text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                title="Selecione o ano"
              >
                {ANOS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {modoAcesso === 'admin' && (
              <button
                onClick={onAbrirConfig}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
                title="Configurações da Unidade e Turnos"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
