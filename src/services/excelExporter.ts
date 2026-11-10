import * as XLSX from 'xlsx';
import { AppData } from '../types';
import { calcBalance, calcFee, calcPaid } from './storage';
import { UNIVERSITY_NAME, UNIVERSITY_CITY, UNIVERSITY_MOTTO } from '../constants/assets';
import { getMultiYearComparisonData } from './historicalData';

const triggerDownload = (filename: string, data: any) => {
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1200);
};

export const exportGeneralExcel = (data: AppData) => {
  const workbook = XLSX.utils.book_new();
  workbook.Props = {
    Title: `${UNIVERSITY_NAME} — Registre Officiel LMD`,
    Subject: `Données académiques et financières ${data.p.ann}`,
    Author: `${UNIVERSITY_NAME} · ${UNIVERSITY_CITY}`,
    Company: UNIVERSITY_NAME,
    Comments: `Devise : ${UNIVERSITY_MOTTO}`,
    CreatedDate: new Date(),
  };

  // Sheet 1: Students
  const studentsRows = data.students.map((s) => {
    const p = data.parcours.find((item) => item.id === s.parcours);
    return {
      Matricule: s.mat,
      Nom: s.nom,
      Prénom: s.prenom,
      Sexe: s.sexe,
      'Date de Naissance': s.naiss,
      Lieu: s.lieu,
      Téléphone: s.tel,
      Email: s.email,
      Option: p?.nom || '',
      Niveau: s.niveau,
      Cycle: s.cyc,
      'Dossier Complet': s.dossier,
    };
  });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(studentsRows), 'Étudiants');

  // Sheet 2: Finances
  const financeRows = data.students.map((s) => {
    const fee = calcFee(s, data);
    const paid = calcPaid(s.id, data);
    const balance = calcBalance(s, data);
    return {
      Matricule: s.mat,
      'Nom & Prénom': `${s.nom} ${s.prenom}`,
      'Coût Formation': fee,
      'Montant Encaissé': paid,
      'Solde Restant': balance,
      'État Paiement': balance <= 0 ? 'Soldé' : 'Impayé',
    };
  });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(financeRows), 'Situation Financière');

  // Sheet 3: Multi-Year Comparison & Archives
  const comparison = getMultiYearComparisonData(data);
  const comparisonRows = comparison.allYearsChronological.map((y) => ({
    'Année Académique': y.year,
    'Nom de Promotion': y.nomPromotion,
    Statut: y.status,
    'Effectif Total': y.totalStudents,
    'Cycle Licence': y.licenceCount,
    'Cycle Master': y.masterCount,
    Doctorat: y.doctoratCount,
    'Taux Réussite LMD (%)': y.successRate,
    'Taux Assiduité (%)': y.attendanceRate,
    'Trésorerie Recouvrée (FCFA)': y.totalFeesCollected,
    'Taux Recouvrement (%)': y.recoveryRate,
    'Corps Enseignant': y.totalTeachers,
    'Lauréats Diplômés': y.diplomesDelivres,
    'Major de Promotion': `${y.majorPromotion.nom} (${y.majorPromotion.moyenne}/20 - ${y.majorPromotion.filiere})`,
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(comparisonRows), 'Comparatif Pluriannuel');

  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  triggerDownload(`universite-henri-lopes-${data.p.ann}.xlsx`, excelBuffer);
};

export const exportSurveillanceExcel = (data: AppData) => {
  const workbook = XLSX.utils.book_new();
  workbook.Props = {
    Title: `${UNIVERSITY_NAME} — Registre Surveillance`,
    Author: `${UNIVERSITY_NAME} · ${UNIVERSITY_CITY}`,
    Company: UNIVERSITY_NAME,
    Comments: `Devise : ${UNIVERSITY_MOTTO}`,
    CreatedDate: new Date(),
  };

  const rows = data.surv.map((item) => {
    const s = data.students.find((stu) => stu.id === item.etu);
    const inDate = new Date(item.in);
    const outDate = item.out ? new Date(item.out) : null;
    return {
      Date: inDate.toISOString().slice(0, 10),
      Matricule: s?.mat || '—',
      Étudiant: s ? `${s.nom} ${s.prenom}` : 'Inconnu',
      'Heure d’Arrivée': inDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      'Heure de Sortie': outDate
        ? outDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : 'Sur le campus',
    };
  });

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Registre Surveillance');
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  triggerDownload(`registre-surveillance-${new Date().toISOString().slice(0, 10)}.xlsx`, buffer);
};

export const exportAcademicExcel = (data: AppData) => {
  const workbook = XLSX.utils.book_new();
  workbook.Props = {
    Title: `${UNIVERSITY_NAME} — Structure Académique LMD`,
    Author: `${UNIVERSITY_NAME} · ${UNIVERSITY_CITY}`,
    Company: UNIVERSITY_NAME,
    Comments: `Devise : ${UNIVERSITY_MOTTO}`,
    CreatedDate: new Date(),
  };

  // 1. Filières
  const filiereRows = (data.filieres || []).map((f) => ({
    Code: f.code,
    Filière: f.nom,
    Domaine: f.domaine,
    'Chef de Département': f.chefDept || '—',
    Description: f.description || '',
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(filiereRows), 'Filières');

  // 2. Options / Parcours
  const optionRows = (data.options || []).map((o) => {
    const f = (data.filieres || []).find((x) => x.id === o.filiereId || x.code === o.filiereId);
    return {
      Code: o.code,
      Option: o.nom,
      Filière: f?.nom || o.filiereId,
      Cycle: o.cycle,
      Description: o.description || '',
    };
  });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(optionRows), 'Options');

  // 3. Niveaux
  const niveauRows = (data.niveaux || []).map((n) => ({
    Niveau: n.code,
    Intitulé: n.intitule,
    Cycle: n.cycle,
    'Crédits Requis (ECTS)': n.creditsRequis,
    Ordre: n.ordre,
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(niveauRows), 'Niveaux');

  // 4. Classes
  const classeRows = (data.classes || []).map((c) => {
    const f = (data.filieres || []).find((x) => x.id === c.filiereId || x.code === c.filiereId);
    const o = (data.options || []).find((x) => x.id === c.optionId || x.code === c.optionId);
    const count = data.students.filter(
      (s) => s.classe === c.code || s.classe === c.id || (s.niveau === c.niveau && (s.parcours === c.optionId || s.fil === f?.nom))
    ).length;
    return {
      Code: c.code,
      Nom: c.nom,
      Niveau: c.niveau,
      Filière: f?.nom || c.filiereId,
      Option: o?.nom || c.optionId || '—',
      Salle: c.salle || '—',
      Délégué: c.delegue || '—',
      Capacité: c.capacite || '—',
      'Étudiants inscrits': count,
    };
  });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(classeRows), 'Classes');

  // 5. Parcours (Legacy)
  const parcoursRows = data.parcours.map((p) => ({
    Intitulé: p.nom,
    Domaine: p.dom,
    Cycle: p.cycle,
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(parcoursRows), 'Parcours');

  // UE
  const ueRows = data.ue.map((u) => {
    const p = data.parcours.find((item) => item.id === u.parcours);
    return {
      Code: u.code,
      Intitulé: u.nom,
      Parcours: p?.nom || '',
      Semestre: u.sem,
      Crédits: u.cred,
    };
  });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(ueRows), 'Unités d’Enseignement');

  // EC
  const ecRows = data.ec.map((e) => {
    const u = data.ue.find((item) => item.id === e.ue);
    const t = data.teachers.find((item) => item.id === e.ens);
    return {
      Code: e.code,
      Intitulé: e.nom,
      UE: u?.nom || '',
      Coefficient: e.coef,
      'Volume Horaire (h)': e.vh,
      Enseignant: t?.nom || 'Non assigné',
    };
  });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(ecRows), 'Matières EC');

  // Timetable
  const edtRows = data.edt.map((e) => {
    const ec = data.ec.find((item) => item.id === e.ec);
    return {
      Jour: e.jour,
      Début: e.debut,
      Fin: e.fin,
      Matière: ec?.nom || '',
      Salle: e.salle,
    };
  });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(edtRows), 'Emploi du Temps');

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  triggerDownload(`academique-${data.p.ann}.xlsx`, buffer);
};
