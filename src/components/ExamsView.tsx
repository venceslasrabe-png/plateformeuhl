import React, { useState } from 'react';
import {
  FileCheck2,
  Calendar,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { AppData, Exam, Semester } from '../types';
import { calcSemesterResult, uid } from '../services/storage';
import { downloadDeliberationPvPdf } from '../services/pdfGenerator';
import { SEMESTERS } from '../constants/assets';

interface Props {
  data: AppData;
  onSaveData: (data: AppData) => void;
  onNotify: (msg: string) => void;
}

export const ExamsView: React.FC<Props> = ({ data, onSaveData, onNotify }) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'deliberations'>('calendar');

  // Calendar form
  const [showAddModal, setShowAddModal] = useState(false);
  const [examForm, setExamForm] = useState<Omit<Exam, 'id'>>({
    ec: data.ec[0]?.id || '',
    session: 'Normale',
    date: new Date().toISOString().slice(0, 10),
    salle: 'Amphithéâtre Nelson Mandela',
  });

  // Deliberations selection
  const [selectedParcoursId, setSelectedParcoursId] = useState<string>(
    data.parcours[0]?.id || ''
  );
  const [selectedSem, setSelectedSem] = useState<Semester>('S1');

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    const newExam: Exam = { id: uid(), ...examForm };
    onSaveData({ ...data, exams: [...data.exams, newExam] });
    setShowAddModal(false);
    onNotify('Épreuve d’examen programmée.');
  };

  const handleDeleteExam = (id: string) => {
    onSaveData({ ...data, exams: data.exams.filter((x) => x.id !== id) });
    onNotify('Épreuve retirée du calendrier.');
  };

  const deliberationStudents = data.students.filter(
    (s) => s.parcours === selectedParcoursId
  );

  const stats = {
    total: deliberationStudents.length,
    admis: 0,
    rattrapage: 0,
    ajourne: 0,
    incomplet: 0,
  };

  deliberationStudents.forEach((s) => {
    const res = calcSemesterResult(s.id, selectedSem, data);
    if (res.dec === 'Admis') stats.admis++;
    else if (res.dec === 'Rattrapage') stats.rattrapage++;
    else if (res.dec === 'Ajourné') stats.ajourne++;
    else stats.incomplet++;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            Examens et Délibérations du Jury LMD
          </h2>
          <p className="text-xs text-slate-500">
            Organisation des épreuves semestrielles et procès-verbaux de délibération
          </p>
        </div>

        {activeTab === 'calendar' ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f4c3a] text-white text-xs font-bold hover:bg-[#0c3c2e] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Programmer une épreuve
          </button>
        ) : (
          <button
            onClick={() => downloadDeliberationPvPdf(selectedParcoursId, selectedSem, data)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f4c3a] text-white text-xs font-bold hover:bg-[#0c3c2e] transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Télécharger le PV de délibération PDF
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'calendar'
              ? 'bg-[#e8b923] text-slate-950 font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendrier des Examens ({data.exams.length})
        </button>

        <button
          onClick={() => setActiveTab('deliberations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'deliberations'
              ? 'bg-[#e8b923] text-slate-950 font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Délibérations & Procès-Verbaux
        </button>
      </div>

      {/* Tab 1: Calendar */}
      {activeTab === 'calendar' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-3 px-4">Date de l’épreuve</th>
                <th className="py-3 px-4">Matière</th>
                <th className="py-3 px-4">Session</th>
                <th className="py-3 px-4">Salle / Amphithéâtre</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.exams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Aucune épreuve d'examen n'est programmée pour le moment.
                  </td>
                </tr>
              ) : (
                data.exams.map((ex) => {
                  const ec = data.ec.find((x) => x.id === ex.ec);
                  return (
                    <tr key={ex.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {new Date(ex.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-800 dark:text-emerald-300">
                        {ec?.code} — {ec?.nom}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            ex.session === 'Normale'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          Session {ex.session}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{ex.salle}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteExam(ex.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Deliberations */}
      {activeTab === 'deliberations' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Parcours de formation
              <select
                value={selectedParcoursId}
                onChange={(e) => setSelectedParcoursId(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                {data.parcours.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom} ({p.cycle})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Semestre de délibération
              <select
                value={selectedSem}
                onChange={(e) => setSelectedSem(e.target.value as any)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    Semestre {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block">Total Candidats</span>
              <b className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {stats.total}
              </b>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-emerald-600 block">Admis (Validation)</span>
              <b className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {stats.admis} ({stats.total ? Math.round((stats.admis / stats.total) * 100) : 0}%)
              </b>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-amber-600 block">Rattrapage</span>
              <b className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">
                {stats.rattrapage}
              </b>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-red-600 block">Ajournés</span>
              <b className="text-xl font-bold font-mono text-red-700 dark:text-red-400">
                {stats.ajourne}
              </b>
            </div>
          </div>

          {/* Deliberation Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Matricule</th>
                  <th className="py-3 px-4">Nom(s) & Prénom(s)</th>
                  <th className="py-3 px-4 text-center">Moyenne {selectedSem}</th>
                  <th className="py-3 px-4 text-center">Crédits Validés</th>
                  <th className="py-3 px-4 text-center">Décision du Jury</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {deliberationStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Aucun étudiant inscrit dans ce parcours.
                    </td>
                  </tr>
                ) : (
                  deliberationStudents.map((s) => {
                    const res = calcSemesterResult(s.id, selectedSem, data);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {s.mat}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {s.nom} {s.prenom}
                        </td>
                        <td className="py-3 px-4 text-center font-bold font-mono">
                          {res.moy !== null ? res.moy.toFixed(2) : '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {res.cr} / {res.tot}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full font-bold text-[10px] ${
                              res.dec === 'Admis'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : res.dec === 'Ajourné'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : res.dec === 'Rattrapage'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {res.dec}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Exam Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 font-['Bricolage_Grotesque']">
              Programmer une épreuve d'examen
            </h3>
            <form onSubmit={handleAddExam} className="space-y-4">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Matière concernée
                <select
                  value={examForm.ec}
                  onChange={(e) => setExamForm({ ...examForm, ec: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {data.ec.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.code} — {e.nom}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Session
                <select
                  value={examForm.session}
                  onChange={(e) =>
                    setExamForm({ ...examForm, session: e.target.value as any })
                  }
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Normale">Session Normale</option>
                  <option value="Rattrapage">Session de Rattrapage</option>
                </select>
              </label>

              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Date de l'épreuve
                <input
                  type="date"
                  required
                  value={examForm.date}
                  onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </label>

              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Salle / Amphithéâtre
                <input
                  type="text"
                  required
                  value={examForm.salle}
                  onChange={(e) => setExamForm({ ...examForm, salle: e.target.value })}
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
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0f4c3a] hover:bg-[#0c3c2e] rounded-lg"
                >
                  Programmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
