import React, { useState } from 'react';
import {
  Search,
  Plus,
  CreditCard,
  FileText,
  Edit2,
  Trash2,
  Camera,
  Upload,
  UserCheck,
  Check,
  X,
} from 'lucide-react';
import { AppData, Student } from '../types';
import { calcBalance, calcFee, calcPaid, formatFCFA, generateMatricule, uid } from '../services/storage';
import { downloadRegistrationFormPdf } from '../services/pdfGenerator';
import { StudentCardModal } from './StudentCardModal';

interface Props {
  data: AppData;
  onSaveData: (data: AppData) => void;
  onNotify: (msg: string) => void;
}

export const StudentsView: React.FC<Props> = ({ data, onSaveData, onNotify }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterParcours, setFilterParcours] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');

  // Form active tab
  const [formTab, setFormTab] = useState<'civil' | 'scolaire' | 'tuteurs' | 'finance'>('civil');

  // Form State
  const initialFormState: Omit<Student, 'id' | 'mat'> = {
    nom: '',
    prenom: '',
    naiss: '2005-01-01',
    lieu: 'Pointe-Noire',
    sexe: 'Masculin',
    nat: 'Congolaise',
    tel: '',
    bp: '',
    email: '',
    adr: '',
    ville: 'Pointe-Noire',
    photo: '',
    cyc: 'LN (licence normale)',
    annee: data.p.ann,
    parcours: data.parcours[0]?.id || '',
    fil: 'Informatique',
    niveau: 'L1',
    dnv: 'Terminale',
    ddip: 'Baccalauréat',
    dan: '2025',
    etab: 'Lycée Victor Augagneur',
    dossier: 'Oui',
    pere: '',
    telpere: '',
    fpere: '',
    mere: '',
    telmere: '',
    fmere: '',
    adrp: '',
    nfr: 1,
    nso: 1,
    tut: '',
    ttut: '',
    ftut: '',
    atut: '',
    ltut: 'Parent',
    modp: 'Mensuel',
    resp: '',
    dins: new Date().toISOString().slice(0, 10),
    ech: 50000,
    modr: 'Espèces',
    cout: 150000,
    typr: 'Inscription',
    stat: 'Normal',
  };

  const [formData, setFormData] = useState<Omit<Student, 'id' | 'mat'>>(initialFormState);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      ...initialFormState,
      annee: data.p.ann,
      parcours: data.parcours[0]?.id || '',
    });
    setFormTab('civil');
    setShowForm(true);
  };

  const handleEdit = (s: Student) => {
    setEditingId(s.id);
    setFormData({
      nom: s.nom,
      prenom: s.prenom,
      naiss: s.naiss,
      lieu: s.lieu,
      sexe: s.sexe,
      nat: s.nat,
      tel: s.tel,
      bp: s.bp,
      email: s.email,
      adr: s.adr,
      ville: s.ville,
      photo: s.photo || '',
      cyc: s.cyc,
      annee: s.annee,
      parcours: s.parcours,
      fil: s.fil,
      niveau: s.niveau,
      dnv: s.dnv,
      ddip: s.ddip,
      dan: s.dan,
      etab: s.etab,
      dossier: s.dossier,
      pere: s.pere,
      telpere: s.telpere,
      fpere: s.fpere,
      mere: s.mere,
      telmere: s.telmere,
      fmere: s.fmere,
      adrp: s.adrp,
      nfr: s.nfr,
      nso: s.nso,
      tut: s.tut,
      ttut: s.ttut,
      ftut: s.ftut,
      atut: s.atut,
      ltut: s.ltut,
      modp: s.modp,
      resp: s.resp,
      dins: s.dins,
      ech: s.ech,
      modr: s.modr,
      cout: s.cout,
      typr: s.typr,
      stat: s.stat,
    });
    setFormTab('civil');
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    const updatedStudents = data.students.filter((s) => s.id !== id);
    onSaveData({ ...data, students: updatedStudents });
    setDeleteConfirmId(null);
    onNotify('Étudiant retiré avec succès.');
  };

  // Photo Handler (Canvas resize to 180x225 portrait JPEG)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 180;
        canvas.height = 225;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const ratio = Math.max(180 / img.width, 225 / img.height);
          const w = img.width * ratio;
          const h = img.height * ratio;
          ctx.drawImage(img, (180 - w) / 2, (225 - h) / 2, w, h);
          const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setFormData((prev) => ({ ...prev, photo: croppedBase64 }));
          onNotify('Photo étudiante prête.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim() || !formData.prenom.trim()) {
      onNotify('Veuillez renseigner le nom et le prénom.');
      return;
    }

    if (editingId) {
      const updatedStudents = data.students.map((s) =>
        s.id === editingId ? { ...s, ...formData } : s
      );
      onSaveData({ ...data, students: updatedStudents });
      onNotify(`Dossier de ${formData.prenom} ${formData.nom} mis à jour.`);
    } else {
      const newId = uid();
      const newMat = generateMatricule(data);
      const newStudent: Student = {
        id: newId,
        mat: newMat,
        ...formData,
      };

      // Also create an announcement to notify the cashier
      const newAnn = {
        id: uid(),
        titre: 'Nouvelle inscription à encaisser',
        cible: 'Caisse' as const,
        etu: newId,
        msg: `${newStudent.nom} ${newStudent.prenom} (${newStudent.mat}) · ${newStudent.fil} · ${newStudent.niveau} : frais à encaisser ${formatFCFA(calcFee(newStudent, data))}.`,
        ts: Date.now(),
      };

      onSaveData({
        ...data,
        students: [newStudent, ...data.students],
        ann: [newAnn, ...data.ann],
      });
      onNotify(`Inscription enregistrée ! Matricule : ${newMat}`);
    }

    setShowForm(false);
  };

  // Filtered students
  const filteredStudents = data.students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      s.mat.toLowerCase().includes(q) ||
      s.nom.toLowerCase().includes(q) ||
      s.prenom.toLowerCase().includes(q) ||
      s.tel.includes(q);
    const matchParcours = !filterParcours || s.parcours === filterParcours;
    const matchNiveau = !filterNiveau || s.niveau === filterNiveau;
    return matchSearch && matchParcours && matchNiveau;
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white">
            Inscription et gestion des étudiants
          </h2>
          <p className="text-xs text-slate-500">
            {data.students.length} étudiant(s) inscrit(s) · Année académique {data.p.ann}
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f4c3a] text-white font-semibold text-xs hover:bg-[#0c3c2e] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Inscrire un étudiant
        </button>
      </div>

      {/* Registration Form Modal / Panel */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-700/60 rounded-2xl p-5 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Bricolage_Grotesque']">
                {editingId ? 'Modifier la fiche d’étudiant' : 'Fiche d’inscription administrative'}
              </h3>
              <p className="text-xs text-slate-500">
                L’enregistrement génère automatiquement le matricule et la carte PVC officielle.
              </p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Tabs */}
          <div className="flex flex-wrap gap-1 mb-5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFormTab('civil')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                formTab === 'civil'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              1. État Civil & Photo
            </button>
            <button
              type="button"
              onClick={() => setFormTab('scolaire')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                formTab === 'scolaire'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              2. Scolarité & Parcours LMD
            </button>
            <button
              type="button"
              onClick={() => setFormTab('tuteurs')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                formTab === 'tuteurs'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              3. Parents & Tuteurs
            </button>
            <button
              type="button"
              onClick={() => setFormTab('finance')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                formTab === 'finance'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              4. Inscription & Frais
            </button>
          </div>

          <form onSubmit={handleSaveStudent} className="space-y-4">
            {/* Tab 1: État Civil */}
            {formTab === 'civil' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Nom(s) de famille *
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-600"
                    placeholder="ex. MAVOUNGOU"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Prénom(s) *
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="ex. Clarisse Grâce"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Sexe
                  <select
                    value={formData.sexe}
                    onChange={(e) => setFormData({ ...formData, sexe: e.target.value as any })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Féminin">Féminin</option>
                    <option value="Masculin">Masculin</option>
                  </select>
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Date de naissance
                  <input
                    type="date"
                    value={formData.naiss}
                    onChange={(e) => setFormData({ ...formData, naiss: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Lieu de naissance
                  <input
                    type="text"
                    value={formData.lieu}
                    onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Pointe-Noire, Congo"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Nationalité
                  <input
                    type="text"
                    value={formData.nat}
                    onChange={(e) => setFormData({ ...formData, nat: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Téléphone
                  <input
                    type="tel"
                    value={formData.tel}
                    onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="+242 06 000 00 00"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Adresse e-mail
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="etudiant@domaine.cg"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Adresse de résidence & Ville
                  <input
                    type="text"
                    value={formData.adr}
                    onChange={(e) => setFormData({ ...formData, adr: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Quartier Mpita, Pointe-Noire"
                  />
                </label>

                {/* Photo Upload Box */}
                <div className="sm:col-span-2 lg:col-span-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 flex flex-wrap items-center gap-4">
                  <div className="w-16 h-20 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-300 shrink-0">
                    {formData.photo ? (
                      <img src={formData.photo} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Photo d'identité pour la carte PVC
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Sélectionnez un fichier ou prenez une photo depuis la caméra.
                    </p>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 inline-flex items-center gap-1.5 shadow-sm">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        Choisir une image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                      <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 inline-flex items-center gap-1.5 shadow-sm">
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        Prendre photo
                        <input
                          type="file"
                          accept="image/*"
                          capture="user"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Scolarité */}
            {formTab === 'scolaire' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Option / Parcours académique
                  <select
                    value={formData.parcours}
                    onChange={(e) => setFormData({ ...formData, parcours: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {data.parcours.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom} ({p.cycle})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Cycle de formation
                  <select
                    value={formData.cyc}
                    onChange={(e) => setFormData({ ...formData, cyc: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="LN (licence normale)">LN (licence normale)</option>
                    <option value="LP (licence professionnelle)">LP (licence professionnelle)</option>
                    <option value="Master">Master</option>
                    <option value="Doctorat">Doctorat</option>
                  </select>
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Niveau d'études LMD
                  <select
                    value={formData.niveau}
                    onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="L1">L1 (1ère année Licence)</option>
                    <option value="L2">L2 (2ème année Licence)</option>
                    <option value="L3">L3 (3ème année Licence)</option>
                    <option value="M1">M1 (1ère année Master)</option>
                    <option value="M2">M2 (2ème année Master)</option>
                    <option value="D1">D1 (Doctorat An 1)</option>
                    <option value="D2">D2 (Doctorat An 2)</option>
                    <option value="D3">D3 (Doctorat An 3)</option>
                  </select>
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Filière
                  <input
                    type="text"
                    value={formData.fil}
                    onChange={(e) => setFormData({ ...formData, fil: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Informatique, Droit, Économie..."
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Dernier diplôme obtenu
                  <input
                    type="text"
                    value={formData.ddip}
                    onChange={(e) => setFormData({ ...formData, ddip: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Baccalauréat C, D, A..."
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Établissement d’origine
                  <input
                    type="text"
                    value={formData.etab}
                    onChange={(e) => setFormData({ ...formData, etab: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Lycée ou université fréquenté"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Dossier physique complet ?
                  <select
                    value={formData.dossier}
                    onChange={(e) => setFormData({ ...formData, dossier: e.target.value as any })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Oui">Oui (Complet)</option>
                    <option value="Incomplet">Incomplet (Pièces manquantes)</option>
                    <option value="Non">Non</option>
                  </select>
                </label>
              </div>
            )}

            {/* Tab 3: Tuteurs */}
            {formTab === 'tuteurs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Nom du père
                  <input
                    type="text"
                    value={formData.pere}
                    onChange={(e) => setFormData({ ...formData, pere: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Téléphone du père
                  <input
                    type="tel"
                    value={formData.telpere}
                    onChange={(e) => setFormData({ ...formData, telpere: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Fonction du père
                  <input
                    type="text"
                    value={formData.fpere}
                    onChange={(e) => setFormData({ ...formData, fpere: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Nom de la mère
                  <input
                    type="text"
                    value={formData.mere}
                    onChange={(e) => setFormData({ ...formData, mere: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Téléphone de la mère
                  <input
                    type="tel"
                    value={formData.telmere}
                    onChange={(e) => setFormData({ ...formData, telmere: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Tuteur / Tutrice
                  <input
                    type="text"
                    value={formData.tut}
                    onChange={(e) => setFormData({ ...formData, tut: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Téléphone du tuteur
                  <input
                    type="tel"
                    value={formData.ttut}
                    onChange={(e) => setFormData({ ...formData, ttut: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Lien de parenté
                  <input
                    type="text"
                    value={formData.ltut}
                    onChange={(e) => setFormData({ ...formData, ltut: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Père, Mère, Oncle, Frère..."
                  />
                </label>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Modalité de paiement des cours
                  <select
                    value={formData.modp}
                    onChange={(e) => setFormData({ ...formData, modp: e.target.value as any })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Mensuel">Mensuel</option>
                    <option value="Semestriel">Semestriel</option>
                    <option value="Annuel">Annuel</option>
                  </select>
                </label>
              </div>
            )}

            {/* Tab 4: Finances */}
            {formTab === 'finance' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Responsable financier (qui paie)
                  <input
                    type="text"
                    value={formData.resp}
                    onChange={(e) => setFormData({ ...formData, resp: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Nom du payeur"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Coût de formation annuel (FCFA)
                  <input
                    type="number"
                    value={formData.cout}
                    onChange={(e) => setFormData({ ...formData, cout: Number(e.target.value) })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Montant de l'échéance initiale (FCFA)
                  <input
                    type="number"
                    value={formData.ech}
                    onChange={(e) => setFormData({ ...formData, ech: Number(e.target.value) })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Mode de règlement
                  <select
                    value={formData.modr}
                    onChange={(e) => setFormData({ ...formData, modr: e.target.value as any })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Espèces">Espèces (Guichet Caisse)</option>
                    <option value="Mobile money">Mobile money (MTN / Airtel)</option>
                    <option value="Virement">Virement bancaire</option>
                    <option value="Chèque">Chèque certifié</option>
                  </select>
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Type de règlement
                  <select
                    value={formData.typr}
                    onChange={(e) => setFormData({ ...formData, typr: e.target.value as any })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Inscription">Inscription (Nouveau)</option>
                    <option value="Réinscription">Réinscription</option>
                    <option value="Normal">Normal</option>
                  </select>
                </label>

                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Statut de l'étudiant
                  <select
                    value={formData.stat}
                    onChange={(e) => setFormData({ ...formData, stat: e.target.value as any })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Boursier">Boursier de l'État</option>
                    <option value="Réduction">Bénéficiaire d'une réduction</option>
                  </select>
                </label>
              </div>
            )}

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-[#0f4c3a] hover:bg-[#0c3c2e] rounded-lg transition-colors shadow-sm"
              >
                {editingId ? 'Mettre à jour' : 'Enregistrer l’étudiant'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par matricule, nom, prénom, téléphone..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterParcours}
            onChange={(e) => setFilterParcours(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="">Tous les parcours</option>
            {data.parcours.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>

          <select
            value={filterNiveau}
            onChange={(e) => setFilterNiveau(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="">Tous niveaux</option>
            <option value="L1">L1</option>
            <option value="L2">L2</option>
            <option value="L3">L3</option>
            <option value="M1">M1</option>
            <option value="M2">M2</option>
            <option value="D1">D1</option>
            <option value="D2">D2</option>
            <option value="D3">D3</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-3">Photo</th>
                <th className="py-3 px-3">Matricule</th>
                <th className="py-3 px-3">Nom(s) & Prénom(s)</th>
                <th className="py-3 px-3">Option / Parcours</th>
                <th className="py-3 px-3">Niveau</th>
                <th className="py-3 px-3">Scolarité</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun étudiant ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const p = data.parcours.find((item) => item.id === s.parcours);
                  const bal = calcBalance(s, data);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3">
                        <div className="w-8 h-10 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-500 border border-slate-200 dark:border-slate-700 shrink-0">
                          {s.photo ? (
                            <img src={s.photo} alt={s.nom} className="w-full h-full object-cover" />
                          ) : (
                            <span>{s.prenom[0] + s.nom[0]}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        {s.mat}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                        {s.nom} {s.prenom}
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {s.tel || s.email || 'Pas de contact'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="truncate block max-w-[170px]" title={p?.nom || ''}>
                          {p?.nom || '—'}
                        </span>
                        <span className="text-[10px] text-slate-400">{s.fil}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {s.niveau}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-semibold text-[10px] ${
                            bal <= 0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {bal <= 0 ? 'Soldé' : `Reste : ${formatFCFA(bal)}`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudentForCard(s)}
                            title="Carte d'étudiant PVC"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => downloadRegistrationFormPdf(s, data)}
                            title="Télécharger la fiche d'inscription PDF"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(s)}
                            title="Modifier"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {deleteConfirmId === s.id ? (
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold"
                            >
                              Confirmer ?
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(s.id)}
                              title="Supprimer"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PVC Card Modal */}
      {selectedStudentForCard && (
        <StudentCardModal
          student={selectedStudentForCard}
          data={data}
          onClose={() => setSelectedStudentForCard(null)}
        />
      )}
    </div>
  );
};
