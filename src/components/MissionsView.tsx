import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Play,
  User,
  Shield,
  Trash2,
} from 'lucide-react';
import { AppData, Mission, RoleType } from '../types';
import { ROLE_LABELS } from '../constants/assets';
import { uid } from '../services/storage';

interface Props {
  data: AppData;
  currentRole: RoleType;
  onSaveData: (data: AppData) => void;
  onNotify: (msg: string) => void;
}

export const MissionsView: React.FC<Props> = ({
  data,
  currentRole,
  onSaveData,
  onNotify,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<Omit<Mission, 'id'>>({
    titre: '',
    desc: '',
    to: `r:${currentRole}`,
    priorite: 'Normale',
    delai: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    statut: 'À faire',
    par: 'Administration',
  });

  const canAssign = currentRole === 'admin' || currentRole === 'direction';

  const handleCreateMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim()) return;

    const newM: Mission = {
      id: uid(),
      ts: Date.now(),
      ...form,
    };

    onSaveData({ ...data, missions: [newM, ...data.missions] });
    setShowAddModal(false);
    setForm({
      titre: '',
      desc: '',
      to: `r:${currentRole}`,
      priorite: 'Normale',
      delai: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
      statut: 'À faire',
      par: 'Administration',
    });
    onNotify('Mission attribuée avec succès.');
  };

  const handleUpdateStatus = (id: string, newStatus: Mission['statut']) => {
    const updated = data.missions.map((m) =>
      m.id === id ? { ...m, statut: newStatus } : m
    );
    onSaveData({ ...data, missions: updated });
    onNotify(`Statut de la mission : ${newStatus}`);
  };

  const handleDeleteMission = (id: string) => {
    onSaveData({ ...data, missions: data.missions.filter((m) => m.id !== id) });
    onNotify('Mission retirée.');
  };

  // Filter missions for current role
  const isTargetedToMe = (m: Mission) => {
    return m.to === `r:${currentRole}` || m.to === 'r:tous';
  };

  const myMissions = data.missions.filter(isTargetedToMe);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            Gestion des Missions & Fiches de Poste
          </h2>
          <p className="text-xs text-slate-500">
            Attribution des tâches opérationnelles, échéances et suivi d’exécution des services
          </p>
        </div>

        {canAssign && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0f4c3a] text-white text-xs font-bold hover:bg-[#0c3c2e] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Attribuer une mission
          </button>
        )}
      </div>

      {/* Section 1: My Missions (Personal Queue) */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-600" />
          Mes missions attribuées ({ROLE_LABELS[currentRole]})
        </h3>

        {myMissions.length === 0 ? (
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400">
            Aucune mission en cours pour votre fonction.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myMissions.map((m) => (
              <div
                key={m.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.priorite === 'Urgente'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : m.priorite === 'Haute'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      Priorité : {m.priorite}
                    </span>

                    <span
                      className={`text-[11px] font-bold ${
                        m.statut === 'Terminée'
                          ? 'text-emerald-600'
                          : m.statut === 'En cours'
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {m.statut}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {m.titre}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {m.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Échéance : {m.delai}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {m.statut !== 'En cours' && m.statut !== 'Terminée' && (
                      <button
                        onClick={() => handleUpdateStatus(m.id, 'En cours')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 text-white font-bold text-[10px] hover:bg-amber-600 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Démarrer
                      </button>
                    )}
                    {m.statut !== 'Terminée' && (
                      <button
                        onClick={() => handleUpdateStatus(m.id, 'Terminée')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0f4c3a] text-white font-bold text-[10px] hover:bg-[#0c3c2e] transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Terminée
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: All Campus Missions (Master Board) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Tableau d'avancement des missions institutionnelles
          </h3>
          <span className="text-xs text-slate-500">{data.missions.length} mission(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Titre de la mission</th>
                <th className="py-2.5 px-4">Attribuée à</th>
                <th className="py-2.5 px-4">Priorité</th>
                <th className="py-2.5 px-4">Échéance</th>
                <th className="py-2.5 px-4">Statut</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.missions.map((m) => {
                const roleKey = m.to.startsWith('r:') ? (m.to.slice(2) as RoleType) : null;
                const roleLabel = roleKey ? ROLE_LABELS[roleKey] || m.to : m.to;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <b className="text-slate-900 dark:text-white block">{m.titre}</b>
                      <span className="text-[11px] text-slate-500 truncate block max-w-xs">
                        {m.desc}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {roleLabel}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.priorite === 'Urgente'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : m.priorite === 'Haute'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {m.priorite}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {m.delai}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span
                        className={`text-[11px] ${
                          m.statut === 'Terminée'
                            ? 'text-emerald-600'
                            : m.statut === 'En cours'
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {m.statut}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {m.statut !== 'Terminée' && (
                          <button
                            onClick={() => handleUpdateStatus(m.id, 'Terminée')}
                            className="p-1 rounded bg-[#0f4c3a] text-white hover:bg-[#0c3c2e]"
                            title="Marquer comme terminée"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canAssign && (
                          <button
                            onClick={() => handleDeleteMission(m.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 font-['Bricolage_Grotesque']">
              Attribuer une mission opérationnelle
            </h3>

            <form onSubmit={handleCreateMission} className="space-y-4">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Titre de la mission *
                <input
                  type="text"
                  required
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  placeholder="ex. Clôture des notes du Semestre 1"
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </label>

              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Description & Instructions
                <textarea
                  rows={3}
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                  placeholder="Détaillez les attendus de la mission..."
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </label>

              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Attribuer à la fonction / service
                <select
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {(Object.keys(ROLE_LABELS) as RoleType[]).map((r) => (
                    <option key={r} value={`r:${r}`}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Priorité
                  <select
                    value={form.priorite}
                    onChange={(e) => setForm({ ...form, priorite: e.target.value as any })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Normale">Normale</option>
                    <option value="Haute">Haute</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Échéance limite
                  <input
                    type="date"
                    required
                    value={form.delai}
                    onChange={(e) => setForm({ ...form, delai: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0f4c3a] hover:bg-[#0c3c2e] rounded-lg shadow-sm"
                >
                  Assigner la mission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
