/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ChefiaTab } from './components/ChefiaTab';
import { PoliciaisTab } from './components/PoliciaisTab';
import { DistribuicaoTab } from './components/DistribuicaoTab';
import { EscalaFinalTab } from './components/EscalaFinalTab';
import { ApacheGuideTab } from './components/ApacheGuideTab';
import { ConfigModal } from './components/ConfigModal';
import { ChefiaPortalView } from './components/ChefiaPortalView';

import { VagaChefia, Policial, DistribuicaoLog, EstatisticasDistribuicao, ConfiguracaoDejep } from './types/dejep';
import { CONFIG_INICIAL, gerarVagasIniciais, gerarPoliciaisIniciais } from './utils/sampleData';
import { rotacionarOrdemProximoMes, obterDiasDoMes } from './utils/dejepEngine';

const STORAGE_KEY_CONFIG = 'dejep_config_v1';
const STORAGE_KEY_VAGAS = 'dejep_vagas_v1';
const STORAGE_KEY_POLICIAIS = 'dejep_policiais_v1';
const STORAGE_KEY_LOGS = 'dejep_logs_v1';
const STORAGE_KEY_MODO = 'dejep_modo_acesso_v1';

export default function App() {
  // Modo de Acesso / Perfil: 'admin' (Painel de Configuração e Gestão Geral) ou 'chefia' (Portal restrito da Chefia de Turno)
  const [modoAcesso, setModoAcesso] = useState<'admin' | 'chefia'>(() => {
    const salvo = localStorage.getItem(STORAGE_KEY_MODO);
    return (salvo === 'chefia' || salvo === 'admin') ? salvo : 'admin';
  });

  // Configuração
  const [config, setConfig] = useState<ConfiguracaoDejep>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return CONFIG_INICIAL;
  });

  // Vagas da Chefia (todas de todos os turnos)
  const [vagas, setVagas] = useState<VagaChefia[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VAGAS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return gerarVagasIniciais(CONFIG_INICIAL.mesAnoAtual);
  });

  // Policiais Aptos com Ordem de Escolha
  const [policiais, setPoliciais] = useState<Policial[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_POLICIAIS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return gerarPoliciaisIniciais(CONFIG_INICIAL.mesAnoAtual);
  });

  // Logs e Estatísticas de Distribuição
  const [logs, setLogs] = useState<DistribuicaoLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LOGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [estatisticas, setEstatisticas] = useState<EstatisticasDistribuicao | null>(null);

  // Navegação
  const [abaAtiva, setAbaAtiva] = useState<'chefia' | 'policiais' | 'distribuicao' | 'escala' | 'apache'>('chefia');
  const [modalConfigAberto, setModalConfigAberto] = useState<boolean>(false);
  const [notificacao, setNotificacao] = useState<{ mensagem: string; tipo: 'sucesso' | 'info' } | null>(null);

  // Persistência automática
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MODO, modoAcesso);
  }, [modoAcesso]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VAGAS, JSON.stringify(vagas));
  }, [vagas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_POLICIAIS, JSON.stringify(policiais));
  }, [policiais]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  }, [logs]);

  const exibirNotificacao = (mensagem: string, tipo: 'sucesso' | 'info' = 'sucesso') => {
    setNotificacao({ mensagem, tipo });
    setTimeout(() => setNotificacao(null), 4000);
  };

  // Restaurar dados originais de demonstração
  const handleRestaurarDemo = () => {
    setConfig(CONFIG_INICIAL);
    const novasVagas = gerarVagasIniciais(CONFIG_INICIAL.mesAnoAtual);
    const novosPoliciais = gerarPoliciaisIniciais(CONFIG_INICIAL.mesAnoAtual);
    setVagas(novasVagas);
    setPoliciais(novosPoliciais);
    setLogs([]);
    setEstatisticas(null);
    exibirNotificacao('Dados de demonstração restaurados com sucesso!');
  };

  // Executar Rotatividade para o Próximo Mês
  const handleAvancarMesRotatividade = () => {
    const [anoStr, mesStr] = config.mesAnoAtual.split('-');
    let ano = parseInt(anoStr, 10);
    let mes = parseInt(mesStr, 10) + 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
    const novoMesAno = `${ano}-${String(mes).padStart(2, '0')}`;

    const primeiroAtual = [...policiais].sort((a, b) => a.ordemEscolha - b.ordemEscolha)[0];
    const novosPoliciaisRotacionados = rotacionarOrdemProximoMes(policiais, false);

    const diasNovoMes = obterDiasDoMes(novoMesAno);
    const maxDia = diasNovoMes.length;

    const policiaisComNovasDatas = novosPoliciaisRotacionados.map(p => {
      const novasDatas = p.datasDisponiveis.map(d => {
        const diaNum = Math.min(parseInt(d.split('-')[2] || '1', 10), maxDia);
        return `${novoMesAno}-${String(diaNum).padStart(2, '0')}`;
      });
      const unicas = Array.from(new Set(novasDatas));
      return {
        ...p,
        datasDisponiveis: unicas.length >= config.minDatasObrigatorias ? unicas : diasNovoMes.slice(0, 6)
      };
    });

    const novasVagas = gerarVagasIniciais(novoMesAno);

    setConfig(prev => ({ ...prev, mesAnoAtual: novoMesAno }));
    setPoliciais(policiaisComNovasDatas);
    setVagas(novasVagas);
    setLogs([]);
    setEstatisticas(null);

    exibirNotificacao(
      `Rotatividade aplicada para ${novoMesAno}! ${primeiroAtual?.nome} agora é o último na fila de escolha.`
    );
  };

  // Alterar Mês e Ano diretamente pelos Dropdowns da barra de navegação
  const handleAlterarMesAno = (novoMesAno: string) => {
    if (novoMesAno === config.mesAnoAtual) return;

    const diasNovoMes = obterDiasDoMes(novoMesAno);
    const maxDiaNovoMes = diasNovoMes.length;

    // Ajusta as datas das vagas da Chefia para o novo mês/ano
    const vagasAjustadas = vagas.map(v => {
      const partes = v.data.split('-');
      const diaNum = Math.min(parseInt(partes[2] || '1', 10), maxDiaNovoMes);
      const novoDia = String(diaNum).padStart(2, '0');
      return {
        ...v,
        data: `${novoMesAno}-${novoDia}`,
        alocados: [] // limpa para nova distribuição do mês selecionado
      };
    });

    // Ajusta as datas dos Policiais para o novo mês/ano
    const policiaisAjustados = policiais.map(p => {
      const novasDatas = p.datasDisponiveis.map(d => {
        const partes = d.split('-');
        const diaNum = Math.min(parseInt(partes[2] || '1', 10), maxDiaNovoMes);
        return `${novoMesAno}-${String(diaNum).padStart(2, '0')}`;
      });
      const datasUnicas = Array.from(new Set(novasDatas));
      return {
        ...p,
        datasDisponiveis: datasUnicas.length >= config.minDatasObrigatorias ? datasUnicas : diasNovoMes.slice(0, 6)
      };
    });

    setConfig(prev => ({ ...prev, mesAnoAtual: novoMesAno }));
    setVagas(vagasAjustadas);
    setPoliciais(policiaisAjustados);
    setLogs([]);
    setEstatisticas(null);

    const [a, m] = novoMesAno.split('-');
    const mesesNomes = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const nomeMes = mesesNomes[parseInt(m, 10) - 1] || m;
    exibirNotificacao(`Mês de referência alterado para ${nomeMes} de ${a}!`);
  };

  // Totais
  const totalVagas = vagas.reduce((acc, v) => acc + v.vagasSolicitadas, 0);
  const totalAlocadas = vagas.reduce((acc, v) => acc + v.alocados.length, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {notificacao && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl border border-emerald-500/40 flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <span>{notificacao.mensagem}</span>
        </div>
      )}

      {/* Navbar Superior com Seletor de Perfil (Chefia vs Administração) */}
      <Navbar
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
        config={config}
        onAbrirConfig={() => setModalConfigAberto(true)}
        onAlterarMesAno={handleAlterarMesAno}
        totalVagas={totalVagas}
        totalPoliciais={policiais.length}
        totalAlocadas={totalAlocadas}
        modoAcesso={modoAcesso}
        setModoAcesso={setModoAcesso}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* PERFIL 1: PORTAL DO USUÁRIO DA CHEFIA (Somente enviar lista com datas ou criar nova vaga + ver lista final) */}
        {modoAcesso === 'chefia' && (
          <ChefiaPortalView
            vagas={vagas}
            setVagas={setVagas}
            turnos={config.turnos}
            config={config}
            policiais={policiais}
          />
        )}

        {/* PERFIL 2: PAINEL DE CONFIGURAÇÃO & ADMINISTRAÇÃO COMPLETA */}
        {modoAcesso === 'admin' && (
          <>
            {abaAtiva === 'chefia' && (
              <ChefiaTab
                vagas={vagas}
                setVagas={setVagas}
                turnos={config.turnos}
                config={config}
                policiais={policiais}
              />
            )}

            {abaAtiva === 'policiais' && (
              <PoliciaisTab
                policiais={policiais}
                setPoliciais={setPoliciais}
                turnos={config.turnos}
                config={config}
                setConfig={setConfig}
                onAvancarMesRotatividade={handleAvancarMesRotatividade}
              />
            )}

            {abaAtiva === 'distribuicao' && (
              <DistribuicaoTab
                vagas={vagas}
                setVagas={setVagas}
                policiais={policiais}
                turnos={config.turnos}
                config={config}
                logs={logs}
                setLogs={setLogs}
                estatisticas={estatisticas}
                setEstatisticas={setEstatisticas}
                onIrParaEscala={() => setAbaAtiva('escala')}
              />
            )}

            {abaAtiva === 'escala' && (
              <EscalaFinalTab
                vagas={vagas}
                policiais={policiais}
                turnos={config.turnos}
                config={config}
                logs={logs}
              />
            )}

            {abaAtiva === 'apache' && (
              <ApacheGuideTab />
            )}
          </>
        )}
      </main>

      {/* Modal de Configurações Gerais */}
      <ConfigModal
        aberto={modalConfigAberto}
        onFechar={() => setModalConfigAberto(false)}
        config={config}
        setConfig={setConfig}
        onRestaurarDemo={handleRestaurarDemo}
      />

      {/* Rodapé Simples - Oculto na Impressão */}
      <footer className="no-print border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sistema Informatizado de DEJEP &bull; Ambientes: Portal da Chefia & Painel de Configuração</span>
          <span className="font-mono text-[11px] text-slate-600">
            Pronto para Apache HTTP Server (.htaccess ativo)
          </span>
        </div>
      </footer>
    </div>
  );
}
