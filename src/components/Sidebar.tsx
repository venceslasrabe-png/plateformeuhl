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
  LogOut,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
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
  onLogout?: () => void;
  userEmail?: string | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
  onLogout,
  userEmail,
  isCollapsed = false,
  onToggleCollapse,
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
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#0f3b2e] text-white flex flex-col border-r border-[#1e4e40] transition-all duration-300 ${
          isOpenMobile ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-[68px]' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="p-3 sm:p-4 border-b border-[#1e4e40] flex items-center justify-between min-h-[64px]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md flex items-center justify-center shrink-0">
              <img
                src={UNIVERSITY_LOGO}
                alt="Logo Université Henri Lopes"
                className="w-full h-full object-contain"
              />
            </div>
            {(!isCollapsed || isOpenMobile) && (
              <div className="min-w-0 truncate">
                <h1 className="font-['Bricolage_Grotesque'] font-bold text-sm tracking-tight text-white leading-tight truncate">
                  <span className="text-amber-300 font-extrabold mr-1">UHL</span> · Henri Lopes
                </h1>
                <p className="text-[10px] text-emerald-300/80 font-normal truncate">
                  Pointe-Noire · LMD
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Déployer la barre latérale' : 'Réduire la barre latérale'}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label={isCollapsed ? 'Déployer la barre latérale' : 'Réduire la barre latérale'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-amber-300" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-emerald-200 hover:text-white p-1.5 rounded-md hover:bg-white/10 cursor-pointer"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selector Simulator */}
        <div className="p-2.5 bg-[#0a2c22] border-b border-[#1e4e40]">
          {!isCollapsed || isOpenMobile ? (
            <div>
              <label className="block text-[10px] text-emerald-200/90 font-medium mb-1">
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
          ) : (
            <div
              title={`Vue active : ${ROLE_LABELS[currentRole]}`}
              className="flex flex-col items-center justify-center py-1 cursor-pointer"
              onClick={onToggleCollapse}
            >
              <span className="w-8 h-8 rounded-lg bg-[#134436] border border-[#246250] flex items-center justify-center text-[10px] font-bold text-amber-300 uppercase shadow-xs">
                {currentRole.slice(0, 3)}
              </span>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems
            .filter((item) => allowedViews.includes(item.id))
            .map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const isSlim = isCollapsed && !isOpenMobile;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    onCloseMobile();
                  }}
                  title={isSlim ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl text-xs font-medium transition-all cursor-pointer relative ${
                    isSlim ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                  } ${
                    isActive
                      ? 'bg-[#e8b923] text-slate-950 font-bold shadow-sm'
                      : 'text-emerald-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className={`flex items-center gap-2.5 ${isSlim ? 'justify-center' : 'min-w-0 truncate'}`}>
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-emerald-300'}`} />
                    {!isSlim && <span className="truncate">{item.label}</span>}
                  </div>

                  {/* Badge */}
                  {item.badge !== undefined && item.badge > 0 && (
                    isSlim ? (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-[#0f3b2e]" />
                    ) : (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1.5 shrink-0 ${
                          isActive
                            ? 'bg-slate-900 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )
                  )}
                </button>
              );
            })}
        </nav>

        {/* Firebase Auth & Demo Seed Reset Action */}
        <div className={`border-t border-[#1e4e40] bg-[#0c3126] ${isCollapsed && !isOpenMobile ? 'p-2 space-y-2' : 'p-3 space-y-2'}`}>
          {!isCollapsed || isOpenMobile ? (
            <>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    onOpenAuth();
                    onCloseMobile();
                  }}
                  className="flex-1 flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-200 hover:text-white text-xs font-semibold border border-indigo-700/60 transition-colors cursor-pointer min-w-0"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${userEmail ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span className="truncate">{userEmail || 'Connexion Firebase'}</span>
                  </div>
                  <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold shrink-0 ml-1">
                    {userEmail ? 'Compte' : 'Login'}
                  </span>
                </button>

                {userEmail && onLogout && (
                  <button
                    onClick={() => {
                      onLogout();
                      onCloseMobile();
                    }}
                    title="Se déconnecter"
                    className="p-2 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-200 hover:text-white border border-rose-800/60 transition-colors shrink-0 cursor-pointer"
                    aria-label="Se déconnecter"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={onResetSeedData}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-900 text-emerald-200 hover:text-white text-[11px] font-semibold border border-emerald-700/40 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Réinitialiser démo
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => {
                  onOpenAuth();
                  onCloseMobile();
                }}
                title={userEmail ? `Connecté : ${userEmail}` : 'Connexion Firebase'}
                className="w-10 h-10 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 flex items-center justify-center border border-indigo-700/60 transition-colors cursor-pointer relative"
              >
                <span className={`w-2 h-2 rounded-full absolute top-1 right-1 ${userEmail ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="text-xs font-bold">{userEmail ? userEmail[0].toUpperCase() : '🔒'}</span>
              </button>

              <button
                onClick={onResetSeedData}
                title="Réinitialiser démo"
                className="w-10 h-10 rounded-xl bg-emerald-900/40 hover:bg-emerald-900 text-emerald-200 flex items-center justify-center border border-emerald-700/40 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
