import React, { useState } from 'react';
import {
  Menu,
  FileSpreadsheet,
  LogOut,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { RoleType } from '../types';
import { ROLE_LABELS, UNIVERSITY_LOGO } from '../constants/assets';

interface Props {
  title: string;
  subtitle?: string;
  academicYear: string;
  role: RoleType;
  onOpenMobileMenu: () => void;
  onExportExcel: () => void;
  onOpenAuth: () => void;
  onLogout?: () => void;
  userEmail?: string | null;
  userDisplayName?: string | null;
  // Layout readjustment props
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  isFullWidth?: boolean;
  onToggleFullWidth?: () => void;
  density?: 'compact' | 'normal' | 'spacious';
  onChangeDensity?: (d: 'compact' | 'normal' | 'spacious') => void;
}

export const Header: React.FC<Props> = ({
  title,
  subtitle,
  academicYear,
  role,
  onOpenMobileMenu,
  onExportExcel,
  onOpenAuth,
  onLogout,
  userEmail,
  userDisplayName,
  isSidebarCollapsed = false,
  onToggleSidebar,
  isFullWidth = false,
  onToggleFullWidth,
  density = 'normal',
  onChangeDensity,
}) => {
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3 min-h-[64px]">
      {/* Left: Mobile Toggle, Desktop Sidebar Toggle & Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile menu hamburger */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Quick Toggle */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Déployer la barre latérale' : 'Réduire la barre latérale'}
            className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            aria-label={isSidebarCollapsed ? 'Déployer la barre latérale' : 'Réduire la barre latérale'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Official crest emblem in header */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0">
          <img
            src={UNIVERSITY_LOGO}
            alt="Emblème Université Henri Lopes"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base lg:text-lg font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white truncate">
              {title}
            </h2>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
              {academicYear}
            </span>
          </div>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate hidden md:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Readjustment Controls, Excel Export, Auth & Role */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Readjustment Dropdown / Quick Button */}
        <div className="relative">
          <button
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            title="Réajuster la vue et l'affichage du tableau de bord"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isFullWidth || isSidebarCollapsed
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-xs'
                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Réajuster la vue</span>
          </button>

          {/* Layout Settings Popup Menu */}
          {showLayoutMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowLayoutMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-3 z-40 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                    Réajustement de l'affichage
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Bureau</span>
                </div>

                {/* Full Width Toggle */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Largeur de la zone de données
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        if (isFullWidth && onToggleFullWidth) onToggleFullWidth();
                      }}
                      className={`py-1.5 px-2 rounded-lg font-semibold text-center transition-all cursor-pointer ${
                        !isFullWidth
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Standard (1280px)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isFullWidth && onToggleFullWidth) onToggleFullWidth();
                      }}
                      className={`py-1.5 px-2 rounded-lg font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isFullWidth
                          ? 'bg-emerald-600 text-white shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Maximize2 className="w-3 h-3" />
                      Pleine Largeur (100%)
                    </button>
                  </div>
                </div>

                {/* Sidebar Collapse Toggle */}
                {onToggleSidebar && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="block font-bold text-slate-800 dark:text-slate-200">
                        Barre latérale rétractable
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isSidebarCollapsed ? 'Mode icônes compact (68px)' : 'Mode déployé standard (256px)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleSidebar}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer"
                    >
                      {isSidebarCollapsed ? 'Déployer' : 'Réduire'}
                    </button>
                  </div>
                )}

                {/* Display Density */}
                {onChangeDensity && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Densité d'affichage
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl text-center">
                      {(['compact', 'normal', 'spacious'] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => onChangeDensity(d)}
                          className={`py-1 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                            density === d
                              ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {d === 'compact' ? 'Compact' : d === 'normal' ? 'Normal' : 'Aéré'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Excel Export Button */}
        <button
          onClick={onExportExcel}
          title="Exporter la base de données en Excel"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span className="hidden md:inline">Excel</span>
        </button>

        {/* Firebase Account Button */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
            {userEmail ? (userDisplayName || userEmail)[0].toUpperCase() : '👤'}
          </div>
          <div className="hidden sm:flex flex-col items-start text-left leading-tight">
            <span className="text-[11px] font-bold truncate max-w-[120px]">
              {userEmail ? (userDisplayName || userEmail.split('@')[0]) : 'Compte Firebase'}
            </span>
            <span className="text-[9px] text-indigo-600 dark:text-indigo-400">
              {userEmail ? 'Connecté' : 'Connexion'}
            </span>
          </div>
        </button>

        {userEmail && onLogout && (
          <button
            onClick={onLogout}
            title="Se déconnecter de la session Firebase"
            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
            aria-label="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}

        <div className="hidden xl:flex flex-col items-end pl-2 border-l border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {ROLE_LABELS[role]}
          </span>
          <span className="text-[10px] text-slate-400">Pointe-Noire</span>
        </div>
      </div>
    </header>
  );
};
