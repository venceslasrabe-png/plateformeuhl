import React, { useState, useEffect, useTransition } from 'react';
import { AppData, RoleType } from './types';
import {
  loadAppData,
  saveAppData,
  resetSeedData,
} from './services/storage';
import { exportGeneralExcel } from './services/excelExporter';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { MyMissionView } from './components/MyMissionView';
import { MissionsView } from './components/MissionsView';
import { StudentsView } from './components/StudentsView';
import { AcademicView } from './components/AcademicView';
import { AttendanceView } from './components/AttendanceView';
import { GradesView } from './components/GradesView';
import { ExamsView } from './components/ExamsView';
import { FinanceView } from './components/FinanceView';
import { TeachersView } from './components/TeachersView';
import { CommunicationView } from './components/CommunicationView';
import { SurveillanceView } from './components/SurveillanceView';
import { PresidentView } from './components/PresidentView';
import { UsersRolesView } from './components/UsersRolesView';
import { SettingsView } from './components/SettingsView';
import { AuthPage } from './components/AuthPage';
import { AuthProvider, useAuth } from './firebase/authContext';
import { CheckCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react';
import {
  MENU_PERMISSIONS,
  ROLE_LABELS,
  UNIVERSITY_NAME,
  UNIVERSITY_CITY,
  UNIVERSITY_LOGO,
} from './constants/assets';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
}

const VIEW_METADATA: Record<string, { title: string; subtitle: string }> = {
  dash: {
    title: 'Tableau de bord exécutif',
    subtitle: 'Indicateurs académiques, effectifs et performances en temps réel',
  },
  mis: {
    title: 'Ma mission & Rôles',
    subtitle: 'Fiche de poste, organisation fonctionnelle et directives du campus',
  },
  mi: {
    title: 'Missions & Assignations',
    subtitle: 'Attribution, suivi opérationnel et priorisation des tâches administratives',
  },
  etu: {
    title: 'Étudiants & Inscriptions',
    subtitle: 'Gestion des dossiers, délivrance de cartes PVC avec QR Code et fiches A4',
  },
  aca: {
    title: 'Structure académique LMD',
    subtitle: 'Parcours, Unités d’Enseignement, Éléments Constitutifs & Emploi du temps',
  },
  pres: {
    title: 'Feuille de présences',
    subtitle: 'Appel numérique par cours, flash QR Code et détection d’absences répétées',
  },
  notes: {
    title: 'Notes & Relevés officiels',
    subtitle: 'Saisie CC/Examen/Rattrapage, calcul de compensation LMD et relevés PDF',
  },
  exam: {
    title: 'Examens & Délibérations',
    subtitle: 'Sessions normales et rattrapages, admission semestrielle et procès-verbal',
  },
  fin: {
    title: 'Caisse & Recouvrement',
    subtitle: 'Encaissements, gestion des tranches, reçus officiels et suivi des impayés',
  },
  ens: {
    title: 'Corps professoral & Personnel',
    subtitle: 'Annuaire des enseignants, grades académiques et décompte des volumes horaires',
  },
  com: {
    title: 'Communication & Diffusions',
    subtitle: 'Notes de service, diffusions ciblées et annonces officielles du campus',
  },
  surv: {
    title: 'Surveillance & Contrôle d’accès',
    subtitle: 'Guérite principale, check-in/out par badge et alertes de présence prolongée',
  },
  prs: {
    title: 'Audit Présidence',
    subtitle: 'Console stratégique de surveillance des flux financiers et des opérations',
  },
  usr: {
    title: 'Utilisateurs & Droits d’accès',
    subtitle: 'Validation des demandes de compte, attribution des rôles et sécurité',
  },
  par: {
    title: 'Paramètres du système',
    subtitle: 'Règles LMD, seuils de validation, barème de scolarité et coordonnées',
  },
};

function MainDashboard() {
  const { user, profile, loading, logout } = useAuth();
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [data, setData] = useState<AppData>(loadAppData);
  const [currentRole, setCurrentRole] = useState<RoleType>(() => {
    const saved = localStorage.getItem('uhl_active_role');
    return (saved as RoleType) || 'admin';
  });
  const [currentView, setCurrentView] = useState<string>('dash');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [, startTransition] = useTransition();

  // Synchronize role if logged in user profile has a defined role
  useEffect(() => {
    if (profile?.role) {
      setCurrentRole(profile.role);
    }
  }, [profile?.role]);

  // Save current role
  useEffect(() => {
    localStorage.setItem('uhl_active_role', currentRole);
  }, [currentRole]);

  // Ensure current view is permitted for current role
  useEffect(() => {
    const allowed = MENU_PERMISSIONS[currentRole] || [];
    if (!allowed.includes(currentView)) {
      setCurrentView(allowed[0] || 'dash');
    }
  }, [currentRole, currentView]);

  const handleNotify = (
    message: string,
    type: 'success' | 'info' | 'error' = 'success'
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setHasEntered(false);
      setShowAuthModal(false);
      handleNotify('Session terminée avec succès.', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveData = (newData: AppData) => {
    startTransition(() => {
      setData(newData);
      saveAppData(newData);
    });
  };

  const handleSelectView = (view: string) => {
    setCurrentView(view);
    setIsOpenMobile(false);

    // Update read counters if appropriate
    if (view === 'com' && data.ann.length !== data.seen) {
      const updated = { ...data, seen: data.ann.length };
      handleSaveData(updated);
    } else if (view === 'fin' && (data.seenC || 0) < Date.now()) {
      const updated = { ...data, seenC: Date.now() };
      handleSaveData(updated);
    } else if (view === 'mi' && (data.seenM || 0) < Date.now()) {
      const updated = { ...data, seenM: Date.now() };
      handleSaveData(updated);
    }
  };

  const handleResetSeedData = () => {
    if (
      window.confirm(
        'Voulez-vous réinitialiser toutes les données de démonstration de l’Université Henri Lopes ? Vos modifications locales seront remplacées.'
      )
    ) {
      const fresh = resetSeedData();
      setData(fresh);
      handleNotify('Données de démonstration réinitialisées avec succès.', 'info');
    }
  };

  const handleExportExcel = () => {
    try {
      exportGeneralExcel(data);
      handleNotify('Export Excel généré avec succès !', 'success');
    } catch (err) {
      console.error(err);
      handleNotify("Erreur lors de l'exportation du fichier Excel.", 'error');
    }
  };

  // Unread counters
  const unreadAnnouncements = Math.max(0, data.ann.length - (data.seen || 0));
  const unreadCashierAlerts = data.ann.filter(
    (a) => a.cible === 'Caisse' && (a.ts || 0) > (data.seenC || 0)
  ).length;
  const unreadMissions = data.missions.filter(
    (m) =>
      (m.to === `r:${currentRole}` || m.to === 'r:Tous') &&
      m.statut === 'À faire' &&
      (m.ts || 0) > (data.seenM || 0)
  ).length;

  const currentMeta = VIEW_METADATA[currentView] || {
    title: 'Université Henri Lopes',
    subtitle: 'Gestion académique et administrative LMD',
  };

  // Active user name display
  const currentUserName =
    currentRole === 'admin'
      ? 'Administrateur Général'
      : currentRole === 'direction'
      ? 'Prof. Jean-Baptiste Taty (Directeur)'
      : currentRole === 'scolarite'
      ? 'Dr. Marcellin Mavoungou (Scolarité)'
      : currentRole === 'caisse'
      ? 'Mme Clarisse Boukaka (Caisse)'
      : currentRole === 'enseignant'
      ? 'Dr. Patrick Ntsoumou (Enseignant)'
      : currentRole === 'surveillant'
      ? 'M. Gaston Ngoma (Surveillance Guérite)'
      : 'Cabinet du Président (Audit)';

  // 1. Splash screen while Firebase auth state is being verified
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-2xl bg-white p-3 shadow-2xl mb-5 flex items-center justify-center border-2 border-amber-400/60 animate-pulse">
          <img
            src={UNIVERSITY_LOGO}
            alt="Emblème Université Henri Lopes"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold font-['Bricolage_Grotesque'] text-white">
          {UNIVERSITY_NAME}
        </h1>
        <p className="text-xs text-emerald-400 font-medium mt-1">
          {UNIVERSITY_CITY} · Portail académique LMD
        </p>
        <div className="flex items-center gap-2 mt-6 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Vérification de la session sécurisée Firebase...</span>
        </div>
      </div>
    );
  }

  // 2. Initial Page Gate: Connexion / Inscription is the very first page shown on launch
  if (!hasEntered) {
    return (
      <AuthPage
        onContinue={() => {
          setHasEntered(true);
          handleNotify('Bienvenue sur la plateforme académique Henri Lopes !', 'success');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col antialiased">
      <div className="flex-1 flex overflow-hidden">
        {/* Main Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={handleSelectView}
          currentRole={currentRole}
          onChangeRole={setCurrentRole}
          unreadAnnouncements={unreadAnnouncements}
          unreadCashierAlerts={unreadCashierAlerts}
          unreadMissions={unreadMissions}
          onResetSeedData={handleResetSeedData}
          isOpenMobile={isOpenMobile}
          onCloseMobile={() => setIsOpenMobile(false)}
          onOpenAuth={() => setShowAuthModal(true)}
          onLogout={handleLogout}
          userEmail={user?.email || null}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Sticky Header */}
          <Header
            title={currentMeta.title}
            subtitle={currentMeta.subtitle}
            academicYear={data.p.ann}
            role={currentRole}
            onOpenMobileMenu={() => setIsOpenMobile(true)}
            onExportExcel={handleExportExcel}
            onOpenAuth={() => setShowAuthModal(true)}
            onLogout={handleLogout}
            userEmail={user?.email || null}
            userDisplayName={profile?.displayName || user?.displayName || null}
          />

          {/* Body Content by View */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {currentView === 'dash' && (
              <DashboardView
                data={data}
                onNavigate={handleSelectView}
                onExportExcel={handleExportExcel}
              />
            )}

            {currentView === 'mis' && (
              <MyMissionView
                data={data}
                activeRole={currentRole}
                userName={currentUserName}
                onNavigate={handleSelectView}
              />
            )}

            {currentView === 'mi' && (
              <MissionsView
                data={data}
                currentRole={currentRole}
                onSaveData={handleSaveData}
                onNotify={handleNotify}
              />
            )}

            {currentView === 'etu' && (
              <StudentsView
                data={data}
                onSaveData={handleSaveData}
                onNotify={handleNotify}
              />
            )}

            {currentView === 'aca' && (
              <AcademicView
                data={data}
                onSaveData={handleSaveData}
                onNotify={handleNotify}
              />
            )}

            {currentView === 'pres' && (
              <AttendanceView
                data={data}
                onSaveData={handleSaveData}
                onNotify={handleNotify}
              />
            )}

            {currentView === 'notes' && (
              <GradesView
                data={data}
                onSaveData={handleSaveData}
                onNotify={handleNotify}
              />
            )}

            {currentView === 'exam' && (
              <ExamsView
                data={data}
                onSaveData={handleSaveData}
                onNotify={handleNotify}
              />
            )}

            {currentView === 'fin' && (
              <FinanceView
                data={data}
                onSaveData={handleSaveData}
                onNotify={handleNotify}
              />
            )}

            {currentView === 'ens' && (
              <TeachersView
                data={data}
                onSaveData={handleSaveData}
                onNotify={handleNotify}
              />
            )}

            {currentView === 'com' && (
              <CommunicationView
                data={data}
                onSaveData={handleSaveData}
                onNotify={handleNotify}
              />
            )}

            {currentView === 'surv' && (
              <SurveillanceView
                data={data}
                onSaveData={handleSaveData}
                onNotify={handleNotify}
              />
            )}

            {currentView === 'prs' && <PresidentView data={data} />}

            {currentView === 'usr' && (
              <UsersRolesView
                teachers={data.teachers}
                currentRole={currentRole}
              />
            )}

            {currentView === 'par' && (
              <SettingsView
                data={data}
                onSaveData={handleSaveData}
                onNotify={handleNotify}
              />
            )}
          </main>
        </div>
      </div>

      {/* Authentication Modal / Page */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
            {/* Close button in top-right */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-full border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-100 transition-colors"
              aria-label="Fermer la fenêtre d'authentification"
            >
              <X className="w-5 h-5" />
            </button>

            <AuthPage onContinue={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-4 rounded-xl shadow-xl flex items-start gap-3 pointer-events-auto transition-all transform duration-300 animate-in slide-in-from-bottom-3 ${
                toast.type === 'success'
                  ? 'bg-slate-900 text-white border border-emerald-500/30'
                  : toast.type === 'error'
                  ? 'bg-rose-950 text-rose-50 border border-rose-500/40'
                  : 'bg-indigo-950 text-indigo-50 border border-indigo-500/30'
              }`}
            >
              {toast.type === 'success' && (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              {toast.type === 'error' && (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              {toast.type === 'info' && (
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs sm:text-sm font-medium leading-snug">
                {toast.message}
              </div>
              <button
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                className="text-slate-400 hover:text-white p-0.5"
                aria-label="Fermer la notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}
