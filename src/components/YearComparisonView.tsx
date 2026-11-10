import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Users,
  GraduationCap,
  Wallet,
  ArrowUpRight,
  Layers,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { AppData } from '../types';
import { getMultiYearComparisonData, PastYearRecord } from '../services/historicalData';
import { formatFCFA } from '../services/storage';

interface YearComparisonViewProps {
  data: AppData;
  onNavigate?: (view: string) => void;
  onExportExcel?: () => void;
}

export const YearComparisonView: React.FC<YearComparisonViewProps> = ({
  data,
  onNavigate,
  onExportExcel,
}) => {
  const comparison = getMultiYearComparisonData(data);
  const yearsList = comparison.allYearsChronological;

  // Chart view mode: All vs Students vs Success vs Financial
  const [comparisonTab, setComparisonTab] = useState<'all' | 'students' | 'performance' | 'financial'>('all');

  // Prepare data for Recharts
  const chartData = yearsList.map((y) => ({
    year: y.year,
    nom: y.nomPromotion,
    total: y.totalStudents,
    licence: y.licenceCount,
    master: y.masterCount + y.doctoratCount,
    successRate: y.successRate,
    attendanceRate: y.attendanceRate,
    recoveryRate: y.recoveryRate,
    collectedMillions: Number((y.totalFeesCollected / 1000000).toFixed(1)),
    teachers: y.totalTeachers,
    isCurrent: y.status === 'En cours',
  }));

  // Calculate general growth over the 4-year period
  const oldestYear = yearsList[0];
  const newestYear = yearsList[yearsList.length - 1];
  const studentGrowthPct = Math.round(
    ((newestYear.totalStudents - oldestYear.totalStudents) / oldestYear.totalStudents) * 100
  );
  const successGrowthPct = Number((newestYear.successRate - oldestYear.successRate).toFixed(1));
  const revenueGrowthPct = Math.round(
    ((newestYear.totalFeesCollected - oldestYear.totalFeesCollected) / oldestYear.totalFeesCollected) * 100
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-200 dark:border-amber-800 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
                  Comparaison Pluriannuelle des Années
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8b923] text-slate-950">
                  2023 → 2027
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Analyse comparative de l'évolution des effectifs, taux de diplomation LMD et trésorerie
              </p>
            </div>
          </div>

          {/* Quick tab filters for charts */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setComparisonTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                comparisonTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setComparisonTab('students')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                comparisonTab === 'students'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Effectifs
            </button>
            <button
              onClick={() => setComparisonTab('performance')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                comparisonTab === 'performance'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Réussite
            </button>
            <button
              onClick={() => setComparisonTab('financial')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                comparisonTab === 'financial'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Finances
            </button>
          </div>
        </div>
      </div>

      {/* 4 Multi-Year Growth Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Croissance des Effectifs</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              +{studentGrowthPct}% <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            {oldestYear.totalStudents} → {newestYear.totalStudents}
          </div>
          <span className="text-[11px] text-slate-400">
            De 2023-2024 à {newestYear.year}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Taux de Réussite LMD</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              +{successGrowthPct}% <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-['Bricolage_Grotesque'] text-emerald-700 dark:text-emerald-400">
            {oldestYear.successRate}% → {newestYear.successRate}%
          </div>
          <span className="text-[11px] text-slate-400">
            Gain constant de performance
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Trésorerie Recouvrée</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              +{revenueGrowthPct}% <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white truncate">
            {formatFCFA(newestYear.totalFeesCollected)}
          </div>
          <span className="text-[11px] text-slate-400">
            Contre {formatFCFA(oldestYear.totalFeesCollected)} en 2023
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Corps Enseignant</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              +{newestYear.totalTeachers - oldestYear.totalTeachers} profs
            </span>
          </div>
          <div className="text-2xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            {oldestYear.totalTeachers} → {newestYear.totalTeachers}
          </div>
          <span className="text-[11px] text-slate-400">
            Renforcement du corps professoral
          </span>
        </div>
      </div>

      {/* Comparative Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Évolution des effectifs (Licence vs Master vs Total) */}
        {(comparisonTab === 'all' || comparisonTab === 'students') && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Évolution Pluriannuelle des Effectifs Étudiants
                </h3>
                <p className="text-xs text-slate-500">
                  Répartition Licence, Master et Total par année académique
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="licence" name="Licence" fill="#0f4c3a" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="master" name="Master & Doc." fill="#e8b923" radius={[4, 4, 0, 0]} barSize={24} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Effectif Total"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#2563eb' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart 2: Taux de réussite LMD & Recouvrement financier */}
        {(comparisonTab === 'all' || comparisonTab === 'performance' || comparisonTab === 'financial') && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Comparaison Réussite LMD & Recouvrement des Frais (%)
                </h3>
                <p className="text-xs text-slate-500">
                  Progression de l'efficacité académique et financière
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} %`]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="successRate" name="Taux de Réussite LMD" fill="#10b981" radius={[4, 4, 0, 0]} barSize={26} />
                  <Bar dataKey="recoveryRate" name="Taux de Recouvrement Frais" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Comparative Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Tableau Comparatif Détaillé des Années Universitaires UHL
            </h3>
            <p className="text-xs text-slate-500">
              Indicateurs consolidés de la gouvernance académique et financière
            </p>
          </div>

          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 self-start cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Exporter Bilan Pluriannuel
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                <th className="py-3 px-3">Indicateur Clé</th>
                {yearsList.map((y) => (
                  <th key={y.year} className="py-3 px-3 text-center">
                    <span className="block">{y.year}</span>
                    <span
                      className={`text-[10px] font-normal px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                        y.status === 'En cours'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {y.status}
                    </span>
                  </th>
                ))}
                <th className="py-3 px-3 text-right">Évolution Globale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {/* Row 1: Nom Promotion */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                  Nom de Promotion
                </td>
                {yearsList.map((y) => (
                  <td key={y.year} className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300 italic text-[11px]">
                    {y.nomPromotion}
                  </td>
                ))}
                <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">—</td>
              </tr>

              {/* Row 2: Effectif total */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                  Effectif Total Étudiants
                </td>
                {yearsList.map((y) => (
                  <td key={y.year} className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                    {y.totalStudents}
                  </td>
                ))}
                <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                  +{studentGrowthPct} %
                </td>
              </tr>

              {/* Row 3: Cycle Licence */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 pl-6">
                  • Cycle Licence (L1 - L3)
                </td>
                {yearsList.map((y) => (
                  <td key={y.year} className="py-2.5 px-3 text-center text-slate-700 dark:text-slate-300">
                    {y.licenceCount}
                  </td>
                ))}
                <td className="py-2.5 px-3 text-right text-emerald-600 font-medium">
                  +{Math.round(((newestYear.licenceCount - oldestYear.licenceCount) / oldestYear.licenceCount) * 100)} %
                </td>
              </tr>

              {/* Row 4: Cycle Master */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 pl-6">
                  • Cycle Master &amp; Doctorat
                </td>
                {yearsList.map((y) => (
                  <td key={y.year} className="py-2.5 px-3 text-center text-slate-700 dark:text-slate-300">
                    {y.masterCount + y.doctoratCount}
                  </td>
                ))}
                <td className="py-2.5 px-3 text-right text-emerald-600 font-medium">
                  +{Math.round((((newestYear.masterCount + newestYear.doctoratCount) - (oldestYear.masterCount + oldestYear.doctoratCount)) / Math.max(1, oldestYear.masterCount + oldestYear.doctoratCount)) * 100)} %
                </td>
              </tr>

              {/* Row 5: Taux de réussite */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                  Taux de Réussite LMD (%)
                </td>
                {yearsList.map((y) => (
                  <td key={y.year} className="py-2.5 px-3 text-center font-bold text-emerald-700 dark:text-emerald-400">
                    {y.successRate} %
                  </td>
                ))}
                <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                  +{successGrowthPct} pts
                </td>
              </tr>

              {/* Row 6: Taux d'assiduité */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 pl-6">
                  • Taux d'Assiduité Campus
                </td>
                {yearsList.map((y) => (
                  <td key={y.year} className="py-2.5 px-3 text-center text-slate-700 dark:text-slate-300">
                    {y.attendanceRate} %
                  </td>
                ))}
                <td className="py-2.5 px-3 text-right text-emerald-600 font-medium">
                  +{Number((newestYear.attendanceRate - oldestYear.attendanceRate).toFixed(1))} pts
                </td>
              </tr>

              {/* Row 7: Frais Recouvrés */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                  Frais de Scolarité Recouvrés
                </td>
                {yearsList.map((y) => (
                  <td key={y.year} className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                    {formatFCFA(y.totalFeesCollected)}
                  </td>
                ))}
                <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                  +{revenueGrowthPct} %
                </td>
              </tr>

              {/* Row 8: Taux de Recouvrement */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 pl-6">
                  • Taux de Recouvrement (%)
                </td>
                {yearsList.map((y) => (
                  <td key={y.year} className="py-2.5 px-3 text-center font-semibold text-amber-700 dark:text-amber-400">
                    {y.recoveryRate} %
                  </td>
                ))}
                <td className="py-2.5 px-3 text-right font-medium text-emerald-600">
                  +{Number((newestYear.recoveryRate - oldestYear.recoveryRate).toFixed(1))} pts
                </td>
              </tr>

              {/* Row 9: Corps Enseignant */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                  Corps Enseignant (Effectif)
                </td>
                {yearsList.map((y) => (
                  <td key={y.year} className="py-2.5 px-3 text-center text-slate-700 dark:text-slate-300">
                    {y.totalTeachers} enseignants
                  </td>
                ))}
                <td className="py-2.5 px-3 text-right text-emerald-600 font-medium">
                  +{newestYear.totalTeachers - oldestYear.totalTeachers}
                </td>
              </tr>

              {/* Row 10: Lauréats diplômés */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                  Lauréats / Diplômes Décernés
                </td>
                {yearsList.map((y) => (
                  <td key={y.year} className="py-2.5 px-3 text-center font-bold text-emerald-800 dark:text-emerald-300">
                    {y.diplomesDelivres} diplômés
                  </td>
                ))}
                <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                  +{Math.round(((newestYear.diplomesDelivres - oldestYear.diplomesDelivres) / oldestYear.diplomesDelivres) * 100)} %
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
