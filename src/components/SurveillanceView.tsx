import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  LogIn,
  LogOut,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { AppData, Student } from '../types';
import {
  getStudentLastClassEnd,
  isStudentLateOnCampus,
  uid,
} from '../services/storage';
import { exportSurveillanceExcel } from '../services/excelExporter';

interface Props {
  data: AppData;
  onSaveData: (data: AppData) => void;
  onNotify: (msg: string) => void;
}

export const SurveillanceView: React.FC<Props> = ({ data, onSaveData, onNotify }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);
  const isDateToday = (timestamp: number) => {
    return new Date(timestamp).toISOString().slice(0, 10) === todayStr;
  };

  // Find active on-site session for a student
  const getActiveSession = (studentId: string) => {
    return data.surv.find((x) => x.etu === studentId && !x.out && isDateToday(x.in));
  };

  // Check in
  const handleCheckIn = (studentId: string) => {
    const student = data.students.find((s) => s.id === studentId);
    const existing = getActiveSession(studentId);
    if (existing) {
      onNotify(`${student?.prenom} ${student?.nom} est déjà enregistré sur le campus.`);
      return;
    }

    const newRecord = {
      id: uid(),
      etu: studentId,
      in: Date.now(),
      out: null,
    };

    onSaveData({ ...data, surv: [newRecord, ...data.surv] });
    onNotify(`Arrivée enregistrée : ${student?.prenom} ${student?.nom}`);
  };

  // Check out
  const handleCheckOut = (studentId: string) => {
    const student = data.students.find((s) => s.id === studentId);
    const active = getActiveSession(studentId);
    if (!active) {
      onNotify(`${student?.prenom} ${student?.nom} n’est pas marqué présent sur le campus.`);
      return;
    }

    const updatedSurv = data.surv.map((item) =>
      item.id === active.id ? { ...item, out: Date.now() } : item
    );

    onSaveData({ ...data, surv: updatedSurv });
    onNotify(`Sortie enregistrée : ${student?.prenom} ${student?.nom}`);
  };

  // Fast Barcode / Matricule Scan Handler
  const handleFastScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toUpperCase();
    if (!q) return;

    const student = data.students.find(
      (s) => s.mat.toUpperCase() === q || `${s.nom} ${s.prenom}`.toUpperCase().includes(q)
    );

    if (!student) {
      onNotify(`Aucun étudiant trouvé pour "${searchQuery}".`);
      return;
    }

    const active = getActiveSession(student.id);
    if (active) {
      handleCheckOut(student.id);
    } else {
      handleCheckIn(student.id);
    }
    setSearchQuery('');
  };

  // KPIs
  const currentlyOnCampus = data.students.filter((s) => !!getActiveSession(s.id));
  const todayEntries = data.surv.filter((x) => isDateToday(x.in));
  const lateStudents = currentlyOnCampus.filter((s) => isStudentLateOnCampus(s, data));

  // Filter list
  const filteredStudents = data.students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      s.mat.toLowerCase().includes(q) ||
      s.nom.toLowerCase().includes(q) ||
      s.prenom.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            Surveillance & Contrôle des Accès au Campus
          </h2>
          <p className="text-xs text-slate-500">
            Enregistrement en temps réel des flux d'entrées/sorties à la guérite principale
          </p>
        </div>

        <button
          onClick={() => exportSurveillanceExcel(data)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Exporter le registre (Excel)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">Étudiants Présents sur le Campus</span>
          <b className="text-2xl font-bold font-['Bricolage_Grotesque'] text-emerald-700 dark:text-emerald-400">
            {currentlyOnCampus.length}
          </b>
          <span className="text-[11px] text-slate-400 block mt-1">Badgeage actif en ce moment</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">Total Entrées Aujourd’hui</span>
          <b className="text-2xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            {todayEntries.length}
          </b>
          <span className="text-[11px] text-slate-400 block mt-1">Passages à la guérite</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">Présences Prolongées à Vérifier</span>
          <b
            className={`text-2xl font-bold font-['Bricolage_Grotesque'] ${
              lateStudents.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {lateStudents.length}
          </b>
          <span className="text-[11px] text-slate-400 block mt-1">
            Fin des cours &gt; 1h sans sortie
          </span>
        </div>
      </div>

      {/* Overdue Exit Alerts */}
      {lateStudents.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-2">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Alertes de surveillance : Sorties tardives non enregistrées</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {lateStudents.map((s) => {
              const lastClass = getStudentLastClassEnd(s, data);
              return (
                <div
                  key={s.id}
                  className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 text-xs flex items-center justify-between"
                >
                  <div>
                    <b className="text-slate-900 dark:text-white block truncate">
                      {s.nom} {s.prenom}
                    </b>
                    <span className="text-[11px] text-slate-400 font-mono">{s.mat}</span>
                    <span className="text-[10px] text-red-600 block">
                      Cours terminé à {lastClass || '—'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCheckOut(s.id)}
                    className="px-2 py-1 rounded bg-red-600 text-white font-semibold text-[10px] hover:bg-red-700"
                  >
                    Pointer sortie
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fast Scanner Input */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <form onSubmit={handleFastScanSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Scanner la carte d'étudiant ou taper le matricule/nom puis Entrée..."
              className="w-full pl-9 pr-3 py-2.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#0f4c3a] text-white text-xs font-bold rounded-lg hover:bg-[#0c3c2e] transition-colors shadow-sm"
          >
            Pointer
          </button>
        </form>
      </div>

      {/* Two Column Layout: Students Live Status & Daily Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students Table with Direct Check-in / Out Button */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Contrôle d'accès par étudiant
            </h3>
            <span className="text-xs text-slate-500">{filteredStudents.length} étudiant(s)</span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Matricule</th>
                  <th className="py-2.5 px-3">Étudiant</th>
                  <th className="py-2.5 px-3">Statut actuel</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((s) => {
                  const active = getActiveSession(s.id);
                  const isLate = active && isStudentLateOnCampus(s, data);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {s.mat}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                        {s.nom} {s.prenom}
                      </td>
                      <td className="py-2 px-3">
                        {active ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isLate
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            Sur place ({new Date(active.in).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Hors site
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {active ? (
                          <button
                            onClick={() => handleCheckOut(s.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] transition-colors"
                          >
                            <LogOut className="w-3 h-3" />
                            Sortir
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCheckIn(s.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0f4c3a] hover:bg-[#0c3c2e] text-white font-bold text-[10px] transition-colors"
                          >
                            <LogIn className="w-3 h-3" />
                            Entrer
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Movements Log */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Historique des mouvements du jour
            </h3>
            <span className="text-xs text-slate-500">{todayEntries.length} passage(s)</span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Étudiant</th>
                  <th className="py-2.5 px-3">Heure Arrivée</th>
                  <th className="py-2.5 px-3">Heure Sortie</th>
                  <th className="py-2.5 px-3 text-right">État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {todayEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Aucune entrée enregistrée aujourd'hui.
                    </td>
                  </tr>
                ) : (
                  todayEntries.map((rec) => {
                    const s = data.students.find((item) => item.id === rec.etu);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                          {s ? `${s.nom} ${s.prenom}` : 'Inconnu'}
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {s?.mat}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {new Date(rec.in).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">
                          {rec.out
                            ? new Date(rec.out).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.out
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {rec.out ? 'Sorti' : 'Sur place'}
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
      </div>
    </div>
  );
};
