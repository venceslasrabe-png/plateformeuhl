import React from 'react';
import { Building2, Wallet, Users, AlertCircle, ShieldAlert, CreditCard } from 'lucide-react';
import { AppData } from '../types';
import { calcBalance, calcFee, calcPaid, formatFCFA } from '../services/storage';

interface Props {
  data: AppData;
}

export const PresidentView: React.FC<Props> = ({ data }) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Financial aggregates
  const totalReceived = data.pay.reduce((sum, p) => sum + Number(p.montant), 0);
  const totalReceivedToday = data.pay
    .filter((p) => p.date === todayStr)
    .reduce((sum, p) => sum + Number(p.montant), 0);

  const totalTuitionExpected = data.students.reduce((acc, s) => acc + calcFee(s, data), 0);
  const totalRemaining = Math.max(0, totalTuitionExpected - totalReceived);
  const debtorsCount = data.students.filter((s) => calcBalance(s, data) > 0).length;

  // Breakdown by cashier
  const byCashier: Record<string, number> = {};
  data.pay.forEach((p) => {
    const name = p.caissier || 'Non renseigné';
    byCashier[name] = (byCashier[name] || 0) + Number(p.montant);
  });

  // Breakdown by mode
  const byMode: Record<string, number> = {};
  data.pay.forEach((p) => {
    byMode[p.mode] = (byMode[p.mode] || 0) + Number(p.montant);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-[#0f3b2e] text-white shadow-lg">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
          <Building2 className="w-4 h-4" />
          <span>Console Haute Direction & Présidence</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold font-['Bricolage_Grotesque'] tracking-tight">
          Audit de Trésorerie & Tableaux de Bord Financiers
        </h2>
        <p className="text-slate-300 text-xs mt-1">
          Accès en lecture seule garanti par la gouvernance académique · Actualisation automatique
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">Encaissé Aujourd’hui</span>
          <b className="text-2xl font-bold font-['Bricolage_Grotesque'] text-emerald-700 dark:text-emerald-400">
            {formatFCFA(totalReceivedToday)}
          </b>
          <span className="text-[11px] text-slate-400 block mt-1">
            Recouvrement du {new Date().toLocaleDateString('fr-FR')}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">Total Encaissé ({data.p.ann})</span>
          <b className="text-2xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            {formatFCFA(totalReceived)}
          </b>
          <span className="text-[11px] text-slate-400 block mt-1">
            {totalTuitionExpected > 0
              ? `${Math.round((totalReceived / totalTuitionExpected) * 100)}% du budget prévisionnel`
              : '—'}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">Reste Global à Recouvrer</span>
          <b className="text-2xl font-bold font-['Bricolage_Grotesque'] text-amber-700 dark:text-amber-400">
            {formatFCFA(totalRemaining)}
          </b>
          <span className="text-[11px] text-slate-400 block mt-1">Créances de scolarité</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">Dossiers avec Solde Dû</span>
          <b className="text-2xl font-bold font-['Bricolage_Grotesque'] text-red-600 dark:text-red-400">
            {debtorsCount}
          </b>
          <span className="text-[11px] text-slate-400 block mt-1">
            Sur {data.students.length} étudiants inscrits
          </span>
        </div>
      </div>

      {/* Two Breakdown Columns: Cashiers and Payment Modes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown by Cashier */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Répartition des encaissements par agent caissier
            </h3>
            <p className="text-xs text-slate-500">
              Audit comptable de clôture par guichet
            </p>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Guichet / Caissier(ère)</th>
                <th className="py-2.5 px-4 text-right">Volume Encaissé (FCFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {Object.entries(byCashier).length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-slate-400">
                    Aucun encaissement enregistré.
                  </td>
                </tr>
              ) : (
                Object.entries(byCashier).map(([name, amount]) => (
                  <tr key={name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {name}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatFCFA(amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Breakdown by Payment Method */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Répartition par mode de règlement
            </h3>
            <p className="text-xs text-slate-500">
              Espèces, Mobile Money (MTN/Airtel), Virements, Chèques
            </p>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Mode de règlement</th>
                <th className="py-2.5 px-4 text-right">Montant (FCFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {Object.entries(byMode).length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-slate-400">
                    Aucune transaction disponible.
                  </td>
                </tr>
              ) : (
                Object.entries(byMode).map(([mode, amount]) => (
                  <tr key={mode} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {mode}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatFCFA(amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Transaction Journal */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Grand livre des opérations de caisse
          </h3>
          <span className="text-xs text-slate-500">{data.pay.length} opération(s) enregistrée(s)</span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Matricule</th>
                <th className="py-2.5 px-4">Étudiant</th>
                <th className="py-2.5 px-4">Montant</th>
                <th className="py-2.5 px-4">Mode</th>
                <th className="py-2.5 px-4">Caissier(ère)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.pay.map((p) => {
                const s = data.students.find((item) => item.id === p.etu);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {p.date}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {s?.mat || '—'}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {s ? `${s.nom} ${s.prenom}` : 'Inconnu'}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatFCFA(p.montant)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">{p.mode}</td>
                    <td className="py-2.5 px-4 text-slate-500">{p.caissier || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
