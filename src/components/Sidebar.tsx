import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  FileCheck2,
  Wallet,
  Users2,
  Megaphone,
  ShieldCheck,
  Building2,
  CheckSquare,
  UserCheck,
  Settings,
  Sparkles,
  X,
  Target,
} from 'lucide-react';
import { RoleType } from '../types';
import {
  MENU_PERMISSIONS,
  ROLE_LABELS,
  UNIVERSITY_LOGO,
} from '../constants/assets';

interface Props {
  currentView: string;
  onSelectView: (view: string) => void;
  currentRole: RoleType;
  onChangeRole: (role: RoleType) => void;
  unreadAnnouncements: number;
  unreadCashierAlerts: number;
  unreadMissions: number;
  onResetSeedData: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenAuth: () => void;
  userEmail?: string | null;
}

export const Sidebar: React.FC<Props> = ({
  currentView,
  onSelectView,
  currentRole,
  onChangeRole,
  unreadAnnouncements,
  unreadCashierAlerts,
  unreadMissions,
  onResetSeedData,
  isOpenMobile,
  onCloseMobile,
  onOpenAuth,
  userEmail,
}) => {
  const allowedViews = MENU_PERMISSIONS[currentRole] || [];

  const navItems = [
    { id: 'dash', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'mis', label: 'Ma mission & Rôles', icon: Target },
    { id: 'mi', label: 'Missions & Tâches', icon: CheckSquare, badge: unreadMissions },
    { id: 'etu', label: 'Étudiants & Inscriptions', icon: GraduationCap },
    { id: 'aca', label: 'Structure Académique', icon: BookOpen },
    { id: 'pres', label: 'Présences & Appels', icon: CalendarCheck },
    { id: 'notes', label: 'Notes & Relevés LMD', icon: Award },
    { id: 'exam', label: 'Examens & Délibérations', icon: FileCheck2 },
    { id: 'fin', label: 'Caisse & Scolarité', icon: Wallet, badge: unreadCashierAlerts },
    { id: 'ens', label: 'Enseignants & Personnel', icon: Users2 },
    { id: 'com', label: 'Communication interne', icon: Megaphone, badge: unreadAnnouncements },
    { id: 'surv', label: 'Surveillance & Accès', icon: ShieldCheck },
    { id: 'prs', label: 'Vue Présidence (Audit)', icon: Building2 },
    { id: 'usr', label: 'Utilisateurs & Comptes', icon: UserCheck },
    { id: 'par', label: 'Paramètres du système', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0f3b2e] text-white flex flex-col border-r border-[#1e4e40] transition-transform duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#1e4e40] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white p-1 shadow-md flex items-center justify-center shrink-0">
              <img
                src={UNIVERSITY_LOGO}
                alt="Logo Université Henri Lopes"
                className="w-full h-auto object-contain"
              />
            </div>
            <div>
              <h1 className="font-['Bricolage_Grotesque'] font-bold text-sm tracking-tight text-white leading-tight">
                Univ. Henri Lopes
              </h1>
              <p className="text-[11px] text-emerald-300/80 font-normal">
                Pointe-Noire · Gestion LMD
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-emerald-200 hover:text-white p-1 rounded-md"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selector Simulator */}
        <div className="p-3 bg-[#0a2c22] border-b border-[#1e4e40]">
          <label className="block text-[11px] text-emerald-200/90 font-medium mb-1">
            Rôle actif / Vue métier :
          </label>
          <select
            value={currentRole}
            onChange={(e) => onChangeRole(e.target.value as RoleType)}
            className="w-full bg-[#134436] text-white text-xs rounded-lg px-2.5 py-1.5 border border-[#246250] focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium cursor-pointer"
          >
            {(Object.keys(ROLE_LABELS) as RoleType[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {navItems
            .filter((item) => allowedViews.includes(item.id))
            .map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#e8b923] text-slate-950 font-bold shadow-sm'
                      : 'text-emerald-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-emerald-300'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1.5 shrink-0 ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>

        {/* Firebase Auth & Demo Seed Reset Action */}
        <div className="p-3 border-t border-[#1e4e40] bg-[#0c3126] space-y-2">
          <button
            onClick={() => {
              onOpenAuth();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-200 hover:text-white text-xs font-semibold border border-indigo-700/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <span className={`w-2 h-2 rounded-full ${userEmail ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="truncate">{userEmail || 'Connexion Firebase'}</span>
            </div>
            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold">
              {userEmail ? 'Compte' : 'Login'}
            </span>
          </button>

          <button
            onClick={onResetSeedData}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-900 text-emerald-200 hover:text-white text-[11px] font-semibold border border-emerald-700/40 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Réinitialiser démo
          </button>
        </div>
      </aside>
    </>
  );
};
