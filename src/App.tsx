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

import { VagaChefia, Policial, DistribuicaoLog, EstatisticasDistribuicao, ConfiguracaoDejep, ListaArmazenada } from './types/dejep';
import { CONFIG_INICIAL, gerarVagasIniciais, gerarPoliciaisIniciais } from './utils/sampleData';
import { rotacionarOrdemProximoMes, obterDiasDoMes } from './utils/dejepEngine';

const STORAGE_KEY_CONFIG = 'dejep_config_v2';
const STORAGE_KEY_VAGAS = 'dejep_vagas_v_blank';
const STORAGE_KEY_POLICIAIS = 'dejep_policiais_v_blank';
const STORAGE_KEY_LOGS = 'dejep_logs_v_blank';
const STORAGE_KEY_MODO = 'dejep_modo_acesso_v2';
const STORAGE_KEY_LISTAS_ARMAZENADAS = 'dejep_listas_armazenadas_v2';

export default function App() {
  // Modo de Acesso / Perfil: 'admin' (Configuração & Gestão Geral) ou 'chefia' (Portal restrito da Chefia)
  const [modoAcesso, setModoAcesso] = useState<'admin' | 'chefia'>(() => {
    const salvo = localStorage.getItem(STORAGE_KEY_MODO);
    return (salvo === 'chefia' || salvo === 'admin') ? salvo : 'admin';
  });

  // Configuração Institucional
  const [config, setConfig] = useState<ConfiguracaoDejep>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return CONFIG_INICIAL;
  });

  // Vagas da Chefia (Inicia em branco aguardando upload das listas conforme solicitado)
  const [vagas, setVagas] = useState<VagaChefia[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VAGAS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return []; // Em branco aguardando upload
  });

  // Policiais Aptos (Inicia em branco aguardando upload das listas conforme solicitado)
  const [policiais, setPoliciais] = useState<Policial[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_POLICIAIS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return []; // Em branco aguardando upload
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

  // Listas Armazenadas para Consulta Histórica Permanente (Requisito Explícito)
  const [listasArmazenadas, setListasArmazenadas] = useState<ListaArmazenada[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LISTAS_ARMAZENADAS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LISTAS_ARMAZENADAS, JSON.stringify(listasArmazenadas));
  }, [listasArmazenadas]);

  const exibirNotificacao = (mensagem: string, tipo: 'sucesso' | 'info' = 'sucesso') => {
    setNotificacao({ mensagem, tipo });
    setTimeout(() => setNotificacao(null), 4000);
  };

  // Armazenar a Escala Atual no Histórico Permanente para Consulta
  const handleArmazenarEscalaAtual = (
    vagasCustom?: VagaChefia[],
    logsCustom?: DistribuicaoLog[],
    statsCustom?: EstatisticasDistribuicao | null
  ) => {
    const vagasParaSalvar = vagasCustom || vagas;
    const logsParaSalvar = logsCustom || logs;
    const statsParaSalvar = statsCustom !== undefined ? statsCustom : estatisticas;

    const totalAlocadas = vagasParaSalvar.reduce((acc, v) => acc + v.alocados.length, 0);
    if (totalAlocadas === 0 && vagasParaSalvar.length === 0) {
      alert('Não há dados de vagas ou escala para armazenar.');
      return;
    }

    const [ano, mes] = config.mesAnoAtual.split('-');
    const mesesNomes = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const nomeMes = mesesNomes[parseInt(mes, 10) - 1] || mes;

    const novaArmazenada: ListaArmazenada = {
      id: `escala-${config.mesAnoAtual}-${Date.now()}`,
      mesAno: config.mesAnoAtual,
      titulo: `Escala de ${nomeMes}/${ano}`,
      dataCriacao: new Date().toISOString(),
      vagas: JSON.parse(JSON.stringify(vagasParaSalvar)),
      policiais: JSON.parse(JSON.stringify(policiais)),
      logs: JSON.parse(JSON.stringify(logsParaSalvar)),
      estatisticas: statsParaSalvar ? JSON.parse(JSON.stringify(statsParaSalvar)) : null
    };

    setListasArmazenadas(prev => {
      // Remove versão anterior do mesmo mês se houver e adiciona a nova no topo
      const outras = prev.filter(l => l.mesAno !== config.mesAnoAtual);
      return [novaArmazenada, ...outras];
    });

    exibirNotificacao(`Escala de ${nomeMes}/${ano} armazenada com sucesso para consulta permanente!`);
  };

  // Carregar Lista Armazenada para Consulta
  const handleCarregarListaArmazenada = (id: string) => {
    const encontrada = listasArmazenadas.find(l => l.id === id);
    if (!encontrada) return;

    setConfig(prev => ({ ...prev, mesAnoAtual: encontrada.mesAno }));
    setVagas(encontrada.vagas);
    setPoliciais(encontrada.policiais);
    setLogs(encontrada.logs);
    setEstatisticas(encontrada.estatisticas || null);

    exibirNotificacao(`Lista armazenada "${encontrada.titulo}" carregada para consulta!`);
  };

  // Excluir Lista Armazenada do Histórico
  const handleExcluirListaArmazenada = (id: string) => {
    setListasArmazenadas(prev => prev.filter(l => l.id !== id));
    exibirNotificacao('Lista excluída do armazenamento.');
  };

  // Restaurar dados originais de demonstração (se o usuário desejar testar)
  const handleRestaurarDemo = () => {
    setConfig(CONFIG_INICIAL);
    const novasVagas = gerarVagasIniciais(CONFIG_INICIAL.mesAnoAtual);
    const novosPoliciais = gerarPoliciaisIniciais(CONFIG_INICIAL.mesAnoAtual);
    setVagas(novasVagas);
    setPoliciais(novosPoliciais);
    setLogs([]);
    setEstatisticas(null);
    exibirNotificacao('Dados de demonstração carregados com sucesso!');
  };

  // Limpar tudo para branco
  const handleLimparParaBranco = () => {
    if (window.confirm('Confirma limpar todos os dados e deixar em branco aguardando upload das listas?')) {
      setVagas([]);
      setPoliciais([]);
      setLogs([]);
      setEstatisticas(null);
      exibirNotificacao('Sistema limpo em branco, aguardando upload das planilhas.');
    }
  };

  // Executar Rotatividade para o Próximo Mês
  const handleAvancarMesRotatividade = () => {
    if (policiais.length === 0) {
      alert('Não há policiais cadastrados para rotacionar. Carregue a lista de policiais primeiro.');
      return;
    }

    const [anoStr, mesStr] = config.mesAnoAtual.split('-');
    let ano = parseInt(anoStr, 10);
    let mes = parseInt(mesStr, 10) + 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
    const novoMesAno = `${ano}-${String(mes).padStart(2, '0')}`;

    const primeiroAtual = [...policiais].sort((a, b) => a.ordemEscolha - b.ordemEscolha)[0];
    const novosPoliciaisRotacionados = rotacionarOrdemProximoMes(policiais, true);

    setConfig(prev => ({ ...prev, mesAnoAtual: novoMesAno }));
    setPoliciais(novosPoliciaisRotacionados);
    setVagas([]); // Deixa vagas em branco para o novo mês aguardando envio da Chefia
    setLogs([]);
    setEstatisticas(null);

    exibirNotificacao(
      `Rotatividade aplicada para ${novoMesAno}! ${primeiroAtual?.nome} agora é o último na fila de escolha.`
    );
  };

  // Alterar Mês e Ano diretamente pelos Dropdowns da barra de navegação
  const handleAlterarMesAno = (novoMesAno: string) => {
    if (novoMesAno === config.mesAnoAtual) return;

    setConfig(prev => ({ ...prev, mesAnoAtual: novoMesAno }));

    // Se já temos uma lista armazenada para este mês, podemos avisar
    const arquivada = listasArmazenadas.find(l => l.mesAno === novoMesAno);
    if (arquivada) {
      if (window.confirm(`Existe uma lista oficial armazenada para ${novoMesAno}. Deseja carregá-la para consulta?`)) {
        handleCarregarListaArmazenada(arquivada.id);
        return;
      }
    }

    // Caso contrário, ajusta para o novo período
    const diasNovoMes = obterDiasDoMes(novoMesAno);
    const maxDiaNovoMes = diasNovoMes.length;

    const vagasAjustadas = vagas.map(v => {
      const partes = v.data.split('-');
      const diaNum = Math.min(parseInt(partes[2] || '1', 10), maxDiaNovoMes);
      const novoDia = String(diaNum).padStart(2, '0');
      return {
        ...v,
        data: `${novoMesAno}-${novoDia}`,
        alocados: []
      };
    });

    const policiaisAjustados = policiais.map(p => {
      const novasDatas = p.datasDisponiveis.map(d => {
        const partes = d.split('-');
        const diaNum = Math.min(parseInt(partes[2] || '1', 10), maxDiaNovoMes);
        return `${novoMesAno}-${String(diaNum).padStart(2, '0')}`;
      });
      return {
        ...p,
        datasDisponiveis: Array.from(new Set(novasDatas))
      };
    });

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

      {/* Navbar Superior com Seletores de Mês/Ano e Perfil */}
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
        {/* Banner Informativo quando o sistema está em branco */}
        {vagas.length === 0 && policiais.length === 0 && (
          <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-slate-300">
                <strong>Sistema em Branco:</strong> Aguardando o upload das listas de vagas e policiais (.xlsx) ou o cadastro manual para o mês de {config.mesAnoAtual}.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestaurarDemo}
                className="text-slate-400 hover:text-white underline cursor-pointer"
                title="Carregar dados de demonstração para visualização rápida"
              >
                Carregar Dados de Demonstração (Opcional)
              </button>
            </div>
          </div>
        )}

        {/* PERFIL 1: PORTAL DO USUÁRIO DA CHEFIA (Exibição exclusivamente em versão calendário) */}
        {modoAcesso === 'chefia' && (
          <ChefiaPortalView
            vagas={vagas}
            setVagas={setVagas}
            turnos={config.turnos}
            config={config}
            policiais={policiais}
            listasArmazenadas={listasArmazenadas}
            onCarregarListaArmazenada={handleCarregarListaArmazenada}
          />
        )}

        {/* PERFIL 2: PAINEL DE CONFIGURAÇÃO & ADMINISTRAÇÃO GERAL */}
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
                onArmazenarEscala={handleArmazenarEscalaAtual}
              />
            )}

            {abaAtiva === 'escala' && (
              <EscalaFinalTab
                vagas={vagas}
                policiais={policiais}
                turnos={config.turnos}
                config={config}
                logs={logs}
                listasArmazenadas={listasArmazenadas}
                onArmazenarEscala={handleArmazenarEscalaAtual}
                onCarregarListaArmazenada={handleCarregarListaArmazenada}
                onExcluirListaArmazenada={handleExcluirListaArmazenada}
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
          <span>Sistema Informatizado de DEJEP &bull; Versão Calendário & Armazenamento Histórico</span>
          <span className="font-mono text-[11px] text-slate-600">
            Pronto para Servidor Apache (.htaccess ativo)
          </span>
        </div>
      </footer>
    </div>
  );
}
