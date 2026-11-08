import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  GraduationCap,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { AppData, Cycle, EC, Parcours, Semester, TimetableEntry, UE } from '../types';
import { uid } from '../services/storage';
import { exportAcademicExcel } from '../services/excelExporter';

interface Props {
  data: AppData;
  onSaveData: (data: AppData) => void;
  onNotify: (msg: string) => void;
}

export const AcademicView: React.FC<Props> = ({ data, onSaveData, onNotify }) => {
  const [activeTab, setActiveTab] = useState<'parcours' | 'ue' | 'ec' | 'edt'>('parcours');

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sub-entity form states
  const [parcoursForm, setParcoursForm] = useState<Omit<Parcours, 'id'>>({
    nom: '',
    dom: 'Sciences et Technologies',
    cycle: 'Licence',
  });

  const [ueForm, setUeForm] = useState<Omit<UE, 'id'>>({
    code: '',
    nom: '',
    parcours: data.parcours[0]?.id || '',
    sem: 'S1',
    cred: 6,
  });

  const [ecForm, setEcForm] = useState<Omit<EC, 'id'>>({
    code: '',
    nom: '',
    ue: data.ue[0]?.id || '',
    coef: 2,
    vh: 30,
    ens: data.teachers[0]?.id || '',
  });

  const [edtForm, setEdtForm] = useState<Omit<TimetableEntry, 'id'>>({
    jour: 'Lundi',
    debut: '08:00',
    fin: '10:00',
    ec: data.ec[0]?.id || '',
    salle: 'Amphithéâtre A',
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    if (activeTab === 'parcours') {
      setParcoursForm({ nom: '', dom: 'Sciences et Technologies', cycle: 'Licence' });
    } else if (activeTab === 'ue') {
      setUeForm({
        code: '',
        nom: '',
        parcours: data.parcours[0]?.id || '',
        sem: 'S1',
        cred: 6,
      });
    } else if (activeTab === 'ec') {
      setEcForm({
        code: '',
        nom: '',
        ue: data.ue[0]?.id || '',
        coef: 2,
        vh: 30,
        ens: data.teachers[0]?.id || '',
      });
    } else if (activeTab === 'edt') {
      setEdtForm({
        jour: 'Lundi',
        debut: '08:00',
        fin: '10:00',
        ec: data.ec[0]?.id || '',
        salle: 'Salle 101',
      });
    }
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'parcours') {
      if (!parcoursForm.nom.trim()) return;
      if (editingId) {
        const updated = data.parcours.map((p) =>
          p.id === editingId ? { ...p, ...parcoursForm } : p
        );
        onSaveData({ ...data, parcours: updated });
        onNotify('Parcours modifié.');
      } else {
        const newP: Parcours = { id: uid(), ...parcoursForm };
        onSaveData({ ...data, parcours: [...data.parcours, newP] });
        onNotify('Nouveau parcours créé.');
      }
    } else if (activeTab === 'ue') {
      if (!ueForm.nom.trim() || !ueForm.code.trim()) return;
      if (editingId) {
        const updated = data.ue.map((u) => (u.id === editingId ? { ...u, ...ueForm } : u));
        onSaveData({ ...data, ue: updated });
        onNotify('UE modifiée.');
      } else {
        const newUe: UE = { id: uid(), ...ueForm };
        onSaveData({ ...data, ue: [...data.ue, newUe] });
        onNotify('Nouvelle UE créée.');
      }
    } else if (activeTab === 'ec') {
      if (!ecForm.nom.trim() || !ecForm.code.trim()) return;
      if (editingId) {
        const updated = data.ec.map((e) => (e.id === editingId ? { ...e, ...ecForm } : e));
        onSaveData({ ...data, ec: updated });
        onNotify('Matière modifiée.');
      } else {
        const newEc: EC = { id: uid(), ...ecForm };
        onSaveData({ ...data, ec: [...data.ec, newEc] });
        onNotify('Nouvelle matière créée.');
      }
    } else if (activeTab === 'edt') {
      if (editingId) {
        const updated = data.edt.map((item) =>
          item.id === editingId ? { ...item, ...edtForm } : item
        );
        onSaveData({ ...data, edt: updated });
        onNotify('Séance d’emploi du temps modifiée.');
      } else {
        const newEdt: TimetableEntry = { id: uid(), ...edtForm };
        onSaveData({ ...data, edt: [...data.edt, newEdt] });
        onNotify('Créneau de cours ajouté.');
      }
    }
    setShowAddModal(false);
  };

  const handleDeleteItem = (id: string) => {
    if (activeTab === 'parcours') {
      onSaveData({ ...data, parcours: data.parcours.filter((p) => p.id !== id) });
    } else if (activeTab === 'ue') {
      onSaveData({ ...data, ue: data.ue.filter((u) => u.id !== id) });
    } else if (activeTab === 'ec') {
      onSaveData({ ...data, ec: data.ec.filter((e) => e.id !== id) });
    } else if (activeTab === 'edt') {
      onSaveData({ ...data, edt: data.edt.filter((e) => e.id !== id) });
    }
    onNotify('Élément supprimé.');
  };

  const daysList: Array<TimetableEntry['jour']> = [
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            Architecture Académique & Maquettes LMD
          </h2>
          <p className="text-xs text-slate-500">
            Gestion des parcours de formation, unités d’enseignement (UE), matières (EC) et plannings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportAcademicExcel(data)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Exporter maquette
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f4c3a] text-white text-xs font-bold hover:bg-[#0c3c2e] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter un élément
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('parcours')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'parcours'
              ? 'bg-[#e8b923] text-slate-950 font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          1. Parcours ({data.parcours.length})
        </button>

        <button
          onClick={() => setActiveTab('ue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'ue'
              ? 'bg-[#e8b923] text-slate-950 font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          2. Unités d’Enseignement UE ({data.ue.length})
        </button>

        <button
          onClick={() => setActiveTab('ec')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'ec'
              ? 'bg-[#e8b923] text-slate-950 font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          3. Matières EC ({data.ec.length})
        </button>

        <button
          onClick={() => setActiveTab('edt')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'edt'
              ? 'bg-[#e8b923] text-slate-950 font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          4. Emploi du Temps ({data.edt.length})
        </button>
      </div>

      {/* Tab 1: Parcours */}
      {activeTab === 'parcours' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-3 px-4">Intitulé du parcours</th>
                <th className="py-3 px-4">Domaine</th>
                <th className="py-3 px-4">Cycle</th>
                <th className="py-3 px-4">Étudiants inscrits</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.parcours.map((p) => {
                const count = data.students.filter((s) => s.parcours === p.id).length;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {p.nom}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{p.dom}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full font-semibold text-[10px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {p.cycle}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {count} étudiant(s)
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteItem(p.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: UE */}
      {activeTab === 'ue' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-3 px-4">Code UE</th>
                <th className="py-3 px-4">Intitulé de l’UE</th>
                <th className="py-3 px-4">Parcours</th>
                <th className="py-3 px-4">Semestre</th>
                <th className="py-3 px-4">Crédits (ECTS)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.ue.map((u) => {
                const p = data.parcours.find((item) => item.id === u.parcours);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {u.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {u.nom}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{p?.nom || '—'}</td>
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                      {u.sem}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {u.cred} ECTS
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteItem(u.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: EC */}
      {activeTab === 'ec' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-3 px-4">Code EC</th>
                <th className="py-3 px-4">Intitulé de la Matière</th>
                <th className="py-3 px-4">UE de Rattachement</th>
                <th className="py-3 px-4">Coefficient</th>
                <th className="py-3 px-4">Volume Horaire</th>
                <th className="py-3 px-4">Enseignant</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.ec.map((e) => {
                const u = data.ue.find((item) => item.id === e.ue);
                const t = data.teachers.find((item) => item.id === e.ens);
                return (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {e.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {e.nom}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{u?.nom || '—'}</td>
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                      {e.coef}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {e.vh} h
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                      {t?.nom || 'Non assigné'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteItem(e.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Emploi du Temps + Visual Grid */}
      {activeTab === 'edt' && (
        <div className="space-y-6">
          {/* Weekly Schedule Visual Matrix */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
              Planning Hebdomadaire — Semaine Type
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Visualisation des cours programmés par jour et créneau horaire
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              {daysList.map((day) => {
                const daySessions = data.edt
                  .filter((item) => item.jour === day)
                  .sort((a, b) => a.debut.localeCompare(b.debut));
                return (
                  <div
                    key={day}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3 flex flex-col"
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700 mb-2">
                      {day}
                    </div>

                    <div className="space-y-2 flex-1">
                      {daySessions.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic block py-4 text-center">
                          Aucun cours
                        </span>
                      ) : (
                        daySessions.map((session) => {
                          const ec = data.ec.find((x) => x.id === session.ec);
                          const t = ec ? data.teachers.find((item) => item.id === ec.ens) : null;
                          return (
                            <div
                              key={session.id}
                              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xs text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                                <span>{session.debut} - {session.fin}</span>
                              </div>
                              <b className="block text-slate-900 dark:text-white leading-tight">
                                {ec?.nom || 'Matière'}
                              </b>
                              <div className="text-[10px] text-slate-500">
                                <span>{session.salle}</span>
                                {t && <span> · {t.nom}</span>}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* List Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Jour</th>
                  <th className="py-3 px-4">Créneau horaire</th>
                  <th className="py-3 px-4">Matière</th>
                  <th className="py-3 px-4">Salle</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.edt.map((item) => {
                  const ec = data.ec.find((x) => x.id === item.ec);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {item.jour}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        {item.debut} - {item.fin}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {ec?.nom || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{item.salle}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 font-['Bricolage_Grotesque']">
              {activeTab === 'parcours' && 'Ajouter un Parcours de formation'}
              {activeTab === 'ue' && 'Ajouter une Unité d’Enseignement (UE)'}
              {activeTab === 'ec' && 'Ajouter une Matière (Élément Constitutif)'}
              {activeTab === 'edt' && 'Ajouter un créneau à l’Emploi du Temps'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'parcours' && (
                <>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Intitulé du parcours *
                    <input
                      type="text"
                      required
                      value={parcoursForm.nom}
                      onChange={(e) => setParcoursForm({ ...parcoursForm, nom: e.target.value })}
                      placeholder="ex. Informatique de Gestion"
                      className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Domaine
                    <input
                      type="text"
                      value={parcoursForm.dom}
                      onChange={(e) => setParcoursForm({ ...parcoursForm, dom: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Cycle
                    <select
                      value={parcoursForm.cycle}
                      onChange={(e) =>
                        setParcoursForm({ ...parcoursForm, cycle: e.target.value as Cycle })
                      }
                      className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Licence">Licence</option>
                      <option value="Master">Master</option>
                      <option value="Doctorat">Doctorat</option>
                    </select>
                  </label>
                </>
              )}

              {activeTab === 'ue' && (
                <>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Code UE *
                    <input
                      type="text"
                      required
                      value={ueForm.code}
                      onChange={(e) => setUeForm({ ...ueForm, code: e.target.value })}
                      placeholder="ex. INF101"
                      className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Intitulé de l'UE *
                    <input
                      type="text"
                      required
                      value={ueForm.nom}
                      onChange={(e) => setUeForm({ ...ueForm, nom: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Parcours rattaché
                    <select
                      value={ueForm.parcours}
                      onChange={(e) => setUeForm({ ...ueForm, parcours: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {data.parcours.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Semestre
                      <select
                        value={ueForm.sem}
                        onChange={(e) => setUeForm({ ...ueForm, sem: e.target.value as Semester })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="S1">S1</option>
                        <option value="S2">S2</option>
                        <option value="S3">S3</option>
                        <option value="S4">S4</option>
                        <option value="S5">S5</option>
                        <option value="S6">S6</option>
                      </select>
                    </label>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Crédits (ECTS)
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={ueForm.cred}
                        onChange={(e) => setUeForm({ ...ueForm, cred: Number(e.target.value) })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'ec' && (
                <>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Code Matière *
                    <input
                      type="text"
                      required
                      value={ecForm.code}
                      onChange={(e) => setEcForm({ ...ecForm, code: e.target.value })}
                      placeholder="ex. INF101-1"
                      className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Intitulé de la Matière *
                    <input
                      type="text"
                      required
                      value={ecForm.nom}
                      onChange={(e) => setEcForm({ ...ecForm, nom: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    UE de rattachement
                    <select
                      value={ecForm.ue}
                      onChange={(e) => setEcForm({ ...ecForm, ue: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {data.ue.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.code} - {u.nom}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Coefficient
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={ecForm.coef}
                        onChange={(e) => setEcForm({ ...ecForm, coef: Number(e.target.value) })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Volume Horaire (h)
                      <input
                        type="number"
                        min="5"
                        value={ecForm.vh}
                        onChange={(e) => setEcForm({ ...ecForm, vh: Number(e.target.value) })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                  </div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Enseignant titulaire
                    <select
                      value={ecForm.ens}
                      onChange={(e) => setEcForm({ ...ecForm, ens: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {data.teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nom} ({t.grade})
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              {activeTab === 'edt' && (
                <>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Jour de la semaine
                    <select
                      value={edtForm.jour}
                      onChange={(e) =>
                        setEdtForm({ ...edtForm, jour: e.target.value as TimetableEntry['jour'] })
                      }
                      className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {daysList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Heure de début
                      <input
                        type="time"
                        value={edtForm.debut}
                        onChange={(e) => setEdtForm({ ...edtForm, debut: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Heure de fin
                      <input
                        type="time"
                        value={edtForm.fin}
                        onChange={(e) => setEdtForm({ ...edtForm, fin: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                  </div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Matière enseignée
                    <select
                      value={edtForm.ec}
                      onChange={(e) => setEdtForm({ ...edtForm, ec: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {data.ec.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.code} - {e.nom}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Salle de cours / Amphithéâtre
                    <input
                      type="text"
                      value={edtForm.salle}
                      onChange={(e) => setEdtForm({ ...edtForm, salle: e.target.value })}
                      placeholder="Amphi A, Salle 102..."
                      className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </label>
                </>
              )}

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
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0f4c3a] hover:bg-[#0c3c2e] rounded-lg"
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
