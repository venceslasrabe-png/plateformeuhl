import React, { useState, useEffect } from 'react';
import { RoleType, Teacher } from '../types';
import { ROLE_LABELS } from '../constants/assets';
import { Users, UserPlus, Check, X, Shield, Trash2, Search, AlertCircle } from 'lucide-react';

interface ActiveAccount {
  id: string;
  nom: string;
  email?: string;
  role: RoleType;
  mission: string;
  dateCreated: string;
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
}

const DEFAULT_ACCOUNTS: ActiveAccount[] = [
  {
    id: 'usr-1',
    nom: 'Prof. Jean-Baptiste Taty',
    email: 'j.taty@universite-henrilopes.cg',
    role: 'direction',
    mission: 'Supervision générale et coordination des départements',
    dateCreated: '2026-09-01',
  },
  {
    id: 'usr-2',
    nom: 'Dr. Marcellin Mavoungou',
    email: 'm.mavoungou@universite-henrilopes.cg',
    role: 'scolarite',
    mission: 'Doyen des études, maquettes LMD et délibérations',
    dateCreated: '2026-09-05',
  },
  {
    id: 'usr-3',
    nom: 'Mme Clarisse Boukaka',
    email: 'c.boukaka@universite-henrilopes.cg',
    role: 'caisse',
    mission: 'Gestionnaire comptable et recouvrement des frais de scolarité',
    dateCreated: '2026-09-10',
  },
  {
    id: 'usr-4',
    nom: 'M. Gaston Ngoma',
    email: 'g.ngoma@universite-henrilopes.cg',
    role: 'surveillant',
    mission: 'Responsable guérite principale et badgeuse campus',
    dateCreated: '2026-09-15',
  },
  {
    id: 'usr-5',
    nom: 'Dr. Patrick Ntsoumou',
    email: 'p.ntsoumou@universite-henrilopes.cg',
    role: 'enseignant',
    mission: 'Responsable de la filière Génie Logiciel & Réseaux',
    dateCreated: '2026-09-20',
  },
  {
    id: 'usr-6',
    nom: 'Cabinet du Président',
    email: 'presidence@universite-henrilopes.cg',
    role: 'president',
    mission: 'Audit stratégique, consultation et rapports annuels',
    dateCreated: '2026-08-20',
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

export const UsersRolesView: React.FC<UsersRolesViewProps> = ({ teachers }) => {
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

  // Direct attribution form state
  const [searchPerson, setSearchPerson] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleType>('enseignant');
  const [customMission, setCustomMission] = useState('');
  const [selectedPersonEmail, setSelectedPersonEmail] = useState('');

  // Request decisions state (temporary modifications before approve)
  const [requestDecisions, setRequestDecisions] = useState<
    Record<string, { role: RoleType; mission: string }>
  >({});

  useEffect(() => {
    localStorage.setItem('uhl_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('uhl_account_requests', JSON.stringify(requests));
  }, [requests]);

  const handleApproveRequest = (req: AccountRequest) => {
    const decision = requestDecisions[req.id] || {
      role: req.fonction,
      mission: req.msg || 'Attribuée par l’administration',
    };

    const newAcc: ActiveAccount = {
      id: `usr-${Date.now()}`,
      nom: req.nom,
      email: req.email,
      role: decision.role,
      mission: decision.mission,
      dateCreated: new Date().toISOString().split('T')[0],
    };

    setAccounts([newAcc, ...accounts]);
    setRequests(requests.filter((r) => r.id !== req.id));
  };

  const handleRejectRequest = (id: string) => {
    setRequests(requests.filter((r) => r.id !== id));
  };

  const handleAddDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPerson.trim()) return;

    const newAcc: ActiveAccount = {
      id: `usr-${Date.now()}`,
      nom: searchPerson.trim(),
      email: selectedPersonEmail.trim() || undefined,
      role: selectedRole,
      mission: customMission.trim() || 'Mission académique standard',
      dateCreated: new Date().toISOString().split('T')[0],
    };

    setAccounts([newAcc, ...accounts]);
    setSearchPerson('');
    setSelectedPersonEmail('');
    setCustomMission('');
  };

  const handleRemoveAccount = (id: string) => {
    if (window.confirm('Voulez-vous révoquer l’accès de ce compte ?')) {
      setAccounts(accounts.filter((a) => a.id !== id));
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
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-display">
          Utilisateurs, Rôles & Accès
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Validation des demandes d'accès, gestion du contrôle d'accès et attribution des missions du personnel.
        </p>
      </div>

      {/* Info notice */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3 text-sm text-indigo-900">
        <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <p>
          <strong>Contrôle des privilèges :</strong> Les nouveaux comptes créés par les utilisateurs arrivent en attente de validation. L'administrateur choisit la fonction et spécifie la mission avant approbation. La Présidence dispose d’un accès d’audit en lecture seule garanti.
        </p>
      </div>

      {/* Demandes en attente */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <h3 className="font-bold text-slate-800 font-display">
              Demandes de compte en attente ({requests.length})
            </h3>
          </div>
          <span className="text-xs text-amber-700 font-medium">À valider par l’administration</span>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Aucune demande de compte en attente de validation.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((req) => {
              const currentDecision = requestDecisions[req.id] || {
                role: req.fonction,
                mission: req.msg || '',
              };

              return (
                <div key={req.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{req.nom}</span>
                      <span className="text-xs text-slate-400">· {req.email}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                        {req.date}
                      </span>
                    </div>
                    {req.msg && (
                      <p className="text-xs text-slate-600 italic">
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
                      className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                    />

                    <button
                      onClick={() => handleApproveRequest(req)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approuver
                    </button>

                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Rejeter
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attribuer un rôle directement */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 font-display">
            Attribuer un rôle ou une affectation directement
          </h3>
        </div>

        <form onSubmit={handleAddDirect} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nom complet de la personne *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ex: Dr. Martin Ondongo"
                  value={searchPerson}
                  onChange={(e) => setSearchPerson(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 pl-9 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>

              {/* Suggestions dropdown */}
              {suggestedTeachers.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {suggestedTeachers.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => {
                        setSearchPerson(t.nom);
                        setSelectedPersonEmail(t.email);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 text-slate-800 border-b border-slate-50 last:border-0 cursor-pointer"
                    >
                      <p className="font-semibold">{t.nom}</p>
                      <p className="text-slate-400 text-[11px]">{t.grade} · {t.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Fonction / Rôle *
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as RoleType)}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {(Object.keys(ROLE_LABELS) as RoleType[])
                  .filter((r) => r !== 'admin')
                  .map((rk) => (
                    <option key={rk} value={rk}>
                      {ROLE_LABELS[rk]}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Mission spécifique (optionnelle)
              </label>
              <input
                type="text"
                placeholder="Ex: Porte principale, surveillance L1"
                value={customMission}
                onChange={(e) => setCustomMission(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              Attribuer le rôle
            </button>
          </div>
        </form>
      </div>

      {/* Comptes actifs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 font-display">
              Comptes actifs et habilitations ({accounts.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Base de sécurité locale synchronisée
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Utilisateur</th>
                <th className="px-6 py-3.5">Fonction</th>
                <th className="px-6 py-3.5">Mission attribuée</th>
                <th className="px-6 py-3.5">Création</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{acc.nom}</p>
                    {acc.email && (
                      <p className="text-xs text-slate-400">{acc.email}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {ROLE_LABELS[acc.role] || acc.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 max-w-sm">
                    {acc.mission || '—'}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                    {acc.dateCreated}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRemoveAccount(acc.id)}
                      title="Révoquer l'accès"
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
