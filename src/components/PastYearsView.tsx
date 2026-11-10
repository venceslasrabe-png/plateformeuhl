import React, { useState } from 'react';
import {
  History,
  GraduationCap,
  Award,
  Users,
  Wallet,
  CheckCircle2,
  Calendar,
  BookOpen,
  FileText,
  UserCheck,
  Building,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { PAST_YEARS_ARCHIVES, PastYearRecord } from '../services/historicalData';
import { formatFCFA } from '../services/storage';

interface PastYearsViewProps {
  onNavigate?: (view: string) => void;
}

export const PastYearsView: React.FC<PastYearsViewProps> = ({ onNavigate }) => {
  const [selectedYear, setSelectedYear] = useState<string>(PAST_YEARS_ARCHIVES[0].year);

  const activeRecord: PastYearRecord =
    PAST_YEARS_ARCHIVES.find((y) => y.year === selectedYear) || PAST_YEARS_ARCHIVES[0];

  return (
    <div className="space-y-6">
      {/* Header & Year Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
                  Archives des Années Antérieures
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                  UHL Pointe-Noire
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Consultation des bilans académiques consolidés, taux de diplomation et promotions clôturées
              </p>
            </div>
          </div>

          {/* Selector Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {PAST_YEARS_ARCHIVES.map((item) => {
              const isSelected = item.year === selectedYear;
              return (
                <button
                  key={item.year}
                  onClick={() => setSelectedYear(item.year)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0f4c3a] text-white shadow-md ring-2 ring-emerald-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.year}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Promotion Title & Status Banner */}
      <div className="bg-gradient-to-r from-[#0f3b2e] to-[#155341] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-[#e8b923] text-slate-950 text-xs font-extrabold uppercase font-['Bricolage_Grotesque'] tracking-wide">
                Année {activeRecord.year}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/15 text-emerald-200 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                {activeRecord.status}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-['Bricolage_Grotesque'] tracking-tight">
              {activeRecord.nomPromotion}
            </h3>
            <p className="text-xs text-emerald-200/90 mt-1 flex items-center gap-2">
              <span>Délibérations proclamées le {activeRecord.deliberationDate}</span>
              <span>•</span>
              <span>{activeRecord.diplomesDelivres} lauréats diplômés</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-right">
              <span className="text-[11px] text-emerald-200 block">Taux de réussite final</span>
              <span className="text-2xl font-extrabold text-[#e8b923] font-['Bricolage_Grotesque']">
                {activeRecord.successRate} %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPIs Cards of the Past Year */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Effectif Total Inscrit</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            {activeRecord.totalStudents}
          </div>
          <span className="text-[11px] text-slate-400">
            {activeRecord.licenceCount} Licence · {activeRecord.masterCount} Master · {activeRecord.doctoratCount} Doc.
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Diplômes Délivrés</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Bricolage_Grotesque'] text-emerald-700 dark:text-emerald-400">
            {activeRecord.diplomesDelivres}
          </div>
          <span className="text-[11px] text-slate-400">
            Taux de réussite : {activeRecord.successRate} %
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Frais Recouvrés</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white truncate">
            {formatFCFA(activeRecord.totalFeesCollected)}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            Taux de recouvrement : {activeRecord.recoveryRate} %
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Corps Enseignant</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            {activeRecord.totalTeachers}
          </div>
          <span className="text-[11px] text-slate-400">
            Assiduité moyenne : {activeRecord.attendanceRate} %
          </span>
        </div>
      </div>

      {/* Row 2: Major de Promotion + Répartition des Mentions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Major de promotion Card */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-slate-800 dark:to-slate-900 border border-amber-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 text-xs font-extrabold uppercase tracking-wide">
                <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Major de Promotion
              </span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                {activeRecord.year}
              </span>
            </div>

            <div className="flex items-center gap-3.5 my-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-md">
                🎓
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-base text-slate-900 dark:text-white truncate">
                  {activeRecord.majorPromotion.nom}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {activeRecord.majorPromotion.filiere}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[11px] font-bold">
                    Moyenne : {activeRecord.majorPromotion.moyenne}/20
                  </span>
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                    Mention {activeRecord.majorPromotion.mention}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-amber-200/80 dark:border-slate-700/60 text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Félicitations du Conseil Rectoral de l'Université Henri Lopes</span>
          </div>
        </div>

        {/* Mentions Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                Répartition des Mentions & Résultats LMD ({activeRecord.year})
              </h4>
              <span className="text-xs text-slate-400">
                {activeRecord.totalStudents} candidats évalués
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 my-2">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block uppercase">
                  Très Bien
                </span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                  {activeRecord.repartitionMentions.tresBien}
                </span>
                <span className="text-[10px] text-emerald-600 block">≥ 16/20</span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center">
                <span className="text-[10px] text-blue-800 dark:text-blue-300 font-bold block uppercase">
                  Bien
                </span>
                <span className="text-lg font-black text-blue-700 dark:text-blue-400">
                  {activeRecord.repartitionMentions.bien}
                </span>
                <span className="text-[10px] text-blue-600 block">14 - 15.9</span>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center">
                <span className="text-[10px] text-indigo-800 dark:text-indigo-300 font-bold block uppercase">
                  Assez Bien
                </span>
                <span className="text-lg font-black text-indigo-700 dark:text-indigo-400">
                  {activeRecord.repartitionMentions.assezBien}
                </span>
                <span className="text-[10px] text-indigo-600 block">12 - 13.9</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold block uppercase">
                  Passable
                </span>
                <span className="text-lg font-black text-amber-700 dark:text-amber-400">
                  {activeRecord.repartitionMentions.passable}
                </span>
                <span className="text-[10px] text-amber-600 block">10 - 11.9</span>
              </div>

              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] text-red-800 dark:text-red-300 font-bold block uppercase">
                  Ajournés
                </span>
                <span className="text-lg font-black text-red-700 dark:text-red-400">
                  {activeRecord.repartitionMentions.ajourne}
                </span>
                <span className="text-[10px] text-red-600 block">&lt; 10/20</span>
              </div>
            </div>
          </div>

          {/* Gender parity stats */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Parité : <b>{activeRecord.girlsCount} Étudiantes</b> ({Math.round((activeRecord.girlsCount / activeRecord.totalStudents) * 100)}%) · <b>{activeRecord.boysCount} Étudiants</b> ({Math.round((activeRecord.boysCount / activeRecord.totalStudents) * 100)}%)</span>
            <span className="text-emerald-600 font-medium font-mono">Assiduité campus : {activeRecord.attendanceRate}%</span>
          </div>
        </div>
      </div>

      {/* Row 3: Répartition par filières & Acte réglementaire d'archive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filières Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Bilan des Filières ({activeRecord.year})
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-2">Filière Académique</th>
                  <th className="py-2 text-center">Effectif</th>
                  <th className="py-2 text-center">Part (%)</th>
                  <th className="py-2 text-right">Taux de Réussite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {activeRecord.repartitionFilieres.map((item) => (
                  <tr key={item.filiere} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-medium text-slate-900 dark:text-white">
                      {item.filiere}
                    </td>
                    <td className="py-2.5 text-center font-bold text-slate-700 dark:text-slate-300">
                      {item.effectif}
                    </td>
                    <td className="py-2.5 text-center text-slate-500">
                      {Math.round((item.effectif / activeRecord.totalStudents) * 100)} %
                    </td>
                    <td className="py-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      {item.tauxReussite} %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regulatory Archive Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              Visa Rectoral & Archivage
            </h4>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <p className="font-serif italic text-slate-700 dark:text-slate-300 leading-relaxed">
                « {activeRecord.rectoratVisa} »
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                <span>Délivré à Pointe-Noire sous le sceau officiel de l'Université Henri Lopes.</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-500">Archive numérisée et scellée</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
              Certifié conforme
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
