import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  CalendarCheck,
  QrCode,
  Scan,
  AlertTriangle,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { AppData, Student } from '../types';
import { getStudentAbsences, uid } from '../services/storage';

interface Props {
  data: AppData;
  onSaveData: (data: AppData) => void;
  onNotify: (msg: string) => void;
}

export const AttendanceView: React.FC<Props> = ({ data, onSaveData, onNotify }) => {
  const [selectedEcId, setSelectedEcId] = useState<string>(data.ec[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [scanInput, setScanInput] = useState('');
  const [sessionQr, setSessionQr] = useState<string>('');

  const selectedEc = data.ec.find((e) => e.id === selectedEcId);
  const ue = selectedEc ? data.ue.find((u) => u.id === selectedEc.ue) : null;
  const eligibleStudents = ue
    ? data.students.filter((s) => s.parcours === ue.parcours)
    : [];

  const sessionKey = `${selectedEcId}|${selectedDate}`;
  const currentAttendance = data.pres[sessionKey] || {};

  // Generate QR code for this course session
  useEffect(() => {
    if (selectedEcId) {
      QRCode.toDataURL(`HLU|${sessionKey}`, {
        margin: 1,
        width: 140,
        color: { dark: '#0f4c3a', light: '#ffffff' },
      })
        .then(setSessionQr)
        .catch(console.error);
    }
  }, [selectedEcId, selectedDate, sessionKey]);

  // Handle Scan matricule
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = scanInput.trim().toUpperCase();
    if (!q) return;

    const student = eligibleStudents.find((s) => s.mat.toUpperCase() === q);
    if (!student) {
      onNotify(`Matricule ${q} introuvable pour ce cours.`);
      setScanInput('');
      return;
    }

    const updatedPres = {
      ...data.pres,
      [sessionKey]: {
        ...(data.pres[sessionKey] || {}),
        [student.id]: 1,
      },
    };

    onSaveData({ ...data, pres: updatedPres });
    onNotify(`${student.prenom} ${student.nom} marqué présent.`);
    setScanInput('');
  };

  const handleToggleAttendance = (studentId: string) => {
    const isPresent = currentAttendance[studentId] === 1;
    const updatedPres = {
      ...data.pres,
      [sessionKey]: {
        ...(data.pres[sessionKey] || {}),
        [studentId]: isPresent ? 0 : 1,
      },
    };
    onSaveData({ ...data, pres: updatedPres });
  };

  const handleMarkAll = (val: 1 | 0) => {
    const updatedSession: Record<string, number> = {};
    eligibleStudents.forEach((s) => {
      updatedSession[s.id] = val;
    });
    const updatedPres = {
      ...data.pres,
      [sessionKey]: updatedSession,
    };
    onSaveData({ ...data, pres: updatedPres });
    onNotify(val === 1 ? 'Tous les étudiants marqués présents.' : 'Appel réinitialisé.');
  };

  // Notify student with >= 3 absences
  const handleSendAbsenceAlert = (student: Student) => {
    const absences = getStudentAbsences(student.id, data);
    const newAnn = {
      id: uid(),
      titre: `Alerte d’assiduité : ${student.nom} ${student.prenom}`,
      cible: 'Étudiants' as const,
      msg: `L’étudiant(e) ${student.nom} ${student.prenom} (${student.mat}) a cumulé ${absences} absences non justifiées. Une convocation au décanat est requise.`,
      ts: Date.now(),
    };
    onSaveData({ ...data, ann: [newAnn, ...data.ann] });
    onNotify(`Alerte d’absence publiée pour ${student.prenom} ${student.nom}.`);
  };

  const alertStudents = data.students.filter((s) => getStudentAbsences(s.id, data) >= 3);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            Présences et Contrôle d’Assiduité
          </h2>
          <p className="text-xs text-slate-500">
            Faites l'appel en cours, scannez les badges étudiants ou projetez le QR code de la séance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMarkAll(1)}
            className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-sm"
          >
            Tous présents
          </button>
          <button
            onClick={() => handleMarkAll(0)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 transition-colors shadow-sm"
          >
            Tous absents
          </button>
        </div>
      </div>

      {/* Session Controls: Matière, Date, Scanner & QR Code */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Selector Panel */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Matière (Élément Constitutif)
              <select
                value={selectedEcId}
                onChange={(e) => setSelectedEcId(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                {data.ec.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.code} — {e.nom}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Date de la séance de cours
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
              </input>
            </label>
          </div>

          {/* Quick Scanner */}
          <form onSubmit={handleScanSubmit} className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Scanner le badge étudiant (douchette ou matricule) :
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Scan className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="ex. HLU-2026-0001 puis Appuyez sur Entrée"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0f4c3a] text-white text-xs font-bold rounded-lg hover:bg-[#0c3c2e] transition-colors"
              >
                Pointer
              </button>
            </div>
          </form>
        </div>

        {/* QR Code Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>QR Code de la Séance</span>
          </div>
          {sessionQr ? (
            <img
              src={sessionQr}
              alt="QR Séance"
              className="w-28 h-28 rounded-lg border border-slate-100 shadow-xs mb-2"
            />
          ) : (
            <div className="w-28 h-28 bg-slate-100 rounded-lg animate-pulse mb-2" />
          )}
          <span className="text-[10px] text-slate-400">
            Les étudiants peuvent badger avec leur smartphone
          </span>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Feuille d'émargement — {selectedEc?.nom} ({eligibleStudents.length} inscrits)
          </h3>
          <span className="text-xs text-slate-500">
            Présents : {Object.values(currentAttendance).filter((v) => v === 1).length} / {eligibleStudents.length}
          </span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
              <th className="py-3 px-4">Matricule</th>
              <th className="py-3 px-4">Nom(s) & Prénom(s)</th>
              <th className="py-3 px-4 text-center">Statut Présence</th>
              <th className="py-3 px-4 text-center">Absences cumulées</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {eligibleStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Aucun étudiant inscrit dans le parcours correspondant à cette matière.
                </td>
              </tr>
            ) : (
              eligibleStudents.map((s) => {
                const isPresent = currentAttendance[s.id] === 1;
                const totalAbsences = getStudentAbsences(s.id, data);
                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors ${
                      isPresent ? 'bg-emerald-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {s.mat}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {s.nom} {s.prenom}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleAttendance(s.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] transition-colors ${
                          isPresent
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        }`}
                      >
                        {isPresent ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Présent(e)
                          </>
                        ) : (
                          'Absent(e)'
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-bold font-mono text-xs ${
                          totalAbsences >= 3 ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {totalAbsences}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {totalAbsences >= 3 && (
                        <button
                          onClick={() => handleSendAbsenceAlert(s)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                        >
                          <Bell className="w-3 h-3" />
                          Notifier
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Critical Absence Alerts (≥ 3 absences) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Alertes de non-assiduité (3 absences ou plus)
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Conformément au règlement LMD de l'Université Henri Lopes, 3 absences injustifiées entraînent la défaillance à la session normale.
        </p>

        {alertStudents.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Aucune alerte d'assiduité actuellement.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alertStudents.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 flex items-center justify-between text-xs"
              >
                <div>
                  <b className="text-slate-900 dark:text-white block">
                    {s.nom} {s.prenom}
                  </b>
                  <span className="text-slate-500 text-[11px] font-mono">{s.mat}</span>
                  <span className="text-red-700 dark:text-red-400 font-bold ml-2">
                    {getStudentAbsences(s.id, data)} absences
                  </span>
                </div>
                <button
                  onClick={() => handleSendAbsenceAlert(s)}
                  className="px-2.5 py-1 rounded bg-red-600 text-white font-semibold text-[11px] hover:bg-red-700 transition-colors"
                >
                  Notifier
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
