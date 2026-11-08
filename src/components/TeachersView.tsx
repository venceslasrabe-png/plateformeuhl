import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit2, Mail, Phone, Award } from 'lucide-react';
import { AppData, Teacher } from '../types';
import { uid } from '../services/storage';

interface Props {
  data: AppData;
  onSaveData: (data: AppData) => void;
  onNotify: (msg: string) => void;
}

export const TeachersView: React.FC<Props> = ({ data, onSaveData, onNotify }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<Teacher, 'id'>>({
    nom: '',
    statut: 'Permanent',
    grade: 'Maître de Conférences',
    tel: '',
    email: '',
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      nom: '',
      statut: 'Permanent',
      grade: 'Maître de Conférences',
      tel: '',
      email: '',
    });
    setShowModal(true);
  };

  const handleEdit = (t: Teacher) => {
    setEditingId(t.id);
    setForm({
      nom: t.nom,
      statut: t.statut,
      grade: t.grade,
      tel: t.tel,
      email: t.email,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) return;

    if (editingId) {
      const updated = data.teachers.map((t) => (t.id === editingId ? { ...t, ...form } : t));
      onSaveData({ ...data, teachers: updated });
      onNotify('Informations de l’enseignant mises à jour.');
    } else {
      const newT: Teacher = { id: uid(), ...form };
      onSaveData({ ...data, teachers: [...data.teachers, newT] });
      onNotify('Nouvel enseignant enregistré.');
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    onSaveData({ ...data, teachers: data.teachers.filter((t) => t.id !== id) });
    onNotify('Enseignant retiré de la base.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            Corps Enseignant & Personnel Universitaire
          </h2>
          <p className="text-xs text-slate-500">
            {data.teachers.length} enseignant(s) et personnel(s) administratif(s) référencés
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0f4c3a] text-white text-xs font-bold hover:bg-[#0c3c2e] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter un enseignant
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
              <th className="py-3 px-4">Nom complet</th>
              <th className="py-3 px-4">Statut</th>
              <th className="py-3 px-4">Grade / Fonction</th>
              <th className="py-3 px-4">Contacts</th>
              <th className="py-3 px-4 text-center">Volume Horaire Assigné</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.teachers.map((t) => {
              const assignedHours = data.ec
                .filter((e) => e.ens === t.id)
                .reduce((sum, e) => sum + Number(e.vh || 0), 0);
              return (
                <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {t.nom}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                        t.statut === 'Permanent'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : t.statut === 'Vacataire'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {t.statut}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{t.grade}</td>
                  <td className="py-3 px-4 text-slate-500 space-y-0.5">
                    {t.tel && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{t.tel}</span>
                      </div>
                    )}
                    {t.email && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{t.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {assignedHours} h
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-red-600 hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 font-['Bricolage_Grotesque']">
              {editingId ? 'Modifier la fiche enseignant' : 'Ajouter un enseignant ou personnel'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Nom complet avec titre *
                <input
                  type="text"
                  required
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="ex. Dr. Mavoungou Jean"
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </label>

              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Statut
                <select
                  value={form.statut}
                  onChange={(e) => setForm({ ...form, statut: e.target.value as any })}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Vacataire">Vacataire</option>
                  <option value="Administratif">Personnel Administratif</option>
                </select>
              </label>

              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Grade académique ou fonction
                <input
                  type="text"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  placeholder="ex. Maître de Conférences CAMES, Ingénieur..."
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </label>

              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Numéro de téléphone
                <input
                  type="tel"
                  value={form.tel}
                  onChange={(e) => setForm({ ...form, tel: e.target.value })}
                  placeholder="+242 06 ..."
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </label>

              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Adresse e-mail
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nom@universite-henrilopes.cg"
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0f4c3a] hover:bg-[#0c3c2e] rounded-lg shadow-sm"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
