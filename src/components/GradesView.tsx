import React, { useState } from 'react';
import {
  Award,
  Download,
  FileText,
  Calculator,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AppData } from '../types';
import {
  calcEcAverage,
  calcSemesterResult,
  getMention,
  getStudentRank,
} from '../services/storage';
import { downloadTranscriptPdf } from '../services/pdfGenerator';
import { SEMESTERS } from '../constants/assets';

interface Props {
  data: AppData;
  onSaveData: (data: AppData) => void;
  onNotify: (msg: string) => void;
}

export const GradesView: React.FC<Props> = ({ data, onSaveData, onNotify }) => {
  const [selectedParcours, setSelectedParcours] = useState<string>(
    data.parcours[0]?.id || ''
  );
  const eligibleEcs = data.ec.filter((e) => {
    const u = data.ue.find((x) => x.id === e.ue);
    return !selectedParcours || (u && u.parcours === selectedParcours);
  });

  const [selectedEcId, setSelectedEcId] = useState<string>(eligibleEcs[0]?.id || '');
  const [selectedSem, setSelectedSem] = useState<'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6'>('S1');

  const selectedEc = data.ec.find((e) => e.id === selectedEcId);
  const ue = selectedEc ? data.ue.find((u) => u.id === selectedEc.ue) : null;
  const enrolledStudents = ue
    ? data.students.filter((s) => s.parcours === ue.parcours)
    : data.students.filter((s) => !selectedParcours || s.parcours === selectedParcours);

  const [selectedStudentForReleve, setSelectedStudentForReleve] = useState<string>(
    enrolledStudents[0]?.id || data.students[0]?.id || ''
  );

  const handleGradeChange = (
    ecId: string,
    studentId: string,
    field: 'cc' | 'ex' | 'rt',
    val: string
  ) => {
    const key = `${ecId}|${studentId}`;
    const prev = data.notes[key] || {};
    const updatedNotes = {
      ...data.notes,
      [key]: {
        ...prev,
        [field]: val === '' ? undefined : Number(val),
      },
    };
    onSaveData({ ...data, notes: updatedNotes });
  };

  const selectedStudent = data.students.find((s) => s.id === selectedStudentForReleve);
  const releveResult = selectedStudent
    ? calcSemesterResult(selectedStudent.id, selectedSem, data)
    : null;
  const [rank, totalClassmates] = selectedStudent
    ? getStudentRank(selectedStudent.id, selectedSem, data)
    : [null, 0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            Saisie des Notes & Relevés LMD
          </h2>
          <p className="text-xs text-slate-500">
            Pondération officielle : {data.p.cc}% Contrôle Continu + {100 - data.p.cc}% Examen. Le rattrapage remplace l’examen s’il est supérieur.
          </p>
        </div>

        {selectedStudent && (
          <button
            onClick={() => downloadTranscriptPdf(selectedStudent, selectedSem, data)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f4c3a] text-white font-bold text-xs hover:bg-[#0c3c2e] transition-colors shadow-sm shrink-0"
          >
            <Download className="w-4 h-4" />
            Télécharger le Relevé PDF ({selectedSem})
          </button>
        )}
      </div>

      {/* Selectors Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          Option / Parcours
          <select
            value={selectedParcours}
            onChange={(e) => {
              setSelectedParcours(e.target.value);
              const firstEc = data.ec.find((x) => {
                const u = data.ue.find((item) => item.id === x.ue);
                return u?.parcours === e.target.value;
              });
              if (firstEc) setSelectedEcId(firstEc.id);
            }}
            className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
          >
            <option value="">Tous les parcours</option>
            {data.parcours.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom} ({p.cycle})
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          Matière (Élément Constitutif)
          <select
            value={selectedEcId}
            onChange={(e) => setSelectedEcId(e.target.value)}
            className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
          >
            {eligibleEcs.map((e) => (
              <option key={e.id} value={e.id}>
                {e.code} — {e.nom}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          Semestre à auditer
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

      {/* Grades Input Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Grille de notation — {selectedEc?.nom} (Coef {selectedEc?.coef})
          </h3>
          <span className="text-xs text-slate-500">
            {enrolledStudents.length} étudiant(s) inscrits
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-3 px-4">Matricule</th>
                <th className="py-3 px-4">Nom(s) & Prénom(s)</th>
                <th className="py-3 px-4 text-center">Contrôle Continu ({data.p.cc}%)</th>
                <th className="py-3 px-4 text-center">Examen ({100 - data.p.cc}%)</th>
                <th className="py-3 px-4 text-center">Rattrapage</th>
                <th className="py-3 px-4 text-center">Moyenne EC (/20)</th>
                <th className="py-3 px-4 text-right">Relevé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {enrolledStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun étudiant inscrit dans cette matière.
                  </td>
                </tr>
              ) : (
                enrolledStudents.map((s) => {
                  const key = `${selectedEcId}|${s.id}`;
                  const n = data.notes[key] || {};
                  const avg = calcEcAverage(selectedEcId, s.id, data);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {s.mat}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {s.nom} {s.prenom}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max="20"
                          value={n.cc ?? ''}
                          onChange={(e) =>
                            handleGradeChange(selectedEcId, s.id, 'cc', e.target.value)
                          }
                          placeholder="—"
                          className="w-20 px-2 py-1 text-center font-bold text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max="20"
                          value={n.ex ?? ''}
                          onChange={(e) =>
                            handleGradeChange(selectedEcId, s.id, 'ex', e.target.value)
                          }
                          placeholder="—"
                          className="w-20 px-2 py-1 text-center font-bold text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max="20"
                          value={n.rt ?? ''}
                          onChange={(e) =>
                            handleGradeChange(selectedEcId, s.id, 'rt', e.target.value)
                          }
                          placeholder="—"
                          className="w-20 px-2 py-1 text-center font-bold text-xs rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded ${
                            avg !== null
                              ? avg >= data.p.seuil
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {avg !== null ? avg.toFixed(2) : '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => downloadTranscriptPdf(s, selectedSem, data)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Télécharger le Relevé de notes PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Relevé de Notes Preview Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Synthèse & Relevé de Notes Officiel LMD
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStudentForReleve}
              onChange={(e) => setSelectedStudentForReleve(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            >
              {data.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.mat} — {s.nom} {s.prenom}
                </option>
              ))}
            </select>

            {selectedStudent && (
              <button
                onClick={() => downloadTranscriptPdf(selectedStudent, selectedSem, data)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f4c3a] text-white text-xs font-bold hover:bg-[#0c3c2e] transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Imprimer PDF
              </button>
            )}
          </div>
        </div>

        {releveResult && selectedStudent ? (
          <div className="space-y-4">
            {/* Official Academic Bulletin Header */}
            {(() => {
              const studentParcours = data.parcours.find((p) => p.id === selectedStudent.parcours);
              return (
                <div className="rounded-xl border border-emerald-900/20 dark:border-emerald-800/40 bg-gradient-to-r from-emerald-50/70 via-white to-amber-50/40 dark:from-slate-800/80 dark:via-slate-900/90 dark:to-slate-800/60 p-4 sm:p-5 shadow-xs">
                  {/* Top Bar: Center Aligned Institutional Titles */}
                  <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest block">
                      Université Henri Lopes · Pointe-Noire
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase font-['Bricolage_Grotesque'] tracking-tight mt-0.5">
                      Bulletin Officiel de Notes & Résultats LMD
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                      Session Ordinaire · Semestre {selectedSem} · Année Académique {data.p.ann}
                    </p>
                  </div>

                  {/* Student Identity Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                        Matricule
                      </span>
                      <b className="font-mono text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                        {selectedStudent.mat}
                      </b>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                        Étudiant(e)
                      </span>
                      <b className="text-slate-900 dark:text-white truncate block font-bold">
                        {selectedStudent.nom} {selectedStudent.prenom}
                      </b>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                        Filière & Option
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 truncate font-medium">
                        {selectedStudent.fil || studentParcours?.dom || 'Sciences'} · {studentParcours?.nom || 'Formation LMD'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                        Cycle / Niveau
                      </span>
                      <b className="text-[#0f3b2e] dark:text-emerald-400 font-bold">
                        {studentParcours?.cycle || 'Licence'} — {selectedStudent.niveau}
                      </b>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 block">Moyenne {selectedSem}</span>
                <b className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {releveResult.moy !== null ? releveResult.moy.toFixed(2) : '—'} / 20
                </b>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 block">Crédits validés</span>
                <b className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  {releveResult.cr} / {releveResult.tot} ECTS
                </b>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 block">Rang de promotion</span>
                <b className="text-lg font-bold text-slate-900 dark:text-white">
                  {rank ? `${rank}${rank === 1 ? 'er' : 'e'} sur ${totalClassmates}` : '—'}
                </b>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 block">Mention</span>
                <b className="text-lg font-bold text-slate-900 dark:text-white">
                  {getMention(releveResult.moy)}
                </b>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 block">Décision finale</span>
                <b
                  className={`text-lg font-bold ${
                    releveResult.dec === 'Admis'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : releveResult.dec === 'Ajourné'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {releveResult.dec}
                </b>
              </div>
            </div>

            {/* Units breakdown */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">Unité d’Enseignement (UE)</th>
                    <th className="py-2.5 px-3 text-center">Crédits ECTS</th>
                    <th className="py-2.5 px-3 text-center">Moyenne UE</th>
                    <th className="py-2.5 px-3 text-center">Statut Capitalisation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {releveResult.rows.map(([u, ueAvg]) => (
                    <tr key={u.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                        {u.code} — {u.nom}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{u.cred} ECTS</td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono">
                        {ueAvg !== null ? ueAvg.toFixed(2) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ueAvg !== null && (ueAvg >= data.p.seuil || (releveResult.moy !== null && releveResult.moy >= data.p.seuil))
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {ueAvg !== null && (ueAvg >= data.p.seuil || (releveResult.moy !== null && releveResult.moy >= data.p.seuil))
                            ? 'Validée'
                            : 'Non validée'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">
            Sélectionnez un étudiant pour afficher son relevé de notes.
          </p>
        )}
      </div>
    </div>
  );
};
