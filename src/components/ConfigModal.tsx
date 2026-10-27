import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Save, 
  Building2, 
  Clock, 
  Sliders, 
  ShieldAlert 
} from 'lucide-react';
import { ConfiguracaoDejep, TurnoConfig } from '../types/dejep';

interface ConfigModalProps {
  aberto: boolean;
  onFechar: () => void;
  config: ConfiguracaoDejep;
  setConfig: React.Dispatch<React.SetStateAction<ConfiguracaoDejep>>;
  onRestaurarDemo: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  aberto,
  onFechar,
  config,
  setConfig,
  onRestaurarDemo
}) => {
  if (!aberto) return null;

  const [formData, setFormData] = useState<ConfiguracaoDejep>({ ...config });
  const [novoTurno, setNovoTurno] = useState<{ nome: string; codigo: string; horarioPadrao: string; chefeNome: string }>({
    nome: '',
    codigo: '',
    horarioPadrao: '07:00 - 19:00',
    chefeNome: ''
  });

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig(formData);
    onFechar();
  };

  const handleAdicionarTurno = () => {
    if (!novoTurno.nome || !novoTurno.codigo) {
      alert('Informe o nome e código do turno.');
      return;
    }

    const id = `t-${Date.now()}`;
    const novo: TurnoConfig = {
      id,
      nome: novoTurno.nome,
      codigo: novoTurno.codigo.toUpperCase(),
      horarioPadrao: novoTurno.horarioPadrao,
      cor: 'blue',
      chefeNome: novoTurno.chefeNome
    };

    setFormData(prev => ({
      ...prev,
      turnos: [...prev.turnos, novo]
    }));

    setNovoTurno({
      nome: '',
      codigo: '',
      horarioPadrao: '07:00 - 19:00',
      chefeNome: ''
    });
  };

  const handleRemoverTurno = (id: string) => {
    if (formData.turnos.length <= 1) {
      alert('É necessário manter ao menos 1 turno cadastrado.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      turnos: prev.turnos.filter(t => t.id !== id)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Configurações Gerais da Unidade & DEJEP</h3>
          </div>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSalvar} className="space-y-5">
          {/* Dados da Unidade Prisional */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              Identificação Institucional
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome da Unidade Prisional / Batalhão / Posto
              </label>
              <input
                type="text"
                value={formData.unidadePrisional}
                onChange={e => setFormData({ ...formData, unidadePrisional: e.target.value })}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Diretor Geral</label>
                <input
                  type="text"
                  value={formData.diretorGeral}
                  onChange={e => setFormData({ ...formData, diretorGeral: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Chefe de Segurança e Disciplina</label>
                <input
                  type="text"
                  value={formData.diretorSeguranca}
                  onChange={e => setFormData({ ...formData, diretorSeguranca: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Parâmetros do Mês e Limites */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-500" />
              Parâmetros Mensais e Regras
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mês de Referência (AAAA-MM)</label>
                <input
                  type="month"
                  value={formData.mesAnoAtual}
                  onChange={e => setFormData({ ...formData, mesAnoAtual: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mínimo de Datas Obrigatórias</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={formData.minDatasObrigatorias}
                  onChange={e => setFormData({ ...formData, minDatasObrigatorias: parseInt(e.target.value, 10) || 5 })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Máximo de Datas Ofertadas</label>
                <input
                  type="number"
                  min="5"
                  max="20"
                  value={formData.maxDatasObrigatorias}
                  onChange={e => setFormData({ ...formData, maxDatasObrigatorias: parseInt(e.target.value, 10) || 10 })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Gerenciamento de Turnos */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Turnos Cadastrados (Abas da Chefia)
            </h4>

            <div className="space-y-2">
              {formData.turnos.map(turno => (
                <div 
                  key={turno.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-400 w-10">{turno.codigo}</span>
                    <span className="font-semibold text-white">{turno.nome}</span>
                    <span className="text-slate-400 font-mono">({turno.horarioPadrao})</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoverTurno(turno.id)}
                    className="text-slate-500 hover:text-red-400 p-1"
                    title="Remover Turno"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Adicionar Novo Turno */}
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Adicionar Novo Turno</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Nome (Ex: Turno 5)"
                  value={novoTurno.nome}
                  onChange={e => setNovoTurno({ ...novoTurno, nome: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                />
                <input
                  type="text"
                  placeholder="Cód (Ex: T5)"
                  value={novoTurno.codigo}
                  onChange={e => setNovoTurno({ ...novoTurno, codigo: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 uppercase font-mono"
                />
                <input
                  type="text"
                  placeholder="Horário (Ex: 06:00 - 14:00)"
                  value={novoTurno.horarioPadrao}
                  onChange={e => setNovoTurno({ ...novoTurno, horarioPadrao: e.target.value })}
                  className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAdicionarTurno}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs px-3 py-1.5 rounded flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Rodapé e Ações */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja recarregar os dados de demonstração originais com todos os turnos e policiais?')) {
                  onRestaurarDemo();
                  onFechar();
                }
              }}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Dados Demo
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onFechar}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar Configurações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
