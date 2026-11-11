import React, { useState, useEffect } from 'react';
import { RoleType, Teacher } from '../types';
import { ROLE_LABELS, ROLE_MISSIONS } from '../constants/assets';
import {
  Users,
  UserPlus,
  Check,
  X,
  Shield,
  Trash2,
  Search,
  AlertCircle,
  Database,
  ExternalLink,
  Copy,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Info,
  Code2,
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

interface ActiveAccount {
  id: string;
  nom: string;
  email?: string;
  role: RoleType;
  mission: string;
  dateCreated: string;
  syncedWithFirestore?: boolean;
}

interface AccountRequest {
  id: string;
  nom: string;
  email: string;
  fonction: RoleType;
  msg: string;
  date: string;
}

interface UsersRolesViewProps {
  teachers: Teacher[];
  currentRole: RoleType;
  currentUserEmail?: string | null;
  onNotify?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const FIREBASE_PROJECT_ID = 'second-jet-401209';
const FIRESTORE_DATABASE_ID = 'ai-studio-universithenrilo-62f89908-22f7-4b65-902d-de2afad1c060';
const FIRESTORE_CONSOLE_URL = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/firestore/databases/${FIRESTORE_DATABASE_ID}/data`;
const FIREBASE_AUTH_USERS_URL = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/users`;

// Conditioning rules: which roles can be created from each active business view
const ALLOWED_CREATION_BY_ROLE: Record<RoleType, RoleType[]> = {
  admin: ['admin', 'direction', 'scolarite', 'inscriptions', 'academique', 'caisse', 'enseignant', 'surveillant', 'president'],
  direction: ['scolarite', 'inscriptions', 'academique', 'caisse', 'enseignant', 'surveillant'],
  scolarite: ['scolarite', 'inscriptions', 'academique', 'enseignant'],
  inscriptions: ['inscriptions'],
  academique: ['academique'],
  caisse: ['caisse'],
  enseignant: [], // Consultation seule
  surveillant: ['surveillant'],
  president: [], // Audit en lecture seule
};

const DEFAULT_ACCOUNTS: ActiveAccount[] = [
  {
    id: 'usr-1',
    nom: 'Prof. Jean-Baptiste Taty',
    email: 'j.taty@universite-henrilopes.cg',
    role: 'direction',
    mission: 'Supervision générale et coordination des départements',
    dateCreated: '2026-09-01',
    syncedWithFirestore: true,
  },
  {
    id: 'usr-2',
    nom: 'Dr. Marcellin Mavoungou',
    email: 'm.mavoungou@universite-henrilopes.cg',
    role: 'scolarite',
    mission: 'Doyen des études, maquettes LMD et délibérations',
    dateCreated: '2026-09-05',
    syncedWithFirestore: true,
  },
  {
    id: 'usr-3',
    nom: 'Mme Clarisse Boukaka',
    email: 'caisse@-uhl.cg',
    role: 'caisse',
    mission: 'Gestionnaire comptable et recouvrement des frais de scolarité',
    dateCreated: '2026-09-10',
    syncedWithFirestore: true,
  },
  {
    id: 'usr-4',
    nom: 'M. Gaston Ngoma',
    email: 'universite@-uhl.cg',
    role: 'surveillant',
    mission: 'Accueil & Contrôle des accès guérite principale et badgeuse campus',
    dateCreated: '2026-09-15',
    syncedWithFirestore: true,
  },
  {
    id: 'usr-5',
    nom: 'Dr. Patrick Ntsoumou',
    email: 'p.ntsoumou@universite-henrilopes.cg',
    role: 'enseignant',
    mission: 'Responsable de la filière Génie Logiciel & Réseaux',
    dateCreated: '2026-09-20',
    syncedWithFirestore: true,
  },
  {
    id: 'usr-6',
    nom: 'Cabinet du Président',
    email: 'president@-uhl.cg',
    role: 'president',
    mission: 'Audit stratégique, consultation et rapports annuels',
    dateCreated: '2026-08-20',
    syncedWithFirestore: true,
  },
  {
    id: 'usr-7',
    nom: 'Service des Inscriptions & Scolarité',
    email: 'inscriptions@-uhl.cg',
    role: 'inscriptions',
    mission: 'Inscriptions, cartes PVC, notes et relevés LMD, examens et délibérations',
    dateCreated: '2026-09-22',
    syncedWithFirestore: true,
  },
  {
    id: 'usr-8',
    nom: 'Direction des Affaires Académiques',
    email: 'academique@-uhl.cg',
    role: 'academique',
    mission: 'Gestion des filières, options, niveaux, classes, maquettes LMD et plannings',
    dateCreated: '2026-09-22',
    syncedWithFirestore: true,
  },
];

const DEFAULT_REQUESTS: AccountRequest[] = [
  {
    id: 'req-1',
    nom: 'Mme Blandine Loubaki',
    email: 'b.loubaki@gmail.com',
    fonction: 'caisse',
    msg: 'Affectée au guichet n°2 pour les inscriptions du second semestre.',
    date: 'Hier à 14:30',
  },
  {
    id: 'req-2',
    nom: 'Ing. Franck Mabiala',
    email: 'f.mabiala@gmail.com',
    fonction: 'enseignant',
    msg: 'Nouveau vacataire en Algorithmique et Systèmes Distribués (L2).',
    date: 'Aujourd’hui à 09:15',
  },
];

export const UsersRolesView: React.FC<UsersRolesViewProps> = ({
  teachers,
  currentRole,
  currentUserEmail,
  onNotify,
}) => {
  const isSuperAdmin = currentUserEmail === 'smithrabe35@gmail.com';

  const [accounts, setAccounts] = useState<ActiveAccount[]>(() => {
    try {
      const saved = localStorage.getItem('uhl_accounts');
      return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  });

  const [requests, setRequests] = useState<AccountRequest[]>(() => {
    try {
      const saved = localStorage.getItem('uhl_account_requests');
      return saved ? JSON.parse(saved) : DEFAULT_REQUESTS;
    } catch {
      return DEFAULT_REQUESTS;
    }
  });

  // Allowed creation roles for the current active business view
  const allowedRoles = ALLOWED_CREATION_BY_ROLE[currentRole] || [];
  const canCreateInCurrentRole = allowedRoles.length > 0;

  // Direct attribution form state
  const [searchPerson, setSearchPerson] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleType>(() => {
    return allowedRoles[0] || 'enseignant';
  });
  const [customMission, setCustomMission] = useState('');
  const [selectedPersonEmail, setSelectedPersonEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI state for database link cards
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showJsonModel, setShowJsonModel] = useState(false);

  // Request decisions state
  const [requestDecisions, setRequestDecisions] = useState<
    Record<string, { role: RoleType; mission: string }>
  >({});

  // Synchronize selectedRole with allowedRoles if currentRole changes
  useEffect(() => {
    if (allowedRoles.length > 0 && !allowedRoles.includes(selectedRole)) {
      setSelectedRole(allowedRoles[0]);
    }
  }, [currentRole, allowedRoles, selectedRole]);

  useEffect(() => {
    localStorage.setItem('uhl_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('uhl_account_requests', JSON.stringify(requests));
  }, [requests]);

  // Load Firestore remote users on mount to merge with local view
  useEffect(() => {
    const fetchRemoteUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (!snap.empty) {
          const remoteList: ActiveAccount[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && data.displayName && data.role) {
              remoteList.push({
                id: docSnap.id,
                nom: data.displayName,
                email: data.email,
                role: data.role as RoleType,
                mission: data.mission || ROLE_MISSIONS[data.role as RoleType] || '',
                dateCreated: (data.createdAt || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
                syncedWithFirestore: true,
              });
            }
          });

          if (remoteList.length > 0) {
            setAccounts((prev) => {
              const existingIds = new Set(prev.map((a) => a.id));
              const newItems = remoteList.filter((item) => !existingIds.has(item.id));
              return [...prev, ...newItems];
            });
          }
        }
      } catch (err) {
        console.warn('Chargement des profils Firestore :', err);
      }
    };

    fetchRemoteUsers();
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(FIRESTORE_CONSOLE_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    onNotify?.('Lien de la base de données Firestore copié !', 'success');
  };

  const handleCopyJson = () => {
    const sample = {
      userId: `user_${Date.now()}`,
      email: selectedPersonEmail || 'personnel@universite-henrilopes.cg',
      displayName: searchPerson || 'Nom du personnel',
      role: selectedRole,
      status: 'approved',
      mission: customMission || ROLE_MISSIONS[selectedRole] || 'Mission fonctionnelle UHL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(sample, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
    onNotify?.('Modèle JSON copié ! Vous pouvez le coller dans la console Firestore.', 'info');
  };

  const handleApproveRequest = async (req: AccountRequest) => {
    const decision = requestDecisions[req.id] || {
      role: req.fonction,
      mission: req.msg || ROLE_MISSIONS[req.fonction] || 'Attribuée par l’administration',
    };

    const newId = `usr-${Date.now()}`;
    const newAcc: ActiveAccount = {
      id: newId,
      nom: req.nom,
      email: req.email,
      role: decision.role,
      mission: decision.mission,
      dateCreated: new Date().toISOString().split('T')[0],
      syncedWithFirestore: true,
    };

    setAccounts([newAcc, ...accounts]);
    setRequests(requests.filter((r) => r.id !== req.id));

    // Synchronize to Firestore
    try {
      await setDoc(doc(db, 'users', newId), {
        userId: newId,
        email: newAcc.email,
        displayName: newAcc.nom,
        role: newAcc.role,
        status: 'approved',
        mission: newAcc.mission,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      onNotify?.(`Compte validé et synchronisé dans Firestore (${ROLE_LABELS[newAcc.role]})`, 'success');
    } catch (err) {
      console.warn('Erreur setDoc Firestore:', err);
      onNotify?.(`Compte validé localement (${ROLE_LABELS[newAcc.role]})`, 'info');
    }
  };

  const handleRejectRequest = (id: string) => {
    setRequests(requests.filter((r) => r.id !== id));
    onNotify?.('Demande de compte rejetée.', 'info');
  };

  const handleAddDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPerson.trim()) return;
    setIsSubmitting(true);

    const newId = `usr-${Date.now()}`;
    const autoEmail = selectedPersonEmail.trim() || `${searchPerson.toLowerCase().replace(/[^a-z0-9]/g, '.')}@universite-henrilopes.cg`;
    const finalMission = customMission.trim() || ROLE_MISSIONS[selectedRole] || 'Mission académique standard';

    const newAcc: ActiveAccount = {
      id: newId,
      nom: searchPerson.trim(),
      email: autoEmail,
      role: selectedRole,
      mission: finalMission,
      dateCreated: new Date().toISOString().split('T')[0],
      syncedWithFirestore: true,
    };

    setAccounts([newAcc, ...accounts]);
    setSearchPerson('');
    setSelectedPersonEmail('');
    setCustomMission('');

    // Write directly to Firestore /users/{newId}
    try {
      await setDoc(doc(db, 'users', newId), {
        userId: newId,
        email: newAcc.email,
        displayName: newAcc.nom,
        role: newAcc.role,
        status: 'approved',
        mission: newAcc.mission,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      onNotify?.(`Personnel ${newAcc.nom} inscrit avec succès dans Firestore (${ROLE_LABELS[newAcc.role]}) !`, 'success');
    } catch (err) {
      console.warn('Erreur setDoc Firestore:', err);
      onNotify?.(`Personnel ${newAcc.nom} inscrit avec succès (Vue métier : ${ROLE_LABELS[newAcc.role]})`, 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAccount = async (id: string) => {
    if (window.confirm('Voulez-vous révoquer l’accès de ce compte ?')) {
      setAccounts(accounts.filter((a) => a.id !== id));
      try {
        await deleteDoc(doc(db, 'users', id));
        onNotify?.('Compte révoqué dans la base de données.', 'info');
      } catch (err) {
        console.warn('Suppression Firestore:', err);
      }
    }
  };

  // Filtered teachers suggestions
  const suggestedTeachers = teachers.filter(
    (t) =>
      searchPerson.length >= 2 &&
      t.nom.toLowerCase().includes(searchPerson.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* View Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight font-display">
            Gestion du personnel & Rôles LMD
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Inscription directe dans la base de données Firebase, conditionnement par vue métier et contrôle des privilèges.
          </p>
        </div>

        {/* Active business view badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Vue métier active :</span>
          <span className="font-bold text-indigo-700 dark:text-indigo-300">
            {ROLE_LABELS[currentRole]}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: LIEN DIRECT VERS LA BASE DE DONNÉES FIREBASE FIRESTORE        */}
      {/* RÉSERVÉ STRICTEMENT À L'ADMINISTRATEUR (smithrabe35@gmail.com)             */}
      {/* ========================================================================= */}
      {isSuperAdmin ? (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-indigo-500/30 relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2 font-display">
                    Base de données Firebase Firestore
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Connectée (smithrabe35@gmail.com)
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-200">
                    ID : <code className="text-amber-300 font-mono text-[11px]">{FIRESTORE_DATABASE_ID}</code> (Projet : <code className="text-amber-200 font-mono text-[11px]">{FIREBASE_PROJECT_ID}</code>)
                  </p>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={FIRESTORE_CONSOLE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Database className="w-4 h-4" />
                  <span>Ouvrir Firestore Console ↗</span>
                </a>

                <a
                  href={FIREBASE_AUTH_USERS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Firebase Auth (Comptes) ↗</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Lien copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Copier le lien</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-xl p-3.5 text-xs text-slate-300 space-y-2">
              <p className="leading-relaxed">
                <strong>Inscription directe dans la base de données :</strong> Vous pouvez créer manuellement les documents du personnel dans la collection <code className="text-amber-300 bg-black/40 px-1.5 py-0.5 rounded font-mono">/users</code> de la console Firestore ci-dessus. Le personnel bénéficiera automatiquement de son rôle et de ses droits lors de sa connexion.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowJsonModel(!showJsonModel)}
                  className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white underline decoration-indigo-400/50 cursor-pointer text-xs"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{showJsonModel ? 'Masquer le modèle de document' : 'Voir le modèle de document JSON à insérer'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  {copiedJson ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Modèle copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier le modèle JSON</span>
                    </>
                  )}
                </button>
              </div>

              {showJsonModel && (
                <div className="mt-2 p-3 bg-black/60 rounded-xl border border-slate-700/60 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                  <pre>{`{
  "userId": "UID_PERSONNEL_OU_MATRICULE",
  "email": "${selectedPersonEmail || 'personnel@universite-henrilopes.cg'}",
  "displayName": "${searchPerson || 'Dr. Prénom Nom'}",
  "role": "${selectedRole}",
  "status": "approved",
  "mission": "${customMission || ROLE_MISSIONS[selectedRole] || 'Mission académique'}",
  "createdAt": "${new Date().toISOString()}",
  "updatedAt": "${new Date().toISOString()}"
}`}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>L'accès console direct à la base de données Firestore est réservé à l'administrateur <strong>smithrabe35@gmail.com</strong>.</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300 shrink-0">
            Réservé Admin
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: CONDITIONNEMENT DE LA CRÉATION PAR LA VUE MÉTIER ACTIVE       */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white font-display text-base">
                Inscription du personnel (Conditionnée par vue métier)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                La création de compte est restreinte et conditionnée aux attributions de la vue active : <strong>{ROLE_LABELS[currentRole]}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Rôles autorisés : {allowedRoles.length}</span>
          </div>
        </div>

        {!canCreateInCurrentRole ? (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-white">
                Création restreinte pour la vue {ROLE_LABELS[currentRole]}
              </p>
              <p className="mt-0.5">
                La vue métier active est en mode consultation. Pour inscrire ou affecter du personnel, veuillez basculer vers une vue administrative ou de direction (Administration, Direction générale, Scolarité, Caisse).
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAddDirect} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Nom du personnel */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nom complet du personnel *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dr. Martin Ondongo"
                    value={searchPerson}
                    onChange={(e) => setSearchPerson(e.target.value)}
                    className="w-full text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 pl-9 text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>

                {/* Suggestions */}
                {suggestedTeachers.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {suggestedTeachers.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => {
                          setSearchPerson(t.nom);
                          setSelectedPersonEmail(t.email);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 last:border-0 cursor-pointer"
                      >
                        <p className="font-semibold">{t.nom}</p>
                        <p className="text-slate-400 text-[11px]">{t.grade} · {t.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Rôle conditionné par vue métier */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fonction / Rôle conditionné *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as RoleType)}
                  className="w-full text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {allowedRoles.map((rk) => (
                    <option key={rk} value={rk}>
                      {ROLE_LABELS[rk]}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">
                  Limité aux attributions de la vue {ROLE_LABELS[currentRole]}
                </p>
              </div>

              {/* Mission attribuée */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mission fonctionnelle / Affectation
                </label>
                <input
                  type="text"
                  placeholder={ROLE_MISSIONS[selectedRole] || 'Ex: Responsable des cours L2...'}
                  value={customMission}
                  onChange={(e) => setCustomMission(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Le compte est inscrit directement dans Firestore avec le statut <strong>Approuvé</strong>.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>Inscrire le personnel</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: DEMANDES EN ATTENTE (VALIDATION PAR LE CHEF DE VUE MÉTIER)     */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <h3 className="font-bold text-slate-800 dark:text-white font-display">
              Demandes de compte en attente ({requests.length})
            </h3>
          </div>
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            À valider par le responsable de la vue métier
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Aucune demande de compte en attente de validation.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {requests.map((req) => {
              const currentDecision = requestDecisions[req.id] || {
                role: req.fonction,
                mission: req.msg || ROLE_MISSIONS[req.fonction] || '',
              };

              return (
                <div key={req.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-white text-sm">{req.nom}</span>
                      <span className="text-xs text-slate-400">· {req.email}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                        {req.date}
                      </span>
                    </div>
                    {req.msg && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                        « {req.msg} »
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={currentDecision.role}
                      onChange={(e) =>
                        setRequestDecisions({
                          ...requestDecisions,
                          [req.id]: {
                            ...currentDecision,
                            role: e.target.value as RoleType,
                          },
                        })
                      }
                      className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {(Object.keys(ROLE_LABELS) as RoleType[])
                        .filter((r) => r !== 'admin')
                        .map((rk) => (
                          <option key={rk} value={rk}>
                            {ROLE_LABELS[rk]}
                          </option>
                        ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Mission attribuée..."
                      value={currentDecision.mission}
                      onChange={(e) =>
                        setRequestDecisions({
                          ...requestDecisions,
                          [req.id]: {
                            ...currentDecision,
                            mission: e.target.value,
                          },
                        })
                      }
                      className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-64"
                    />

                    <button
                      onClick={() => handleApproveRequest(req)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Valider & Inscrire
                    </button>

                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Refuser
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: TABLEAU DU PERSONNEL INSCRIT & HABILITATIONS                  */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-800 dark:text-white font-display">
              Personnel inscrit et habilitations actives ({accounts.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Synchronisé avec Firestore (/users)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Personnel</th>
                <th className="px-6 py-3.5">Vue Métier</th>
                <th className="px-6 py-3.5">Mission attribuée</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900 dark:text-white">{acc.nom}</p>
                    {acc.email && (
                      <p className="text-xs text-slate-400">{acc.email}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {ROLE_LABELS[acc.role] || acc.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-sm">
                    {acc.mission || '—'}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                    {acc.dateCreated}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRemoveAccount(acc.id)}
                      title="Révoquer l'accès"
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
