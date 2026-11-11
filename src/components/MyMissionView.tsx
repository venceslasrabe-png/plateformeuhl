import React from 'react';
import { AppData, RoleType } from '../types';
import { ROLE_LABELS, ROLE_MISSIONS, MENU_PERMISSIONS } from '../constants/assets';
import { ShieldCheck, UserCheck, Briefcase, ChevronRight, Users, CheckCircle2 } from 'lucide-react';

interface MyMissionViewProps {
  data: AppData;
  activeRole: RoleType;
  userName: string;
  onNavigate: (viewId: string) => void;
}

const ALL_ROLES_ORDER: RoleType[] = [
  'inscriptions',
  'academique',
  'surveillant',
  'enseignant',
  'caisse',
  'scolarite',
  'direction',
  'president',
  'admin',
];

const VIEW_TITLES: Record<string, string> = {
  dash: 'Tableau de bord',
  mis: 'Ma mission',
  mi: 'Missions assignées',
  etu: 'Étudiants et inscriptions',
  aca: 'Académique (Parcours, UE, EC, EDT)',
  pres: 'Feuille de présences',
  notes: 'Notes et relevés LMD',
  exam: 'Examens et délibérations',
  fin: 'Inscriptions et finances',
  ens: 'Corps enseignant',
  com: 'Communication & Diffusions',
  surv: 'Surveillance & Contrôle des accès',
  prs: 'Vue d’audit Présidence',
  usr: 'Utilisateurs & Droits',
  par: 'Paramètres généraux',
};

export const MyMissionView: React.FC<MyMissionViewProps> = ({
  data,
  activeRole,
  userName,
  onNavigate,
}) => {
  // Find missions assigned to current user or active role
  const myMissions = data.missions.filter(
    (m) => m.to === `r:${activeRole}` || m.to === 'r:Tous'
  );

  const accessibleViews = MENU_PERMISSIONS[activeRole] || [];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-display">
          Ma mission & Organisation
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Fiche de poste, périmètre de responsabilité et organisation fonctionnelle de l’université.
        </p>
      </div>

      {/* Hero Card for the Active User */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Session active · {ROLE_LABELS[activeRole]}
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
              {userName}
            </h3>

            <p className="text-slate-300 text-base leading-relaxed">
              {ROLE_MISSIONS[activeRole]}
            </p>

            <div className="pt-2 text-xs text-slate-400 flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-slate-300">Modules accessibles :</span>
              {accessibleViews.map((vid) => (
                <span
                  key={vid}
                  className="px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/10 text-[11px]"
                >
                  {VIEW_TITLES[vid] || vid}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={() => onNavigate('mi')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-950/50 cursor-pointer"
            >
              <Briefcase className="w-4 h-4" />
              Consulter mes missions ({myMissions.length})
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => onNavigate('dash')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/10 cursor-pointer"
            >
              Tableau de bord général
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Mes tâches en cours & Informations de poste */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col: Operational Duties */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold font-display">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3>Périmètre d'autorité LMD</h3>
          </div>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Conformité avec les arrêtés rectoraux du système LMD en vigueur à Pointe-Noire.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Traçabilité des opérations académiques et horodatage certifié.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Sécurité des données personnelles des étudiants et des familles.</span>
            </li>
          </ul>
        </div>

        {/* Middle & Right col: Missions assignées */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-bold font-display">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <h3>Directives & Missions prioritaires pour {ROLE_LABELS[activeRole]}</h3>
            </div>
            <button
              onClick={() => onNavigate('mi')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              Voir tout
            </button>
          </div>

          {myMissions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <UserCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 text-sm font-medium">
                Aucune mission en attente pour ce rôle spécifique.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Les nouvelles affectations de la Direction s’afficheront directement ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myMissions.slice(0, 3).map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-200 transition-all flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm">{m.titre}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          m.priorite === 'Urgente'
                            ? 'bg-rose-100 text-rose-700'
                            : m.priorite === 'Haute'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {m.priorite}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          m.statut === 'Terminée'
                            ? 'bg-emerald-100 text-emerald-700'
                            : m.statut === 'En cours'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {m.statut}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{m.desc}</p>
                    <p className="text-[11px] text-slate-400">
                      Échéance : <span className="font-medium text-slate-600">{m.delai}</span> · Attribué par {m.par || 'Direction'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Organigramme et Organisation de la plateforme */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 font-display">
              Organisation fonctionnelle de la plateforme
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Université Henri Lopes · Pointe-Noire
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Fonction / Rôle</th>
                <th className="px-6 py-3.5">Mission type & Périmètre</th>
                <th className="px-6 py-3.5">Modules opérationnels</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {ALL_ROLES_ORDER.map((rk) => {
                const isCurrent = rk === activeRole;
                return (
                  <tr
                    key={rk}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-indigo-50/70 font-medium'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            isCurrent ? 'bg-indigo-600 ring-4 ring-indigo-100' : 'bg-slate-300'
                          }`}
                        />
                        <span className={isCurrent ? 'text-indigo-900 font-bold' : 'text-slate-800'}>
                          {ROLE_LABELS[rk]}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                            Votre rôle
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 leading-relaxed max-w-md">
                      {ROLE_MISSIONS[rk]}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(MENU_PERMISSIONS[rk] || []).map((mKey) => (
                          <span
                            key={mKey}
                            className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]"
                          >
                            {VIEW_TITLES[mKey] || mKey}
                          </span>
                        ))}
                      </div>
                    </td>
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
