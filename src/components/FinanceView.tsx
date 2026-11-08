import React, { useState } from 'react';
import {
  Wallet,
  Receipt,
  Plus,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { AppData, Payment } from '../types';
import { calcBalance, calcFee, calcPaid, formatFCFA, uid } from '../services/storage';
import { downloadPaymentReceiptPdf } from '../services/pdfGenerator';

interface Props {
  data: AppData;
  onSaveData: (data: AppData) => void;
  onNotify: (msg: string) => void;
}

export const FinanceView: React.FC<Props> = ({ data, onSaveData, onNotify }) => {
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState<Omit<Payment, 'id'>>({
    etu: data.students[0]?.id || '',
    montant: 50000,
    mode: 'Mobile money',
    date: new Date().toISOString().slice(0, 10),
    caissier: 'Caisse Centrale - Guichet 1',
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payForm.montant <= 0) return;

    const newPayment: Payment = {
      id: uid(),
      ts: Date.now(),
      ...payForm,
    };

    onSaveData({ ...data, pay: [newPayment, ...data.pay] });
    setShowPayModal(false);
    onNotify(`Paiement de ${formatFCFA(newPayment.montant)} enregistré avec succès !`);
  };

  const handleQuickPayForStudent = (studentId: string) => {
    const s = data.students.find((x) => x.id === studentId);
    if (!s) return;
    const balance = calcBalance(s, data);
    setPayForm({
      etu: studentId,
      montant: balance > 0 ? balance : 50000,
      mode: 'Espèces',
      date: new Date().toISOString().slice(0, 10),
      caissier: 'Caisse Centrale - Guichet 1',
    });
    setShowPayModal(true);
  };

  // Pending registrations in announcements
  const pendingAnnouncements = data.ann
    .filter((a) => a.cible === 'Caisse')
    .slice()
    .reverse();

  // Financial summary
  const totalReceived = data.pay.reduce((sum, p) => sum + Number(p.montant), 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const totalReceivedToday = data.pay
    .filter((p) => p.date === todayStr)
    .reduce((sum, p) => sum + Number(p.montant), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            Caisse & Scolarité Financière
          </h2>
          <p className="text-xs text-slate-500">
            Encaissement des frais de formation, délivrance des reçus officiels et suivi des soldes
          </p>
        </div>

        <button
          onClick={() => setShowPayModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0f4c3a] text-white text-xs font-bold hover:bg-[#0c3c2e] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Enregistrer un encaissement
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">Encaissé Aujourd’hui</span>
          <b className="text-2xl font-bold font-['Bricolage_Grotesque'] text-emerald-700 dark:text-emerald-400">
            {formatFCFA(totalReceivedToday)}
          </b>
          <span className="text-[11px] text-slate-400 block mt-1">
            Opérations du {new Date().toLocaleDateString('fr-FR')}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">Total Encaissé ({data.p.ann})</span>
          <b className="text-2xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            {formatFCFA(totalReceived)}
          </b>
          <span className="text-[11px] text-slate-400 block mt-1">
            {data.pay.length} transactions validées
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">Reste Global à Recouvrer</span>
          <b className="text-2xl font-bold font-['Bricolage_Grotesque'] text-amber-700 dark:text-amber-400">
            {formatFCFA(
              Math.max(
                0,
                data.students.reduce((acc, s) => acc + calcBalance(s, data), 0)
              )
            )}
          </b>
          <span className="text-[11px] text-slate-400 block mt-1">
            Sur l’ensemble des promotions
          </span>
        </div>
      </div>

      {/* Inscriptions à encaisser (Notifications from Scolarité) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            Inscriptions récentes transmises à la Caisse
          </h3>
          <span className="text-xs text-slate-500">{pendingAnnouncements.length} notification(s)</span>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {pendingAnnouncements.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 italic text-center">
              Aucune nouvelle inscription en attente d'encaissement.
            </p>
          ) : (
            pendingAnnouncements.map((ann) => {
              const stu = data.students.find((s) => s.id === ann.etu);
              const balance = stu ? calcBalance(stu, data) : 0;
              return (
                <div
                  key={ann.id}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                          balance <= 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {balance <= 0 ? 'Soldé' : 'À encaisser'}
                      </span>
                      <b className="text-slate-900 dark:text-white">{ann.titre}</b>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">{ann.msg}</p>
                  </div>

                  {stu && balance > 0 && (
                    <button
                      onClick={() => handleQuickPayForStudent(stu.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0f4c3a] text-white font-semibold text-[11px] hover:bg-[#0c3c2e] transition-colors shrink-0"
                    >
                      Encaisser
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Two Column Section: Payment History & Balances by Student */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions Journal */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Journal des encaissements récents
            </h3>
            <span className="text-xs text-slate-500">{data.pay.length} reçu(s)</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Étudiant</th>
                  <th className="py-2.5 px-3">Montant</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3 text-right">Reçu PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.pay.slice(0, 15).map((p) => {
                  const s = data.students.find((item) => item.id === p.etu);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {p.date}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                        {s ? `${s.nom} ${s.prenom}` : 'Inconnu'}
                      </td>
                      <td className="py-2.5 px-3 font-bold font-mono text-emerald-700 dark:text-emerald-400">
                        {formatFCFA(p.montant)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {p.mode}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => downloadPaymentReceiptPdf(p, data)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Télécharger le reçu de paiement officiel"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Balances Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Situation financière par étudiant
            </h3>
            <span className="text-xs text-slate-500">
              {data.students.filter((s) => calcBalance(s, data) > 0).length} impayé(s)
            </span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Étudiant</th>
                  <th className="py-2.5 px-3">Coût</th>
                  <th className="py-2.5 px-3">Payé</th>
                  <th className="py-2.5 px-3">Solde dû</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.students.map((s) => {
                  const fee = calcFee(s, data);
                  const paid = calcPaid(s.id, data);
                  const balance = calcBalance(s, data);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3">
                        <b className="text-slate-900 dark:text-white block">
                          {s.nom} {s.prenom}
                        </b>
                        <span className="text-[10px] text-slate-400 font-mono">{s.mat}</span>
                      </td>
                      <td className="py-2 px-3 font-mono">{formatFCFA(fee)}</td>
                      <td className="py-2 px-3 font-mono text-emerald-700 dark:text-emerald-400">
                        {formatFCFA(paid)}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`font-mono font-bold ${
                            balance <= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {balance <= 0 ? 'Soldé' : formatFCFA(balance)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {balance > 0 && (
                          <button
                            onClick={() => handleQuickPayForStudent(s.id)}
                            className="px-2 py-1 rounded bg-[#0f4c3a] text-white font-semibold text-[10px] hover:bg-[#0c3c2e] transition-colors"
                          >
                            Encaisser
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
      </div>

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 font-['Bricolage_Grotesque']">
              Enregistrer un encaissement de scolarité
            </h3>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Étudiant bénéficiaire
                <select
                  value={payForm.etu}
                  onChange={(e) => setPayForm({ ...payForm, etu: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  {data.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.mat} — {s.nom} {s.prenom} (Solde : {formatFCFA(calcBalance(s, data))})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Montant versé (FCFA) *
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  value={payForm.montant}
                  onChange={(e) => setPayForm({ ...payForm, montant: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 text-xs font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </label>

              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Mode de règlement
                <select
                  value={payForm.mode}
                  onChange={(e) => setPayForm({ ...payForm, mode: e.target.value as any })}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Espèces">Espèces (Guichet)</option>
                  <option value="Mobile money">Mobile money (MTN / Airtel)</option>
                  <option value="Virement">Virement bancaire</option>
                  <option value="Chèque">Chèque certifié</option>
                </select>
              </label>

              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Date d’encaissement
                <input
                  type="date"
                  required
                  value={payForm.date}
                  onChange={(e) => setPayForm({ ...payForm, date: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </label>

              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Caissier(ère) responsable
                <input
                  type="text"
                  required
                  value={payForm.caissier}
                  onChange={(e) => setPayForm({ ...payForm, caissier: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0f4c3a] hover:bg-[#0c3c2e] rounded-lg shadow-sm"
                >
                  Valider l’encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
