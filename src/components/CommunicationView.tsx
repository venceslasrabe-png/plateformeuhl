import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, Send, Clock, Users } from 'lucide-react';
import { Announcement, AppData } from '../types';
import { uid } from '../services/storage';

interface Props {
  data: AppData;
  onSaveData: (data: AppData) => void;
  onNotify: (msg: string) => void;
}

export const CommunicationView: React.FC<Props> = ({ data, onSaveData, onNotify }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<Omit<Announcement, 'id'>>({
    titre: '',
    cible: 'Tous',
    msg: '',
  });

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim() || !form.msg.trim()) return;

    const newAnn: Announcement = {
      id: uid(),
      ts: Date.now(),
      ...form,
    };

    onSaveData({
      ...data,
      ann: [newAnn, ...data.ann],
      seen: data.ann.length + 1,
    });
    setShowAddModal(false);
    setForm({ titre: '', cible: 'Tous', msg: '' });
    onNotify('Annonce officielle diffusée !');
  };

  const handleDelete = (id: string) => {
    onSaveData({ ...data, ann: data.ann.filter((a) => a.id !== id) });
    onNotify('Annonce supprimée.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            Communication & Annonces Officielles
          </h2>
          <p className="text-xs text-slate-500">
            Canal de diffusion pour les étudiants, enseignants, la scolarité et la caisse
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0f4c3a] text-white text-xs font-bold hover:bg-[#0c3c2e] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Publier une annonce
        </button>
      </div>

      {/* Announcements Feed */}
      <div className="space-y-3">
        {data.ann.length === 0 ? (
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400">
            Aucune annonce diffusée actuellement.
          </div>
        ) : (
          data.ann.map((ann) => {
            const timeStr = ann.ts
              ? new Date(ann.ts).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Récent';

            const targetBadgeColor =
              ann.cible === 'Tous'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                : ann.cible === 'Étudiants'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : ann.cible === 'Enseignants'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                : ann.cible === 'Caisse'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';

            return (
              <div
                key={ann.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${targetBadgeColor}`}>
                      Cible : {ann.cible}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {ann.titre}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {ann.msg}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                    <Clock className="w-3 h-3" />
                    <span>{timeStr}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(ann.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                  title="Supprimer l'annonce"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 font-['Bricolage_Grotesque'] flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-emerald-600" />
              Diffuser une nouvelle annonce
            </h3>

            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Titre de l'annonce *
                <input
                  type="text"
                  required
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  placeholder="ex. Rentrée académique ou Calendrier d'examens"
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </label>

              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Destinataires
                <select
                  value={form.cible}
                  onChange={(e) => setForm({ ...form, cible: e.target.value as any })}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Tous">Tous (Campus complet)</option>
                  <option value="Étudiants">Étudiants</option>
                  <option value="Enseignants">Enseignants & Personnel</option>
                  <option value="Administration">Administration & Scolarité</option>
                  <option value="Caisse">Caisse</option>
                </select>
              </label>

              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Message / Contenu *
                <textarea
                  required
                  rows={4}
                  value={form.msg}
                  onChange={(e) => setForm({ ...form, msg: e.target.value })}
                  placeholder="Rédigez le texte de votre communiqué officiel..."
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </label>

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
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#0f4c3a] hover:bg-[#0c3c2e] rounded-lg shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
