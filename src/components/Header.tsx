import React from 'react';
import { Menu, FileSpreadsheet } from 'lucide-react';
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
  userEmail?: string | null;
  userDisplayName?: string | null;
}

export const Header: React.FC<Props> = ({
  title,
  subtitle,
  academicYear,
  role,
  onOpenMobileMenu,
  onExportExcel,
  onOpenAuth,
  userEmail,
  userDisplayName,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle, University Crest & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Official crest emblem in header */}
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0">
          <img
            src={UNIVERSITY_LOGO}
            alt="Emblème Université Henri Lopes"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white truncate">
              {title}
            </h2>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {academicYear}
            </span>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Quick actions and Firebase Auth indicator */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onExportExcel}
          title="Exporter la base de données en Excel"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span className="hidden md:inline">Excel</span>
        </button>

        {/* Firebase Account Button */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
            {userEmail ? (userDisplayName || userEmail)[0].toUpperCase() : '👤'}
          </div>
          <div className="hidden sm:flex flex-col items-start text-left leading-tight">
            <span className="text-[11px] font-bold truncate max-w-[120px]">
              {userEmail ? (userDisplayName || userEmail.split('@')[0]) : 'Compte Firebase'}
            </span>
            <span className="text-[9px] text-indigo-600 dark:text-indigo-400">
              {userEmail ? 'Connecté' : 'Connexion / Inscription'}
            </span>
          </div>
        </button>

        <div className="hidden lg:flex flex-col items-end pl-2 border-l border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {ROLE_LABELS[role]}
          </span>
          <span className="text-[10px] text-slate-400">Pointe-Noire</span>
        </div>
      </div>
    </header>
  );
};
