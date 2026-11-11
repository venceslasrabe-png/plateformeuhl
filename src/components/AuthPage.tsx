import React, { useState } from 'react';
import { useAuth } from '../firebase/authContext';
import { RoleType } from '../types';
import {
  ROLE_LABELS,
  UNIVERSITY_LOGO,
  UNIVERSITY_MOTTO,
  UNIVERSITY_NAME,
  UNIVERSITY_CITY,
  UNIVERSITY_ABBREVIATION,
} from '../constants/assets';
import {
  LogIn,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  Database,
  School,
  Eye,
  EyeOff,
} from 'lucide-react';

const BACKGROUND_BUILDING_IMAGE = '/assets/aistudio/images_5b58d254.jfif';

interface AuthPageProps {
  onContinue: () => void;
  activeRole?: RoleType;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onContinue, activeRole }) => {
  const {
    user,
    profile,
    loading,
    signInWithEmail,
    signInAsAdmin,
    logout,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCardRequestModal, setShowCardRequestModal] = useState(false);

  const handleFastAdminLogin = () => {
    signInAsAdmin();
    onContinue();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await signInWithEmail(email, password);
      onContinue();
    } catch (err: any) {
      console.error(err);
      if (
        err?.code === 'auth/invalid-credential' ||
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/user-not-found'
      ) {
        setErrorMsg('Adresse e-mail ou mot de passe incorrect.');
      } else if (err?.code === 'auth/invalid-email') {
        setErrorMsg('Format d’adresse e-mail invalide.');
      } else if (err?.code === 'auth/operation-not-allowed') {
        setErrorMsg(
          'La connexion Email/Mot de passe doit être activée dans la console Firebase (utilisez la connexion Google en 1 clic).'
        );
      } else {
        setErrorMsg(err?.message || 'Une erreur est survenue lors de l’authentification.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* =========================================================================
          COLONNE DE GAUCHE : VISUEL BÂTIMENT UNIVERSITÉ & GRADIENT INSTITUTIONNEL
          ========================================================================= */}
      <div className="relative min-h-[380px] lg:min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden select-none">
        {/* Background Building Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out scale-105"
          style={{
            backgroundImage: `url("${BACKGROUND_BUILDING_IMAGE}")`,
          }}
        />

        {/* Deep Teal / Emerald / Marine Gradient Overlay matching the reference document */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a4639]/92 via-[#0f5445]/85 to-[#134969]/90 backdrop-blur-[1.5px]" />

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* Top Left: Logo & University Identity Badge */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-13 h-13 rounded-xl bg-white p-1.5 shadow-lg flex items-center justify-center shrink-0 border border-white/20">
            <img
              src={UNIVERSITY_LOGO}
              alt="Logo Université Henri Lopes"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-white font-extrabold text-base sm:text-lg leading-tight font-['Bricolage_Grotesque'] tracking-tight">
              {UNIVERSITY_NAME} <span className="text-amber-300">({UNIVERSITY_ABBREVIATION})</span>
            </h1>
            <p className="text-emerald-200 text-xs italic font-serif mt-0.5">
              « {UNIVERSITY_MOTTO} »
            </p>
          </div>
        </div>

        {/* Center/Bottom Left: Large Welcome Statement */}
        <div className="relative z-10 my-auto py-10 lg:py-0">
          <div className="max-w-xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight font-['Bricolage_Grotesque'] tracking-tight">
              Bienvenue sur la plateforme académique
            </h2>
            <p className="text-emerald-100 text-sm sm:text-base font-normal mt-3 leading-relaxed">
              Année universitaire 2026-2027
            </p>
          </div>
        </div>

        {/* Bottom Left Footer */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-emerald-200/80">
          <span>© 2026 {UNIVERSITY_NAME} ({UNIVERSITY_ABBREVIATION})</span>
          <span>{UNIVERSITY_CITY} · République du Congo</span>
        </div>
      </div>

      {/* =========================================================================
          COLONNE DE DROITE : FORMULAIRE DE CONNEXION (PLAN CONFORME AU DOCUMENT)
          ========================================================================= */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md space-y-6">
          {/* Header text exactly like the document: "Connexion", "Accédez à votre espace personnel" */}
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white tracking-tight">
              {user ? 'Session Active' : 'Connexion'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {user
                ? 'Vous êtes actuellement authentifié sur la plateforme'
                : 'Accédez à votre espace personnel'}
            </p>
          </div>

          {/* User is already connected */}
          {user ? (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    Connecté avec succès
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Compte : <span className="font-semibold text-emerald-700 dark:text-emerald-300">{user.displayName || user.email}</span>
                  </p>
                  {profile && (
                    <div className="pt-1 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-[#008751]/15 text-[#008751] dark:text-emerald-300 font-bold text-[11px]">
                        {ROLE_LABELS[profile.role] || profile.role}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[11px] font-semibold">
                        {profile.status === 'approved' ? 'Validé' : 'En attente'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={onContinue}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#008751] hover:bg-[#007043] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Accéder à la plateforme</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {user.email === 'smithrabe35@gmail.com' && (
                  <a
                    href="https://console.firebase.google.com/project/second-jet-401209/firestore/databases/ai-studio-universithenrilo-62f89908-22f7-4b65-902d-de2afad1c060/data"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Database className="w-4 h-4 text-amber-600" />
                    <span>Accéder à la console Firestore (Admin) ↗</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={logout}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Error Alert */}
              {errorMsg && (
                <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl p-3 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* Form matching document fields */}
              <form onSubmit={handleEmailAuth} noValidate className="space-y-4">
                {/* Email field as in document */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="text"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    placeholder="universite@-uhl.cg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent transition-all shadow-xs"
                  />
                </div>

                {/* Password field with show/hide toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Mot de passe
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-3.5 pr-11 py-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer p-1"
                      title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button: "Se connecter" */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#008751] hover:bg-[#007043] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Se connecter</span>
                  )}
                </button>
              </form>

              {/* Accès Prédéfini : Rôle Surveillant (universite@-uhl.cg) */}
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Identifiants Rôle Surveillant
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('universite@-uhl.cg');
                      setPassword('uhl2026');
                    }}
                    className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-100 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-700 hover:shadow-xs transition-all cursor-pointer"
                  >
                    Remplir le formulaire
                  </button>
                </div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300 font-mono bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/60 space-y-0.5">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Email : </span>
                    <strong className="text-emerald-800 dark:text-emerald-300 select-all">universite@-uhl.cg</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Mot de passe : </span>
                    <strong className="text-emerald-800 dark:text-emerald-300 select-all">uhl2026</strong>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 italic">
                  Attribue l'accès guérite, pointage QR Code, fiches de présence et alertes de campus.
                </p>
              </div>

              {/* Direct Admin access */}
              <button
                type="button"
                onClick={handleFastAdminLogin}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Accès direct Administrateur (smithrabe35@gmail.com)</span>
              </button>

              {/* Document footer links: "Besoin d'une carte d'étudiant ? Faire une demande", "Les comptes sont créés par l'administration..." */}
              <div className="pt-3 text-center space-y-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Besoin d'une carte d'étudiant ?{' '}
                  <button
                    type="button"
                    onClick={() => setShowCardRequestModal(true)}
                    className="text-[#008751] hover:text-[#007043] font-semibold hover:underline cursor-pointer"
                  >
                    Faire une demande
                  </button>
                </p>

                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Les comptes sont créés par l'administration de l'université.
                </p>

                <div>
                  <button
                    type="button"
                    onClick={onContinue}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline transition-colors cursor-pointer"
                  >
                    Accéder en mode démonstration locale (sans compte)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'information sur la demande de carte d'étudiant */}
      {showCardRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Demande de Carte d'Étudiant
                </h4>
                <p className="text-xs text-slate-500">Service de la Scolarité Centrale · UHL</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <p>
                Pour obtenir votre carte d'étudiant officielle de l'<strong>Université Henri Lopes (UHL)</strong>, veuillez vous rapprocher du guichet de la Scolarité muni des pièces suivantes :
              </p>
              <ul className="list-disc pl-5 space-y-1 font-medium">
                <li>Quittance ou reçu de paiement des frais d'inscription (Caisse UHL)</li>
                <li>Deux (2) photos d'identité récentes en couleur sur fond blanc</li>
                <li>Copie de l'attestation du Baccalauréat ou diplôme équivalent</li>
                <li>Formulaire d'inscription dûment renseigné et signé</li>
              </ul>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 pt-1 font-semibold">
                📍 Bureau de la Scolarité : Boulevard Denis Sassou Nguesso, Pointe-Noire.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCardRequestModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#008751] hover:bg-[#007043] text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
