import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  GraduationCap,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  School,
  Tag,
  Building2,
  Users,
  Search,
  CheckCircle,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';
import {
  AppData,
  Cycle,
  EC,
  Filiere,
  OptionItem,
  NiveauItem,
  ClasseItem,
  Parcours,
  Semester,
  TimetableEntry,
  UE,
} from '../types';
import { uid } from '../services/storage';
import { exportAcademicExcel } from '../services/excelExporter';

interface Props {
  data: AppData;
  onSaveData: (data: AppData) => void;
  onNotify: (msg: string) => void;
}

type TabType = 'filieres' | 'options' | 'niveaux' | 'classes' | 'ue' | 'ec' | 'edt';

export const AcademicView: React.FC<Props> = ({ data, onSaveData, onNotify }) => {
  const [activeTab, setActiveTab] = useState<TabType>('filieres');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Edit states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedClassForRoster, setSelectedClassForRoster] = useState<ClasseItem | null>(null);

  // Form states
  const [filiereForm, setFiliereForm] = useState<Omit<Filiere, 'id'>>({
    code: '',
    nom: '',
    domaine: 'Sciences et Technologies',
    chefDept: '',
    description: '',
  });

  const [optionForm, setOptionForm] = useState<Omit<OptionItem, 'id'>>({
    code: '',
    nom: '',
    filiereId: data.filieres?.[0]?.id || 'fil-info',
    cycle: 'Licence',
    description: '',
  });

  const [niveauForm, setNiveauForm] = useState<Omit<NiveauItem, 'id'>>({
    code: 'L1',
    intitule: 'Licence 1ère Année (S1 - S2)',
    cycle: 'Licence',
    ordre: 1,
    creditsRequis: 60,
  });

  const [classeForm, setClasseForm] = useState<Omit<ClasseItem, 'id'>>({
    code: '',
    nom: '',
    filiereId: data.filieres?.[0]?.id || 'fil-info',
    optionId: data.options?.[0]?.id || data.parcours?.[0]?.id || '',
    niveau: 'L1',
    salle: 'Amphithéâtre Nelson Mandela',
    delegue: '',
    capacite: 50,
  });

  const [ueForm, setUeForm] = useState<Omit<UE, 'id'>>({
    code: '',
    nom: '',
    parcours: data.parcours[0]?.id || '',
    sem: 'S1',
    cred: 6,
  });

  const [ecForm, setEcForm] = useState<Omit<EC, 'id'>>({
    code: '',
    nom: '',
    ue: data.ue[0]?.id || '',
    coef: 2,
    vh: 30,
    ens: data.teachers[0]?.id || '',
  });

  const [edtForm, setEdtForm] = useState<Omit<TimetableEntry, 'id'>>({
    jour: 'Lundi',
    debut: '08:00',
    fin: '10:00',
    ec: data.ec[0]?.id || '',
    salle: 'Amphithéâtre Nelson Mandela',
  });

  // Open Add modal with default fields
  const handleOpenAdd = () => {
    setEditingId(null);
    if (activeTab === 'filieres') {
      setFiliereForm({
        code: '',
        nom: '',
        domaine: 'Sciences et Technologies',
        chefDept: '',
        description: '',
      });
    } else if (activeTab === 'options') {
      setOptionForm({
        code: '',
        nom: '',
        filiereId: data.filieres?.[0]?.id || 'fil-info',
        cycle: 'Licence',
        description: '',
      });
    } else if (activeTab === 'niveaux') {
      setNiveauForm({
        code: 'L1',
        intitule: 'Licence 1ère Année (S1 - S2)',
        cycle: 'Licence',
        ordre: (data.niveaux?.length || 0) + 1,
        creditsRequis: 60,
      });
    } else if (activeTab === 'classes') {
      setClasseForm({
        code: '',
        nom: '',
        filiereId: data.filieres?.[0]?.id || 'fil-info',
        optionId: data.options?.[0]?.id || data.parcours?.[0]?.id || '',
        niveau: 'L1',
        salle: 'Amphithéâtre Nelson Mandela',
        delegue: '',
        capacite: 50,
      });
    } else if (activeTab === 'ue') {
      setUeForm({
        code: '',
        nom: '',
        parcours: data.parcours[0]?.id || '',
        sem: 'S1',
        cred: 6,
      });
    } else if (activeTab === 'ec') {
      setEcForm({
        code: '',
        nom: '',
        ue: data.ue[0]?.id || '',
        coef: 2,
        vh: 30,
        ens: data.teachers[0]?.id || '',
      });
    } else if (activeTab === 'edt') {
      setEdtForm({
        jour: 'Lundi',
        debut: '08:00',
        fin: '10:00',
        ec: data.ec[0]?.id || '',
        salle: 'Amphithéâtre Nelson Mandela',
      });
    }
    setShowAddModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    if (activeTab === 'filieres') {
      setFiliereForm({
        code: item.code || '',
        nom: item.nom || '',
        domaine: item.domaine || '',
        chefDept: item.chefDept || '',
        description: item.description || '',
      });
    } else if (activeTab === 'options') {
      setOptionForm({
        code: item.code || '',
        nom: item.nom || '',
        filiereId: item.filiereId || '',
        cycle: item.cycle || 'Licence',
        description: item.description || '',
      });
    } else if (activeTab === 'niveaux') {
      setNiveauForm({
        code: item.code || '',
        intitule: item.intitule || '',
        cycle: item.cycle || 'Licence',
        ordre: item.ordre || 1,
        creditsRequis: item.creditsRequis || 60,
      });
    } else if (activeTab === 'classes') {
      setClasseForm({
        code: item.code || '',
        nom: item.nom || '',
        filiereId: item.filiereId || '',
        optionId: item.optionId || '',
        niveau: item.niveau || 'L1',
        salle: item.salle || '',
        delegue: item.delegue || '',
        capacite: item.capacite || 50,
      });
    } else if (activeTab === 'ue') {
      setUeForm({
        code: item.code || '',
        nom: item.nom || '',
        parcours: item.parcours || '',
        sem: item.sem || 'S1',
        cred: item.cred || 6,
      });
    } else if (activeTab === 'ec') {
      setEcForm({
        code: item.code || '',
        nom: item.nom || '',
        ue: item.ue || '',
        coef: item.coef || 2,
        vh: item.vh || 30,
        ens: item.ens || '',
      });
    } else if (activeTab === 'edt') {
      setEdtForm({
        jour: item.jour || 'Lundi',
        debut: item.debut || '08:00',
        fin: item.fin || '10:00',
        ec: item.ec || '',
        salle: item.salle || '',
      });
    }
    setShowAddModal(true);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'filieres') {
      if (!filiereForm.nom.trim() || !filiereForm.code.trim()) return;
      if (editingId) {
        const updated = (data.filieres || []).map((f) =>
          f.id === editingId ? { ...f, ...filiereForm } : f
        );
        onSaveData({ ...data, filieres: updated });
        onNotify('Filière mise à jour.');
      } else {
        const newF: Filiere = { id: `fil-${uid()}`, ...filiereForm };
        onSaveData({ ...data, filieres: [...(data.filieres || []), newF] });
        onNotify('Nouvelle filière créée avec succès.');
      }
    } else if (activeTab === 'options') {
      if (!optionForm.nom.trim() || !optionForm.code.trim()) return;
      if (editingId) {
        const updatedOpts = (data.options || []).map((o) =>
          o.id === editingId ? { ...o, ...optionForm } : o
        );
        // Also sync data.parcours
        const updatedParcours = data.parcours.map((p) =>
          p.id === editingId ? { ...p, nom: optionForm.nom, cycle: optionForm.cycle } : p
        );
        onSaveData({ ...data, options: updatedOpts, parcours: updatedParcours });
        onNotify('Option mise à jour.');
      } else {
        const newId = `opt-${uid()}`;
        const newOpt: OptionItem = { id: newId, ...optionForm };
        const filiere = (data.filieres || []).find((f) => f.id === optionForm.filiereId);
        const newP: Parcours = {
          id: newId,
          nom: optionForm.nom,
          dom: filiere?.domaine || 'Sciences et Technologies',
          cycle: optionForm.cycle,
        };
        onSaveData({
          ...data,
          options: [...(data.options || []), newOpt],
          parcours: [...data.parcours, newP],
        });
        onNotify('Nouvelle option de spécialité créée.');
      }
    } else if (activeTab === 'niveaux') {
      if (!niveauForm.code.trim() || !niveauForm.intitule.trim()) return;
      if (editingId) {
        const updated = (data.niveaux || []).map((n) =>
          n.id === editingId ? { ...n, ...niveauForm } : n
        );
        onSaveData({ ...data, niveaux: updated });
        onNotify('Niveau LMD mis à jour.');
      } else {
        const newN: NiveauItem = { id: `niv-${uid()}`, ...niveauForm };
        onSaveData({ ...data, niveaux: [...(data.niveaux || []), newN] });
        onNotify('Nouveau niveau LMD ajouté.');
      }
    } else if (activeTab === 'classes') {
      if (!classeForm.code.trim() || !classeForm.nom.trim()) return;
      if (editingId) {
        const updated = (data.classes || []).map((c) =>
          c.id === editingId ? { ...c, ...classeForm } : c
        );
        onSaveData({ ...data, classes: updated });
        onNotify('Classe modifiée.');
      } else {
        const newC: ClasseItem = { id: `cls-${uid()}`, ...classeForm };
        onSaveData({ ...data, classes: [...(data.classes || []), newC] });
        onNotify('Nouvelle classe créée.');
      }
    } else if (activeTab === 'ue') {
      if (!ueForm.nom.trim() || !ueForm.code.trim()) return;
      if (editingId) {
        const updated = data.ue.map((u) => (u.id === editingId ? { ...u, ...ueForm } : u));
        onSaveData({ ...data, ue: updated });
        onNotify('UE modifiée.');
      } else {
        const newUe: UE = { id: uid(), ...ueForm };
        onSaveData({ ...data, ue: [...data.ue, newUe] });
        onNotify('Nouvelle UE créée.');
      }
    } else if (activeTab === 'ec') {
      if (!ecForm.nom.trim() || !ecForm.code.trim()) return;
      if (editingId) {
        const updated = data.ec.map((e) => (e.id === editingId ? { ...e, ...ecForm } : e));
        onSaveData({ ...data, ec: updated });
        onNotify('Matière modifiée.');
      } else {
        const newEc: EC = { id: uid(), ...ecForm };
        onSaveData({ ...data, ec: [...data.ec, newEc] });
        onNotify('Nouvelle matière créée.');
      }
    } else if (activeTab === 'edt') {
      if (editingId) {
        const updated = data.edt.map((item) =>
          item.id === editingId ? { ...item, ...edtForm } : item
        );
        onSaveData({ ...data, edt: updated });
        onNotify('Séance d’emploi du temps modifiée.');
      } else {
        const newEdt: TimetableEntry = { id: uid(), ...edtForm };
        onSaveData({ ...data, edt: [...data.edt, newEdt] });
        onNotify('Créneau de cours ajouté.');
      }
    }

    setShowAddModal(false);
  };

  // Delete Handler
  const handleDeleteItem = (id: string) => {
    if (activeTab === 'filieres') {
      onSaveData({
        ...data,
        filieres: (data.filieres || []).filter((f) => f.id !== id),
      });
    } else if (activeTab === 'options') {
      onSaveData({
        ...data,
        options: (data.options || []).filter((o) => o.id !== id),
        parcours: data.parcours.filter((p) => p.id !== id),
      });
    } else if (activeTab === 'niveaux') {
      onSaveData({
        ...data,
        niveaux: (data.niveaux || []).filter((n) => n.id !== id),
      });
    } else if (activeTab === 'classes') {
      onSaveData({
        ...data,
        classes: (data.classes || []).filter((c) => c.id !== id),
      });
    } else if (activeTab === 'ue') {
      onSaveData({ ...data, ue: data.ue.filter((u) => u.id !== id) });
    } else if (activeTab === 'ec') {
      onSaveData({ ...data, ec: data.ec.filter((e) => e.id !== id) });
    } else if (activeTab === 'edt') {
      onSaveData({ ...data, edt: data.edt.filter((e) => e.id !== id) });
    }
    onNotify('Élément supprimé avec succès.');
  };

  const daysList: Array<TimetableEntry['jour']> = [
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
  ];

  // Helper functions for student counts
  const getFiliereStudentCount = (f: Filiere) => {
    return data.students.filter(
      (s) =>
        s.fil === f.nom ||
        s.fil === f.code ||
        data.parcours.find((p) => p.id === s.parcours)?.dom === f.domaine
    ).length;
  };

  const getOptionStudentCount = (o: OptionItem) => {
    return data.students.filter((s) => s.parcours === o.id || s.fil === o.nom).length;
  };

  const getNiveauStudentCount = (n: NiveauItem) => {
    return data.students.filter((s) => s.niveau === n.code).length;
  };

  const getClasseStudents = (c: ClasseItem) => {
    const f = (data.filieres || []).find((x) => x.id === c.filiereId || x.code === c.filiereId);
    return data.students.filter((s) => {
      if (s.classe === c.code || s.classe === c.id) return true;
      if (s.niveau === c.niveau) {
        if (c.optionId && s.parcours === c.optionId) return true;
        if (f && s.fil === f.nom) return true;
      }
      return false;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold mb-2">
            <School className="w-3.5 h-3.5 text-emerald-600" />
            <span>Architecture LMD · Université Henri Lopes (UHL)</span>
          </div>
          <h2 className="text-xl font-extrabold font-['Bricolage_Grotesque'] text-slate-900 dark:text-white tracking-tight">
            Structure Académique & Maquettes de Formation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organisation hiérarchique : Filières, Options, Niveaux, Classes, Unités d’Enseignement, Matières et Emploi du Temps
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportAcademicExcel(data)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exporter maquette Excel</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0f4c3a] text-white text-xs font-bold hover:bg-[#0c3c2e] transition-colors shadow-sm shadow-emerald-950/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === 'filieres' && 'Nouvelle Filière'}
              {activeTab === 'options' && 'Nouvelle Option'}
              {activeTab === 'niveaux' && 'Nouveau Niveau'}
              {activeTab === 'classes' && 'Nouvelle Classe'}
              {activeTab === 'ue' && 'Nouvelle UE'}
              {activeTab === 'ec' && 'Nouvelle Matière'}
              {activeTab === 'edt' && 'Nouveau Créneau'}
            </span>
          </button>
        </div>
      </div>

      {/* Primary Academic Structure Navigation Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-semibold overflow-x-auto border border-slate-200/80 dark:border-slate-700/80">
        {/* 1. Filières */}
        <button
          onClick={() => setActiveTab('filieres')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'filieres'
              ? 'bg-[#0f4c3a] text-white font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-300" />
          <span>1. Filières ({data.filieres?.length || 0})</span>
        </button>

        {/* 2. Options */}
        <button
          onClick={() => setActiveTab('options')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'options'
              ? 'bg-[#0f4c3a] text-white font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-amber-300" />
          <span>2. Options ({data.options?.length || data.parcours.length})</span>
        </button>

        {/* 3. Niveaux */}
        <button
          onClick={() => setActiveTab('niveaux')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'niveaux'
              ? 'bg-[#0f4c3a] text-white font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-300" />
          <span>3. Niveaux ({data.niveaux?.length || 0})</span>
        </button>

        {/* 4. Classes */}
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-[#0f4c3a] text-white font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <Users className="w-4 h-4 text-amber-300" />
          <span>4. Classes ({data.classes?.length || 0})</span>
        </button>

        {/* 5. UE */}
        <button
          onClick={() => setActiveTab('ue')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'ue'
              ? 'bg-[#0f4c3a] text-white font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <Tag className="w-4 h-4 text-amber-300" />
          <span>5. UE ({data.ue.length})</span>
        </button>

        {/* 6. Matières (EC) */}
        <button
          onClick={() => setActiveTab('ec')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'ec'
              ? 'bg-[#0f4c3a] text-white font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-300" />
          <span>6. Matières EC ({data.ec.length})</span>
        </button>

        {/* 7. Emploi du Temps */}
        <button
          onClick={() => setActiveTab('edt')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'edt'
              ? 'bg-[#0f4c3a] text-white font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-300" />
          <span>7. Emploi du Temps ({data.edt.length})</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: FILIÈRES                                                      */}
      {/* ==================================================================== */}
      {activeTab === 'filieres' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Départements & Pôles de Formation (Filières de l’Université)
              </span>
              <span className="text-xs text-slate-500">
                {(data.filieres || []).length} filière(s) enregistrée(s)
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Intitulé de la Filière</th>
                  <th className="py-3 px-4">Domaine académique</th>
                  <th className="py-3 px-4">Chef de Département</th>
                  <th className="py-3 px-4 text-center">Options</th>
                  <th className="py-3 px-4 text-center">Étudiants</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data.filieres || []).map((f) => {
                  const studentCount = getFiliereStudentCount(f);
                  const optionCount = (data.options || []).filter((o) => o.filiereId === f.id || o.filiereId === f.code).length;

                  return (
                    <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md font-mono font-bold text-xs bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {f.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="font-semibold text-slate-900 dark:text-white">{f.nom}</div>
                        {f.description && (
                          <p className="text-[11px] text-slate-400 font-normal line-clamp-1 mt-0.5">
                            {f.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {f.domaine}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {f.chefDept || 'Non assigné'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {optionCount} option(s)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-700 dark:text-emerald-400">
                        {studentCount} étudiant(s)
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(f)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(f.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: OPTIONS (SPÉCIALITÉS LMD)                                     */}
      {/* ==================================================================== */}
      {activeTab === 'options' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Options de Spécialité & Parcours de Formation
              </span>
              <span className="text-xs text-slate-500">
                {(data.options || []).length} option(s) active(s)
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Intitulé de l’Option</th>
                  <th className="py-3 px-4">Filière de rattachement</th>
                  <th className="py-3 px-4">Cycle</th>
                  <th className="py-3 px-4 text-center">UEs rattachées</th>
                  <th className="py-3 px-4 text-center">Effectif</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data.options || []).map((o) => {
                  const filiere = (data.filieres || []).find((f) => f.id === o.filiereId || f.code === o.filiereId);
                  const ueCount = data.ue.filter((u) => u.parcours === o.id).length;
                  const studentCount = getOptionStudentCount(o);

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md font-mono font-bold text-xs bg-indigo-50 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {o.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <div>{o.nom}</div>
                        {o.description && (
                          <p className="text-[11px] text-slate-400 font-normal line-clamp-1 mt-0.5">
                            {o.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {filiere?.nom || o.filiereId}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                            o.cycle === 'Licence'
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : o.cycle === 'Master'
                              ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          }`}
                        >
                          {o.cycle}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-600 dark:text-slate-300">
                        {ueCount} UE(s)
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-700 dark:text-emerald-400">
                        {studentCount} étudiant(s)
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(o)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(o.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: NIVEAUX (PALIERS LMD)                                         */}
      {/* ==================================================================== */}
      {activeTab === 'niveaux' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Paliers d’Études LMD & Crédits Requis
              </span>
              <span className="text-xs text-slate-500">
                {(data.niveaux || []).length} niveau(x) configuré(s)
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Code Niveau</th>
                  <th className="py-3 px-4">Intitulé Officiel</th>
                  <th className="py-3 px-4">Cycle</th>
                  <th className="py-3 px-4">Crédits ECTS Requis</th>
                  <th className="py-3 px-4 text-center">Ordre</th>
                  <th className="py-3 px-4 text-center">Effectif Inscrit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data.niveaux || []).map((n) => {
                  const studentCount = getNiveauStudentCount(n);
                  return (
                    <tr key={n.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800">
                          {n.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {n.intitule}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full font-semibold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {n.cycle}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {n.creditsRequis} ECTS
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-500">
                        {n.ordre}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-700 dark:text-emerald-400">
                        {studentCount} étudiant(s)
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(n)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(n.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: CLASSES & PROMOTIONS                                          */}
      {/* ==================================================================== */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Classes, Promotions & Groupes d’Étudiants
              </span>
              <span className="text-xs text-slate-500">
                {(data.classes || []).length} classe(s) créée(s)
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Intitulé de la Promotion</th>
                  <th className="py-3 px-4">Niveau</th>
                  <th className="py-3 px-4">Filière / Option</th>
                  <th className="py-3 px-4">Salle Principale</th>
                  <th className="py-3 px-4">Délégué(e)</th>
                  <th className="py-3 px-4 text-center">Effectif / Capacité</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data.classes || []).map((c) => {
                  const f = (data.filieres || []).find((x) => x.id === c.filiereId || x.code === c.filiereId);
                  const o = (data.options || []).find((x) => x.id === c.optionId || x.code === c.optionId);
                  const students = getClasseStudents(c);
                  const count = students.length;
                  const cap = c.capacite || 50;
                  const ratio = Math.min(100, Math.round((count / cap) * 100));

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-emerald-800 dark:text-emerald-300">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800">
                          {c.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {c.nom}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {c.niveau}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {f?.nom || c.filiereId}
                        </div>
                        {o && (
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                            {o.nom}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {c.salle || 'Non définie'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {c.delegue || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">
                            {count} / {cap} ({ratio}%)
                          </span>
                          <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                ratio >= 100 ? 'bg-rose-500' : ratio >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedClassForRoster(c)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Voir les étudiants inscrits"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(c.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: UNITÉS D'ENSEIGNEMENT (UE)                                    */}
      {/* ==================================================================== */}
      {activeTab === 'ue' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Unités d’Enseignement (Maquettes LMD)
            </span>
            <span className="text-xs text-slate-500">{data.ue.length} UE(s) enregistrée(s)</span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-3 px-4">Code UE</th>
                <th className="py-3 px-4">Intitulé de l’UE</th>
                <th className="py-3 px-4">Parcours / Option</th>
                <th className="py-3 px-4">Semestre</th>
                <th className="py-3 px-4">Crédits (ECTS)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.ue.map((u) => {
                const p = data.parcours.find((item) => item.id === u.parcours);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {u.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {u.nom}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{p?.nom || '—'}</td>
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                      {u.sem}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {u.cred} ECTS
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(u.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: MATIÈRES (EC)                                                 */}
      {/* ==================================================================== */}
      {activeTab === 'ec' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Matières & Éléments Constitutifs (EC)
            </span>
            <span className="text-xs text-slate-500">{data.ec.length} matière(s) au programme</span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-3 px-4">Code EC</th>
                <th className="py-3 px-4">Intitulé de la Matière</th>
                <th className="py-3 px-4">UE de Rattachement</th>
                <th className="py-3 px-4">Coefficient</th>
                <th className="py-3 px-4">Volume Horaire</th>
                <th className="py-3 px-4">Enseignant</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.ec.map((e) => {
                const u = data.ue.find((item) => item.id === e.ue);
                const t = data.teachers.find((item) => item.id === e.ens);
                return (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {e.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {e.nom}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{u?.nom || '—'}</td>
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                      {e.coef}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {e.vh} h
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                      {t?.nom || 'Non assigné'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(e)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(e.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 7: EMPLOI DU TEMPS                                               */}
      {/* ==================================================================== */}
      {activeTab === 'edt' && (
        <div className="space-y-6">
          {/* Weekly Schedule Visual Matrix */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
              Planning Hebdomadaire — Semaine Type
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Visualisation des cours programmés par jour et créneau horaire
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              {daysList.map((day) => {
                const daySessions = data.edt
                  .filter((item) => item.jour === day)
                  .sort((a, b) => a.debut.localeCompare(b.debut));
                return (
                  <div
                    key={day}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3 flex flex-col"
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700 mb-2">
                      {day}
                    </div>

                    <div className="space-y-2 flex-1">
                      {daySessions.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic block py-4 text-center">
                          Aucun cours
                        </span>
                      ) : (
                        daySessions.map((session) => {
                          const ec = data.ec.find((x) => x.id === session.ec);
                          const t = ec ? data.teachers.find((item) => item.id === ec.ens) : null;
                          return (
                            <div
                              key={session.id}
                              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                                <span>
                                  {session.debut} - {session.fin}
                                </span>
                              </div>
                              <b className="block text-slate-900 dark:text-white leading-tight">
                                {ec?.nom || 'Matière'}
                              </b>
                              <div className="text-[10px] text-slate-500">
                                <span>{session.salle}</span>
                                {t && <span> · {t.nom}</span>}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* List Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Jour</th>
                  <th className="py-3 px-4">Créneau horaire</th>
                  <th className="py-3 px-4">Matière</th>
                  <th className="py-3 px-4">Salle</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.edt.map((item) => {
                  const ec = data.ec.find((x) => x.id === item.ec);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {item.jour}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        {item.debut} - {item.fin}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {ec?.nom || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{item.salle}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ROSTER DES ÉTUDIANTS D'UNE CLASSE                             */}
      {/* ==================================================================== */}
      {selectedClassForRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  {selectedClassForRoster.code}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {selectedClassForRoster.nom}
                </h3>
                <p className="text-xs text-slate-500">
                  Niveau {selectedClassForRoster.niveau} · Salle : {selectedClassForRoster.salle || 'Non assignée'}
                </p>
              </div>
              <button
                onClick={() => setSelectedClassForRoster(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
              {getClasseStudents(selectedClassForRoster).length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  Aucun étudiant n'est encore affecté à cette classe.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {getClasseStudents(selectedClassForRoster).map((s, idx) => (
                    <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}.
                        </span>
                        <div>
                          <b className="text-slate-900 dark:text-white uppercase">
                            {s.nom} {s.prenom}
                          </b>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {s.mat} · Tél : {s.tel}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                        {s.stat}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedClassForRoster(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: AJOUTER / MODIFIER UN ÉLÉMENT                                 */}
      {/* ==================================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 font-['Bricolage_Grotesque']">
              {editingId ? 'Modifier' : 'Ajouter'} :{' '}
              {activeTab === 'filieres' && 'Filière académique'}
              {activeTab === 'options' && 'Option / Spécialité'}
              {activeTab === 'niveaux' && 'Niveau d’études LMD'}
              {activeTab === 'classes' && 'Classe / Promotion'}
              {activeTab === 'ue' && 'Unité d’Enseignement (UE)'}
              {activeTab === 'ec' && 'Matière (Élément Constitutif)'}
              {activeTab === 'edt' && 'Créneau d’Emploi du Temps'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form 1: Filière */}
              {activeTab === 'filieres' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 col-span-1">
                      Code *
                      <input
                        type="text"
                        required
                        value={filiereForm.code}
                        onChange={(e) => setFiliereForm({ ...filiereForm, code: e.target.value.toUpperCase() })}
                        placeholder="ex. INFO"
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </label>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 col-span-2">
                      Intitulé de la Filière *
                      <input
                        type="text"
                        required
                        value={filiereForm.nom}
                        onChange={(e) => setFiliereForm({ ...filiereForm, nom: e.target.value })}
                        placeholder="ex. Informatique & Sciences Numériques"
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                  </div>

                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Domaine académique *
                    <input
                      type="text"
                      required
                      value={filiereForm.domaine}
                      onChange={(e) => setFiliereForm({ ...filiereForm, domaine: e.target.value })}
                      placeholder="ex. Sciences et Technologies"
                      className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </label>

                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Chef de Département / Responsable pédagogique
                    <input
                      type="text"
                      value={filiereForm.chefDept}
                      onChange={(e) => setFiliereForm({ ...filiereForm, chefDept: e.target.value })}
                      placeholder="ex. Prof. Jean-Claude Mavoungou"
                      className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </label>

                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Description & Objectifs
                    <textarea
                      rows={2}
                      value={filiereForm.description}
                      onChange={(e) => setFiliereForm({ ...filiereForm, description: e.target.value })}
                      placeholder="Débouchés, compétences visées..."
                      className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </label>
                </>
              )}

              {/* Form 2: Option */}
              {activeTab === 'options' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 col-span-1">
                      Code *
                      <input
                        type="text"
                        required
                        value={optionForm.code}
                        onChange={(e) => setOptionForm({ ...optionForm, code: e.target.value.toUpperCase() })}
                        placeholder="ex. IGR"
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </label>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 col-span-2">
                      Intitulé de l’Option *
                      <input
                        type="text"
                        required
                        value={optionForm.nom}
                        onChange={(e) => setOptionForm({ ...optionForm, nom: e.target.value })}
                        placeholder="ex. Informatique de Gestion & Réseaux"
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Filière de rattachement *
                      <select
                        value={optionForm.filiereId}
                        onChange={(e) => setOptionForm({ ...optionForm, filiereId: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {(data.filieres || []).map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.code} - {f.nom}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Cycle LMD *
                      <select
                        value={optionForm.cycle}
                        onChange={(e) => setOptionForm({ ...optionForm, cycle: e.target.value as Cycle })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Licence">Licence</option>
                        <option value="Master">Master</option>
                        <option value="Doctorat">Doctorat</option>
                      </select>
                    </label>
                  </div>

                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Description de la spécialité
                    <textarea
                      rows={2}
                      value={optionForm.description}
                      onChange={(e) => setOptionForm({ ...optionForm, description: e.target.value })}
                      placeholder="Missions professionnelles, profils ciblés..."
                      className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </label>
                </>
              )}

              {/* Form 3: Niveau */}
              {activeTab === 'niveaux' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Code Niveau *
                      <input
                        type="text"
                        required
                        value={niveauForm.code}
                        onChange={(e) => setNiveauForm({ ...niveauForm, code: e.target.value })}
                        placeholder="ex. L1, L2, M1..."
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </label>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Cycle académique *
                      <select
                        value={niveauForm.cycle}
                        onChange={(e) => setNiveauForm({ ...niveauForm, cycle: e.target.value as Cycle })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Licence">Licence</option>
                        <option value="Master">Master</option>
                        <option value="Doctorat">Doctorat</option>
                      </select>
                    </label>
                  </div>

                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Intitulé Officiel *
                    <input
                      type="text"
                      required
                      value={niveauForm.intitule}
                      onChange={(e) => setNiveauForm({ ...niveauForm, intitule: e.target.value })}
                      placeholder="ex. Licence 1ère Année (Semestres S1 & S2)"
                      className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Crédits Requis (ECTS)
                      <input
                        type="number"
                        min="10"
                        max="360"
                        value={niveauForm.creditsRequis}
                        onChange={(e) => setNiveauForm({ ...niveauForm, creditsRequis: Number(e.target.value) })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>

                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Ordre d’avancement
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={niveauForm.ordre}
                        onChange={(e) => setNiveauForm({ ...niveauForm, ordre: Number(e.target.value) })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                  </div>
                </>
              )}

              {/* Form 4: Classe */}
              {activeTab === 'classes' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 col-span-1">
                      Code Classe *
                      <input
                        type="text"
                        required
                        value={classeForm.code}
                        onChange={(e) => setClasseForm({ ...classeForm, code: e.target.value.toUpperCase() })}
                        placeholder="ex. L1-INFO-A"
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </label>

                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 col-span-2">
                      Intitulé de la promotion *
                      <input
                        type="text"
                        required
                        value={classeForm.nom}
                        onChange={(e) => setClasseForm({ ...classeForm, nom: e.target.value })}
                        placeholder="ex. Licence 1 Informatique — Section A"
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Niveau *
                      <select
                        value={classeForm.niveau}
                        onChange={(e) => setClasseForm({ ...classeForm, niveau: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="L1">L1</option>
                        <option value="L2">L2</option>
                        <option value="L3">L3</option>
                        <option value="M1">M1</option>
                        <option value="M2">M2</option>
                        <option value="Doctorat">Doctorat</option>
                      </select>
                    </label>

                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 col-span-2">
                      Filière parente *
                      <select
                        value={classeForm.filiereId}
                        onChange={(e) => setClasseForm({ ...classeForm, filiereId: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {(data.filieres || []).map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.code} - {f.nom}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Option / Spécialité
                      <select
                        value={classeForm.optionId}
                        onChange={(e) => setClasseForm({ ...classeForm, optionId: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="">Tronc commun / Toutes options</option>
                        {(data.options || []).map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.code} - {o.nom}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Salle Principale
                      <input
                        type="text"
                        value={classeForm.salle}
                        onChange={(e) => setClasseForm({ ...classeForm, salle: e.target.value })}
                        placeholder="Amphi Nelson Mandela..."
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Délégué(e) de classe
                      <input
                        type="text"
                        value={classeForm.delegue}
                        onChange={(e) => setClasseForm({ ...classeForm, delegue: e.target.value })}
                        placeholder="Nom de l'étudiant délégué..."
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>

                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Capacité maximale (places)
                      <input
                        type="number"
                        min="10"
                        max="250"
                        value={classeForm.capacite}
                        onChange={(e) => setClasseForm({ ...classeForm, capacite: Number(e.target.value) })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                  </div>
                </>
              )}

              {/* Form 5: UE */}
              {activeTab === 'ue' && (
                <>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Code UE *
                    <input
                      type="text"
                      required
                      value={ueForm.code}
                      onChange={(e) => setUeForm({ ...ueForm, code: e.target.value })}
                      placeholder="ex. INF101"
                      className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Intitulé de l'UE *
                    <input
                      type="text"
                      required
                      value={ueForm.nom}
                      onChange={(e) => setUeForm({ ...ueForm, nom: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Parcours / Option rattachée
                    <select
                      value={ueForm.parcours}
                      onChange={(e) => setUeForm({ ...ueForm, parcours: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {data.parcours.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom} ({p.cycle})
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Semestre
                      <select
                        value={ueForm.sem}
                        onChange={(e) => setUeForm({ ...ueForm, sem: e.target.value as Semester })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="S1">S1</option>
                        <option value="S2">S2</option>
                        <option value="S3">S3</option>
                        <option value="S4">S4</option>
                        <option value="S5">S5</option>
                        <option value="S6">S6</option>
                      </select>
                    </label>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Crédits (ECTS)
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={ueForm.cred}
                        onChange={(e) => setUeForm({ ...ueForm, cred: Number(e.target.value) })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                  </div>
                </>
              )}

              {/* Form 6: EC */}
              {activeTab === 'ec' && (
                <>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Code Matière *
                    <input
                      type="text"
                      required
                      value={ecForm.code}
                      onChange={(e) => setEcForm({ ...ecForm, code: e.target.value })}
                      placeholder="ex. INF101-1"
                      className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Intitulé de la Matière *
                    <input
                      type="text"
                      required
                      value={ecForm.nom}
                      onChange={(e) => setEcForm({ ...ecForm, nom: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    UE de rattachement
                    <select
                      value={ecForm.ue}
                      onChange={(e) => setEcForm({ ...ecForm, ue: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {data.ue.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.code} - {u.nom}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Coefficient
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={ecForm.coef}
                        onChange={(e) => setEcForm({ ...ecForm, coef: Number(e.target.value) })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Volume Horaire (h)
                      <input
                        type="number"
                        min="5"
                        value={ecForm.vh}
                        onChange={(e) => setEcForm({ ...ecForm, vh: Number(e.target.value) })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                  </div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Enseignant titulaire
                    <select
                      value={ecForm.ens}
                      onChange={(e) => setEcForm({ ...ecForm, ens: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {data.teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nom} ({t.grade})
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              {/* Form 7: EDT */}
              {activeTab === 'edt' && (
                <>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Jour de la semaine
                    <select
                      value={edtForm.jour}
                      onChange={(e) =>
                        setEdtForm({ ...edtForm, jour: e.target.value as TimetableEntry['jour'] })
                      }
                      className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {daysList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Heure de début
                      <input
                        type="time"
                        value={edtForm.debut}
                        onChange={(e) => setEdtForm({ ...edtForm, debut: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Heure de fin
                      <input
                        type="time"
                        value={edtForm.fin}
                        onChange={(e) => setEdtForm({ ...edtForm, fin: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </label>
                  </div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Matière enseignée
                    <select
                      value={edtForm.ec}
                      onChange={(e) => setEdtForm({ ...edtForm, ec: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {data.ec.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.code} - {e.nom}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Salle de cours / Amphithéâtre
                    <input
                      type="text"
                      value={edtForm.salle}
                      onChange={(e) => setEdtForm({ ...edtForm, salle: e.target.value })}
                      placeholder="Amphi Nelson Mandela, Salle 102..."
                      className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </label>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0f4c3a] hover:bg-[#0c3c2e] rounded-xl shadow-xs"
                >
                  {editingId ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
