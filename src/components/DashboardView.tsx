import React from 'react';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  TrendingUp,
  Wallet,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  UserCheck,
} from 'lucide-react';
import { AppData } from '../types';
import {
  calcBalance,
  calcFee,
  calcPaid,
  calcSemesterResult,
  formatFCFA,
  getStudentAbsences,
  isStudentLateOnCampus,
} from '../services/storage';
import { UNIVERSITY_LOGO } from '../constants/assets';

interface Props {
  data: AppData;
  onNavigate: (view: string) => void;
  onExportExcel: () => void;
}

export const DashboardView: React.FC<Props> = ({ data, onNavigate, onExportExcel }) => {
  const totalStudents = data.students.length;
  const totalParcours = data.parcours.length;
  const totalTeachers = data.teachers.length;

  // Financial calculations
  let totalFeesExpected = 0;
  let totalFeesCollected = 0;
  data.students.forEach((s) => {
    totalFeesExpected += calcFee(s, data);
    totalFeesCollected += calcPaid(s.id, data);
  });
  const totalRemaining = Math.max(0, totalFeesExpected - totalFeesCollected);
  const unpaidStudentsCount = data.students.filter((s) => calcBalance(s, data) > 0).length;

  // Attendance rate
  let totalPresent = 0;
  let totalAbsent = 0;
  Object.values(data.pres).forEach((session) => {
    Object.values(session).forEach((val) => {
      if (val === 1) totalPresent++;
      else totalAbsent++;
    });
  });
  const attendanceRate =
    totalPresent + totalAbsent > 0
      ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
      : null;

  // Success rate (LMD)
  let totalDeliberations = 0;
  let passedCount = 0;
  data.students.forEach((s) => {
    ['S1', 'S2'].forEach((sem) => {
      const res = calcSemesterResult(s.id, sem, data);
      if (['Admis', 'Ajourné', 'Rattrapage'].includes(res.dec)) {
        totalDeliberations++;
        if (res.dec === 'Admis') passedCount++;
      }
    });
  });
  const successRate =
    totalDeliberations > 0 ? Math.round((passedCount / totalDeliberations) * 100) : null;

  // Distribution by level
  const levels = ['L1', 'L2', 'L3', 'M1', 'M2', 'D1', 'D2', 'D3'];
  const levelCounts = levels.map((lvl) => ({
    level: lvl,
    count: data.students.filter((s) => s.niveau === lvl).length,
  }));
  const maxLevelCount = Math.max(1, ...levelCounts.map((x) => x.count));

  // Alerts
  const studentsWithExcessAbsences = data.students.filter((s) => getStudentAbsences(s.id, data) >= 3);
  const studentsLateOnCampus = data.students.filter((s) => {
    const isPresent = data.surv.some((rec) => rec.etu === s.id && !rec.out);
    return isPresent && isStudentLateOnCampus(s, data);
  });

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f3b2e] via-[#145341] to-[#1e6b54] text-white p-6 sm:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-amber-300 border border-white/10 mb-3">
            <span>Pointe-Noire · République du Congo</span>
            <span className="w-1 h-1 rounded-full bg-amber-400" />
            <span className="italic font-normal text-emerald-200">« Savoir · Former · Réussir »</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-['Bricolage_Grotesque'] tracking-tight mb-2">
            Université Henri Lopes
          </h1>
          <p className="text-emerald-100 text-sm leading-relaxed mb-5 max-w-xl">
            Système d'information intégré pour la gestion des inscriptions LMD, la scolarité financière, l'évaluation académique, le contrôle des accès et la délivrance des documents officiels.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('etu')}
              className="px-4 py-2.5 rounded-xl bg-[#e8b923] text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all shadow-md shadow-amber-900/30 cursor-pointer"
            >
              Nouvelle Inscription
            </button>
            <button
              onClick={() => onNavigate('notes')}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-colors cursor-pointer"
            >
              Relevés & Notes LMD
            </button>
            <button
              onClick={() => onNavigate('surv')}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-colors cursor-pointer"
            >
              Contrôle Campus
            </button>
          </div>
        </div>

        {/* Official Crest Badge */}
        <div className="relative z-10 shrink-0 self-center md:self-auto bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl flex flex-col items-center text-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white p-2 shadow-lg mb-2 flex items-center justify-center">
            <img
              src={UNIVERSITY_LOGO}
              alt="Emblème officiel de l'Université Henri Lopes"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[11px] font-bold text-white tracking-wide uppercase">
            Université Henri Lopes
          </span>
          <span className="text-[10px] text-amber-300 font-semibold mt-0.5">
            Pointe-Noire
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Étudiants Inscrits</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            {totalStudents}
          </div>
          <span className="text-[11px] text-slate-400">
            {totalParcours} parcours accrédités
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Taux de Présence</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            {attendanceRate !== null ? `${attendanceRate} %` : '—'}
          </div>
          <span className="text-[11px] text-slate-400">
            Sur l'ensemble des séances
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Taux de Réussite LMD</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            {successRate !== null ? `${successRate} %` : '—'}
          </div>
          <span className="text-[11px] text-slate-400">
            Moyenne ≥ {data.p.seuil}/20
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Corps Enseignant</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            {totalTeachers}
          </div>
          <span className="text-[11px] text-slate-400">
            Permanents & Vacataires
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Frais Encaissés</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-['Bricolage_Grotesque'] text-emerald-700 dark:text-emerald-400 truncate">
            {formatFCFA(totalFeesCollected)}
          </div>
          <span className="text-[11px] text-slate-400">
            Total versé en caisse
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Reste à Recouvrer</span>
            <Wallet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-['Bricolage_Grotesque'] text-amber-700 dark:text-amber-400 truncate">
            {formatFCFA(totalRemaining)}
          </div>
          <span className="text-[11px] text-slate-400">
            Échéances restantes
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Étudiants en Solde Dû</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold font-['Bricolage_Grotesque'] text-red-600 dark:text-red-400">
            {unpaidStudentsCount}
          </div>
          <span className="text-[11px] text-slate-400">
            Dossiers avec solde &gt; 0
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Année Académique</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            {data.p.ann}
          </div>
          <span className="text-[11px] text-slate-400">
            Semestres S1 & S2 en cours
          </span>
        </div>
      </div>

      {/* Two Column Section: Levels & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Level Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Répartition des effectifs par niveau
              </h3>
              <p className="text-xs text-slate-500">
                Cycle Licence (L1-L3), Master (M1-M2) et Doctorat (D1-D3)
              </p>
            </div>
            <button
              onClick={() => onNavigate('etu')}
              className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
            >
              Voir la liste →
            </button>
          </div>

          <div className="space-y-2.5">
            {levelCounts.map((item) => (
              <div key={item.level} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-bold text-slate-700 dark:text-slate-300">
                  {item.level}
                </span>
                <div className="flex-1 h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0f4c3a] rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.count / maxLevelCount) * 100}%`,
                      minWidth: item.count > 0 ? '8px' : '0px',
                    }}
                  />
                </div>
                <span className="w-8 text-right font-semibold text-slate-600 dark:text-slate-400">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Alertes opérationnelles
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Anomalies détectées en temps réel
          </p>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-64">
            {studentsWithExcessAbsences.length === 0 && studentsLateOnCampus.length === 0 && (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center p-4">
                Aucune alerte critique enregistrée ce jour.
              </div>
            )}

            {studentsWithExcessAbsences.map((s) => (
              <div
                key={s.id}
                className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs"
              >
                <div className="flex items-center justify-between text-red-800 dark:text-red-300 font-bold mb-0.5">
                  <span>{s.nom} {s.prenom}</span>
                  <span className="text-[10px] bg-red-200 dark:bg-red-900 px-1.5 py-0.2 rounded font-mono">
                    {getStudentAbsences(s.id, data)} absences
                  </span>
                </div>
                <p className="text-[11px] text-red-600 dark:text-red-400">
                  Seuil critique d'assiduité dépassé (≥ 3 absences).
                </p>
              </div>
            ))}

            {studentsLateOnCampus.map((s) => (
              <div
                key={s.id}
                className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs"
              >
                <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-bold mb-0.5">
                  <span>{s.nom} {s.prenom}</span>
                  <span className="text-[10px] bg-amber-200 dark:bg-amber-900 px-1.5 py-0.2 rounded">
                    Sortie en retard
                  </span>
                </div>
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Toujours présent sur le campus plus d'une heure après la fin de ses cours.
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button
              onClick={onExportExcel}
              className="flex-1 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Exporter Excel
            </button>
            <button
              onClick={() => onNavigate('pres')}
              className="flex-1 py-1.5 rounded-lg bg-[#0f4c3a] text-white text-xs font-semibold hover:bg-[#0c3c2e] flex items-center justify-center gap-1.5"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              Faire l'appel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
