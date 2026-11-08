import React, { useState } from 'react';
import { useAuth } from '../firebase/authContext';
import { RoleType } from '../types';
import { ROLE_LABELS, UNIVERSITY_LOGO, UNIVERSITY_MOTTO, UNIVERSITY_NAME, UNIVERSITY_CITY } from '../constants/assets';
import {
  LogIn,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
  Briefcase,
} from 'lucide-react';

interface AuthPageProps {
  onContinue: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onContinue }) => {
  const {
    user,
    profile,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<RoleType>('enseignant');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      onContinue();
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('La fenêtre de connexion a été fermée avant la fin.');
      } else {
        setErrorMsg(err?.message || 'Erreur lors de la connexion Google.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        onContinue();
      } else {
        if (password.length < 6) {
          setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
          setIsSubmitting(false);
          return;
        }
        await signUpWithEmail(email, password, displayName, role);
        onContinue();
      }
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password') {
        setErrorMsg('Adresse e-mail ou mot de passe incorrect.');
      } else if (err?.code === 'auth/email-already-in-use') {
        setErrorMsg('Cette adresse e-mail est déjà associée à un compte.');
      } else if (err?.code === 'auth/weak-password') {
        setErrorMsg('Le mot de passe est trop faible (minimum 6 caractères).');
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background academic patterns */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      {/* Main card */}
      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        {/* Top University Brand Bar */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-800 to-slate-800/50 border-b border-slate-700/60 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-white p-2 shadow-xl border-2 border-amber-400/40 mb-3 flex items-center justify-center">
            <img
              src={UNIVERSITY_LOGO}
              alt="Emblème Université Henri Lopes"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-['Bricolage_Grotesque'] tracking-tight text-white">
            {UNIVERSITY_NAME}
          </h1>
          <p className="text-xs text-emerald-400 font-medium mt-0.5">
            {UNIVERSITY_CITY} · Plateforme LMD
          </p>
          <p className="text-[11px] text-amber-300 italic mt-1 font-serif">
            « {UNIVERSITY_MOTTO} »
          </p>
        </div>

        {/* User is already connected view */}
        {user ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">
                  Session Firebase active
                </p>
                <p className="text-xs text-emerald-200">
                  Connecté en tant que <span className="font-semibold text-white">{user.displayName || user.email}</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  UID: <code className="text-slate-300">{user.uid.slice(0, 12)}...</code>
                </p>
                {profile && (
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-semibold">
                      {ROLE_LABELS[profile.role] || profile.role}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      {profile.status === 'approved' ? 'Compte validé' : 'En attente de validation'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={onContinue}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                Accéder à la plateforme
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={logout}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-700/60 hover:bg-rose-950/60 hover:text-rose-200 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Tab Switcher */}
            <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/80">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Connexion
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Créer un compte
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="bg-rose-950/50 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-200 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* 1-Click Google Sign In */}
            <div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              >
                {/* Official Google 'G' icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuer avec Google (Firebase Auth)</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-slate-500">
                  <span className="bg-slate-800 px-2">ou par e-mail</span>
                </div>
              </div>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nom complet *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Ex: Dr. Martin Mavoungou"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2.5 pl-9 text-xs rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Fonction / Rôle souhaité *
                    </label>
                    <div className="relative">
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as RoleType)}
                        className="w-full px-3 py-2.5 pl-9 text-xs rounded-xl border border-slate-700 bg-slate-900/60 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {(Object.keys(ROLE_LABELS) as RoleType[])
                          .filter((r) => r !== 'admin')
                          .map((rKey) => (
                            <option key={rKey} value={rKey} className="bg-slate-800">
                              {ROLE_LABELS[rKey]}
                            </option>
                          ))}
                      </select>
                      <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adresse e-mail institutionnelle *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="nom@universite-henrilopes.cg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 pl-9 text-xs rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Au moins 6 caractères"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 pl-9 text-xs rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'signin' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    Se connecter à Firebase
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Créer mon compte Firebase
                  </>
                )}
              </button>
            </form>

            {/* Offline demo option */}
            <div className="pt-2 text-center border-t border-slate-700/60">
              <button
                type="button"
                onClick={onContinue}
                className="text-xs text-slate-400 hover:text-white underline decoration-slate-600 hover:decoration-white transition-colors cursor-pointer"
              >
                Continuer en mode démonstration locale (sans compte)
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Authentification sécurisée Firebase Firestore · Pointe-Noire</span>
        </div>
      </div>
    </div>
  );
};
