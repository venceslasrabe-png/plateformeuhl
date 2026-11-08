import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Building2, Calculator, Wallet, ShieldCheck } from 'lucide-react';
import { AppData, AppParams } from '../types';
import { DEFAULT_PARAMS, UNIVERSITY_LOGO, UNIVERSITY_MOTTO, UNIVERSITY_NAME, UNIVERSITY_CITY, UNIVERSITY_COUNTRY } from '../constants/assets';

interface Props {
  data: AppData;
  onSaveData: (data: AppData) => void;
  onNotify: (msg: string) => void;
}

export const SettingsView: React.FC<Props> = ({ data, onSaveData, onNotify }) => {
  const [params, setParams] = useState<AppParams>({ ...data.p });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveData({ ...data, p: params });
    onNotify('Paramètres du système enregistrés.');
  };

  const handleResetDefaults = () => {
    setParams(DEFAULT_PARAMS);
    onSaveData({ ...data, p: DEFAULT_PARAMS });
    onNotify('Paramètres réinitialisés aux valeurs d’origine.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
          Configuration Générale du Système LMD
        </h2>
        <p className="text-xs text-slate-500">
          Règles de validation, barème de scolarité, identité institutionnelle et coordonnées officielles
        </p>
      </div>

      {/* Official University Emblem & Identity Preview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-900/50 shadow-md flex flex-col sm:flex-row items-center gap-6">
        <div className="w-28 h-28 rounded-2xl bg-white p-2.5 shadow-xl flex items-center justify-center shrink-0 border-2 border-amber-400/40">
          <img
            src={UNIVERSITY_LOGO}
            alt="Emblème officiel"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Emblème certifié pour tous les exports PDF & cartes PVC
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-['Bricolage_Grotesque'] text-white">
            {UNIVERSITY_NAME}
          </h3>
          <p className="text-xs text-slate-300">
            {UNIVERSITY_CITY} · {UNIVERSITY_COUNTRY}
          </p>
          <p className="text-xs font-medium text-amber-300 italic">
            Devise officielle : « {UNIVERSITY_MOTTO} »
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Academic LMD Rules */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Barème & Règles Académiques LMD
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Année académique en cours
              <input
                type="text"
                required
                value={params.ann}
                onChange={(e) => setParams({ ...params, ann: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              />
            </label>

            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Seuil de validation d’un semestre (/20)
              <input
                type="number"
                step="0.5"
                min="8"
                max="15"
                required
                value={params.seuil}
                onChange={(e) => setParams({ ...params, seuil: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Moyenne minimale pour valider l’ensemble des crédits (compensation).
              </span>
            </label>

            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Poids du Contrôle Continu (CC en %)
              <input
                type="number"
                min="10"
                max="80"
                required
                value={params.cc}
                onChange={(e) => setParams({ ...params, cc: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                L'examen final compte pour {100 - params.cc}%.
              </span>
            </label>
          </div>
        </div>

        {/* Tuition Fees Schedule */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Grille Tarifaire de la Scolarité Annuelle (FCFA)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Cycle Licence (L1, L2, L3)
              <input
                type="number"
                step="5000"
                required
                value={params.fees.Licence}
                onChange={(e) =>
                  setParams({
                    ...params,
                    fees: { ...params.fees, Licence: Number(e.target.value) },
                  })
                }
                className="mt-1 w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </label>

            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Cycle Master (M1, M2)
              <input
                type="number"
                step="5000"
                required
                value={params.fees.Master}
                onChange={(e) =>
                  setParams({
                    ...params,
                    fees: { ...params.fees, Master: Number(e.target.value) },
                  })
                }
                className="mt-1 w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </label>

            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Cycle Doctorat (D1, D2, D3)
              <input
                type="number"
                step="5000"
                required
                value={params.fees.Doctorat}
                onChange={(e) =>
                  setParams({
                    ...params,
                    fees: { ...params.fees, Doctorat: Number(e.target.value) },
                  })
                }
                className="mt-1 w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </label>
          </div>
        </div>

        {/* Institution Contact Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Coordonnées Officielles de l’Université
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Adresse physique du campus
              <input
                type="text"
                value={params.adr || ''}
                onChange={(e) => setParams({ ...params, adr: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </label>

            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Téléphones officiels
              <input
                type="text"
                value={params.tel || ''}
                onChange={(e) => setParams({ ...params, tel: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </label>

            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              E-mail officiel
              <input
                type="email"
                value={params.mail || ''}
                onChange={(e) => setParams({ ...params, mail: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            Rétablir valeurs par défaut
          </button>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#0f4c3a] text-white font-bold text-xs hover:bg-[#0c3c2e] transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  );
};
