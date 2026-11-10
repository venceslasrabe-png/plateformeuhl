import { AppData, ClasseItem, EC, Filiere, NiveauItem, OptionItem, SemesterResult, Student, TimetableEntry, UE } from '../types';
import { DEFAULT_PARAMS } from '../constants/assets';

const STORAGE_KEY = 'hlu-lmd-app-data';

export const uid = () => Math.random().toString(36).slice(2, 9);

export const formatFCFA = (num: number): string => {
  return Math.round(num).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ') + ' FCFA';
};

export const getMention = (moy: number | null): string => {
  if (moy === null) return '—';
  if (moy >= 16) return 'Très bien';
  if (moy >= 14) return 'Bien';
  if (moy >= 12) return 'Assez bien';
  if (moy >= 10) return 'Passable';
  return 'Ajourné';
};

export const generateMatricule = (data: AppData): string => {
  const year = data.p.ann.slice(0, 4);
  const count = data.students.length + 1;
  return `UHL-${year}-${String(count).padStart(4, '0')}`;
};

export const calcFee = (s: Student, data: AppData): number => {
  if (Number(s.cout) > 0) return Number(s.cout);
  const p = data.parcours.find((item) => item.id === s.parcours);
  if (!p) return 0;
  return data.p.fees[p.cycle] || 0;
};

export const calcPaid = (studentId: string, data: AppData): number => {
  return data.pay
    .filter((p) => p.etu === studentId)
    .reduce((sum, p) => sum + Number(p.montant || 0), 0);
};

export const calcBalance = (s: Student, data: AppData): number => {
  return calcFee(s, data) - calcPaid(s.id, data);
};

export const calcEcAverage = (
  ecId: string,
  studentId: string,
  data: AppData
): number | null => {
  const note = data.notes[`${ecId}|${studentId}`] || {};
  const has = (v: any) => v !== undefined && v !== '' && v !== null;
  if (!has(note.cc) || !has(note.ex)) return null;

  const exVal = has(note.rt) ? Math.max(Number(note.ex), Number(note.rt)) : Number(note.ex);
  const ccWeight = data.p.cc / 100;
  const exWeight = (100 - data.p.cc) / 100;
  return Number(note.cc) * ccWeight + exVal * exWeight;
};

export const calcSemesterResult = (
  studentId: string,
  sem: string,
  data: AppData
): SemesterResult => {
  const st = data.students.find((s) => s.id === studentId);
  if (!st) {
    return { rows: [], moy: null, cr: 0, tot: 0, dec: '—' };
  }

  const ues = data.ue.filter((u) => u.parcours === st.parcours && u.sem === sem);
  let totalWeighted = 0;
  let totalCredits = 0;
  let creditsValidated = 0;
  let allComplete = true;
  let hasRattrapage = false;

  const rows: Array<[UE, number | null]> = ues.map((u) => {
    let ecWeighted = 0;
    let ecCoeffSum = 0;
    const ecs = data.ec.filter((e) => e.ue === u.id);

    ecs.forEach((e) => {
      const note = data.notes[`${e.id}|${studentId}`] || {};
      if (note.rt !== undefined && note.rt !== '' && note.rt !== null) {
        hasRattrapage = true;
      }
      const avg = calcEcAverage(e.id, studentId, data);
      if (avg !== null) {
        ecWeighted += avg * Number(e.coef);
        ecCoeffSum += Number(e.coef);
      }
    });

    const ueAvg = ecCoeffSum > 0 ? ecWeighted / ecCoeffSum : null;
    totalCredits += Number(u.cred);

    if (ueAvg === null) {
      allComplete = false;
    } else {
      totalWeighted += ueAvg * Number(u.cred);
      if (ueAvg >= data.p.seuil) {
        creditsValidated += Number(u.cred);
      }
    }

    return [u, ueAvg];
  });

  const semAvg = totalCredits > 0 && allComplete ? totalWeighted / totalCredits : null;

  // LMD rule: if overall semester average >= threshold, full semester credits are validated (compensation)
  if (semAvg !== null && semAvg >= data.p.seuil) {
    creditsValidated = totalCredits;
  }

  let decision: 'Admis' | 'Ajourné' | 'Rattrapage' | 'Incomplet' | '—';
  if (!ues.length) decision = '—';
  else if (!allComplete) decision = 'Incomplet';
  else if (semAvg !== null && semAvg >= data.p.seuil) decision = 'Admis';
  else if (hasRattrapage) decision = 'Ajourné';
  else decision = 'Rattrapage';

  return {
    rows,
    moy: semAvg,
    cr: creditsValidated,
    tot: totalCredits,
    dec: decision,
  };
};

export const getStudentRank = (
  studentId: string,
  sem: string,
  data: AppData
): [number | null, number] => {
  const target = data.students.find((s) => s.id === studentId);
  if (!target) return [null, 0];

  const classmates = data.students.filter((s) => s.parcours === target.parcours);
  const scored = classmates
    .map((s) => ({
      id: s.id,
      moy: calcSemesterResult(s.id, sem, data).moy,
    }))
    .filter((item) => item.moy !== null)
    .sort((a, b) => (b.moy as number) - (a.moy as number));

  const index = scored.findIndex((s) => s.id === studentId);
  return [index < 0 ? null : index + 1, scored.length];
};

export const getStudentAbsences = (studentId: string, data: AppData): number => {
  let count = 0;
  Object.values(data.pres).forEach((session) => {
    if (session[studentId] === 0) {
      count++;
    }
  });
  return count;
};

export const getStudentLastClassEnd = (
  student: Student,
  data: AppData
): string | null => {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;
  const todayName = days[new Date().getDay()];

  let maxTime: string | null = null;
  data.edt
    .filter((e) => e.jour === todayName)
    .forEach((e) => {
      const ec = data.ec.find((x) => x.id === e.ec);
      const ue = ec && data.ue.find((u) => u.id === ec.ue);
      if (ue && ue.parcours === student.parcours) {
        if (!maxTime || e.fin > maxTime) {
          maxTime = e.fin;
        }
      }
    });
  return maxTime;
};

export const isStudentLateOnCampus = (student: Student, data: AppData): boolean => {
  const end = getStudentLastClassEnd(student, data);
  if (!end) return false;
  const [h, m] = end.split(':');
  const classEndTime = new Date();
  classEndTime.setHours(Number(h), Number(m), 0, 0);
  // Alert if more than 1 hour (3600000ms) after last class
  return Date.now() > classEndTime.getTime() + 3600000;
};

export const createInitialSeedData = (): AppData => {
  const p1 = uid();
  const p2 = uid();
  const p3 = uid();

  const u1 = uid();
  const u2 = uid();
  const u3 = uid();
  const u4 = uid();

  const t1 = 't1';
  const t2 = 't2';
  const t3 = 't3';

  const e1 = 'e1';
  const e2 = 'e2';
  const e3 = 'e3';
  const e4 = 'e4';
  const e5 = 'e5';

  const initialFilieres: Filiere[] = [
    {
      id: 'fil-info',
      code: 'INFO',
      nom: 'Informatique & Sciences du Numérique',
      domaine: 'Sciences et Technologies',
      chefDept: 'Prof. Jean-Claude Mavoungou',
      description: 'Ingénierie logicielle, réseaux télécoms, intelligence artificielle et systèmes d’information.',
    },
    {
      id: 'fil-droit',
      code: 'DROIT',
      nom: 'Sciences Juridiques & Politiques',
      domaine: 'Sciences Juridiques et Politiques',
      chefDept: 'Dr. Arlette Ndinga-Loubaki',
      description: 'Droit des affaires OHADA, droit privé fondamental, contentieux fiscal et carrières judiciaires.',
    },
    {
      id: 'fil-secog',
      code: 'SECOG',
      nom: 'Sciences Économiques & Gestion',
      domaine: 'Sciences Économiques et de Gestion',
      chefDept: 'M. Bienvenu Mampouya',
      description: 'Audit et contrôle de gestion, finance de marché, comptabilité générale et management des organisations.',
    },
    {
      id: 'fil-comm',
      code: 'COMM',
      nom: 'Lettres, Langues & Communication',
      domaine: 'Arts, Lettres et Sciences Humaines',
      chefDept: 'Dr. Marcellin Mavoungou',
      description: 'Communication digitale, relations publiques, journalisme multimédia et traduction professionnelle.',
    },
  ];

  const initialOptions: OptionItem[] = [
    {
      id: p1,
      code: 'IGR',
      nom: 'Informatique de Gestion & Réseaux',
      filiereId: 'fil-info',
      cycle: 'Licence',
      description: 'Administration de réseaux informatiques, bases de données relationnelles et ERP.',
    },
    {
      id: 'opt-glsi',
      code: 'GLSI',
      nom: 'Génie Logiciel & Systèmes d’Information',
      filiereId: 'fil-info',
      cycle: 'Licence',
      description: 'Architecture logicielle, conception objet, développement web & mobile moderne.',
    },
    {
      id: p2,
      code: 'DAF',
      nom: 'Droit des Affaires & Fiscalité',
      filiereId: 'fil-droit',
      cycle: 'Master',
      description: 'Droit des sociétés OHADA, arbitrage commercial, ingénierie fiscale et droit bancaire.',
    },
    {
      id: 'opt-dpf',
      code: 'DPF',
      nom: 'Droit Privé Fondamental',
      filiereId: 'fil-droit',
      cycle: 'Licence',
      description: 'Droit civil des obligations, régime général des sûretés et procédure civile.',
    },
    {
      id: p3,
      code: 'SEG',
      nom: 'Sciences Économiques & Gestion',
      filiereId: 'fil-secog',
      cycle: 'Licence',
      description: 'Macroéconomie, microéconomie avancée, gestion financière et analyse statistique.',
    },
    {
      id: 'opt-baf',
      code: 'BAF',
      nom: 'Banque, Assurance & Finance',
      filiereId: 'fil-secog',
      cycle: 'Master',
      description: 'Marchés financiers, analyse des risques bancaires, microfinance et conformité réglementaire.',
    },
  ];

  const initialNiveaux: NiveauItem[] = [
    {
      id: 'niv-l1',
      code: 'L1',
      intitule: 'Licence 1ère Année (Semestres S1 & S2)',
      cycle: 'Licence',
      ordre: 1,
      creditsRequis: 60,
    },
    {
      id: 'niv-l2',
      code: 'L2',
      intitule: 'Licence 2ème Année (Semestres S3 & S4)',
      cycle: 'Licence',
      ordre: 2,
      creditsRequis: 120,
    },
    {
      id: 'niv-l3',
      code: 'L3',
      intitule: 'Licence 3ème Année (Semestres S5 & S6)',
      cycle: 'Licence',
      ordre: 3,
      creditsRequis: 180,
    },
    {
      id: 'niv-m1',
      code: 'M1',
      intitule: 'Master 1ère Année (Semestres S7 & S8)',
      cycle: 'Master',
      ordre: 4,
      creditsRequis: 240,
    },
    {
      id: 'niv-m2',
      code: 'M2',
      intitule: 'Master 2ème Année (Semestres S9 & S10)',
      cycle: 'Master',
      ordre: 5,
      creditsRequis: 300,
    },
    {
      id: 'niv-doc',
      code: 'Doctorat',
      intitule: 'Doctorat / Ph.D (Thèse de recherche)',
      cycle: 'Doctorat',
      ordre: 6,
      creditsRequis: 360,
    },
  ];

  const initialClasses: ClasseItem[] = [
    {
      id: 'cls-l1-info-a',
      code: 'L1-INFO-A',
      nom: 'Licence 1 Informatique — Section A',
      filiereId: 'fil-info',
      optionId: p1,
      niveau: 'L1',
      salle: 'Amphithéâtre Nelson Mandela',
      delegue: 'Clarisse Grâce Mavoungou',
      capacite: 60,
    },
    {
      id: 'cls-l2-info',
      code: 'L2-INFO',
      nom: 'Licence 2 Informatique de Gestion',
      filiereId: 'fil-info',
      optionId: p1,
      niveau: 'L2',
      salle: 'Laboratoire Informatique 1',
      delegue: 'Dieudonné Landry Tchicaya',
      capacite: 45,
    },
    {
      id: 'cls-l3-glsi',
      code: 'L3-GLSI',
      nom: 'Licence 3 Génie Logiciel',
      filiereId: 'fil-info',
      optionId: 'opt-glsi',
      niveau: 'L3',
      salle: 'Salle TP Informatique 104',
      delegue: 'Prince Destin Ngoma',
      capacite: 40,
    },
    {
      id: 'cls-m1-daf',
      code: 'M1-DAF',
      nom: 'Master 1 Droit des Affaires & Fiscalité',
      filiereId: 'fil-droit',
      optionId: p2,
      niveau: 'M1',
      salle: 'Amphithéâtre Droit & Économie',
      delegue: 'Fabrice Vivien Bouanga',
      capacite: 50,
    },
    {
      id: 'cls-l1-secog',
      code: 'L1-SECOG',
      nom: 'Licence 1 Sciences Éco & Gestion',
      filiereId: 'fil-secog',
      optionId: p3,
      niveau: 'L1',
      salle: 'Salle B2',
      delegue: 'Esther Priscille Loemba',
      capacite: 65,
    },
  ];

  const initialParcours = [
    {
      id: p1,
      nom: 'Informatique de Gestion & Réseaux',
      dom: 'Sciences et Technologies',
      cycle: 'Licence' as const,
    },
    {
      id: p2,
      nom: 'Droit des Affaires & Fiscalité',
      dom: 'Sciences Juridiques et Politiques',
      cycle: 'Master' as const,
    },
    {
      id: p3,
      nom: 'Sciences Économiques & Gestion',
      dom: 'Sciences Économiques et de Gestion',
      cycle: 'Licence' as const,
    },
  ];

  const initialTeachers = [
    {
      id: t1,
      nom: 'Prof. Jean-Claude Mavoungou',
      statut: 'Permanent' as const,
      grade: 'Professeur Titulaire / Doyen',
      tel: '+242 06 650 12 34',
      email: 'jc.mavoungou@universite-henrilopes.cg',
    },
    {
      id: t2,
      nom: 'Dr. Arlette Ndinga-Loubaki',
      statut: 'Permanent' as const,
      grade: 'Maître de Conférences',
      tel: '+242 05 530 45 67',
      email: 'a.ndinga@universite-henrilopes.cg',
    },
    {
      id: t3,
      nom: 'Ing. Guy Bertrand Boukaka',
      statut: 'Vacataire' as const,
      grade: 'Ingénieur Systèmes Senior',
      tel: '+242 06 910 88 99',
      email: 'gb.boukaka@universite-henrilopes.cg',
    },
  ];

  const initialUe = [
    {
      id: u1,
      code: 'INF101',
      nom: 'Algorithmique & Structures de Données',
      parcours: p1,
      sem: 'S1' as const,
      cred: 6,
    },
    {
      id: u2,
      code: 'MAT101',
      nom: 'Mathématiques Appliquées & Algèbre',
      parcours: p1,
      sem: 'S1' as const,
      cred: 4,
    },
    {
      id: u3,
      code: 'ECO101',
      nom: 'Introduction à l’Économie d’Entreprise',
      parcours: p1,
      sem: 'S1' as const,
      cred: 4,
    },
    {
      id: u4,
      code: 'JUR201',
      nom: 'Droit des Contrats & Affaires',
      parcours: p2,
      sem: 'S1' as const,
      cred: 6,
    },
  ];

  const initialEc = [
    {
      id: e1,
      code: 'INF101-1',
      nom: 'Algorithmique Fondamentale',
      ue: u1,
      coef: 2,
      vh: 30,
      ens: t1,
    },
    {
      id: e2,
      code: 'INF101-2',
      nom: 'Programmation C & Web',
      ue: u1,
      coef: 2,
      vh: 35,
      ens: t3,
    },
    {
      id: e3,
      code: 'MAT101-1',
      nom: 'Analyse & Calcul Matriciel',
      ue: u2,
      coef: 2,
      vh: 28,
      ens: t2,
    },
    {
      id: e4,
      code: 'ECO101-1',
      nom: 'Comptabilité Générale',
      ue: u3,
      coef: 1,
      vh: 20,
      ens: t1,
    },
    {
      id: e5,
      code: 'JUR201-1',
      nom: 'Droit des Sociétés OHADA',
      ue: u4,
      coef: 3,
      vh: 40,
      ens: t2,
    },
  ];

  const initialEdt: TimetableEntry[] = [
    {
      id: uid(),
      jour: 'Lundi',
      debut: '08:00',
      fin: '10:00',
      ec: e1,
      salle: 'Amphithéâtre Nelson Mandela',
    },
    {
      id: uid(),
      jour: 'Lundi',
      debut: '10:15',
      fin: '12:15',
      ec: e2,
      salle: 'Laboratoire Informatique 1',
    },
    {
      id: uid(),
      jour: 'Mardi',
      debut: '08:30',
      fin: '11:30',
      ec: e3,
      salle: 'Salle 104',
    },
    {
      id: uid(),
      jour: 'Mercredi',
      debut: '09:00',
      fin: '12:00',
      ec: e4,
      salle: 'Salle B2',
    },
    {
      id: uid(),
      jour: 'Jeudi',
      debut: '14:00',
      fin: '17:00',
      ec: e1,
      salle: 'Salle TP Informatique',
    },
    {
      id: uid(),
      jour: 'Vendredi',
      debut: '08:00',
      fin: '11:00',
      ec: e5,
      salle: 'Amphithéâtre Droit',
    },
  ];

  const studentsList = [
    {
      nom: 'Mavoungou',
      prenom: 'Clarisse Grâce',
      sexe: 'Féminin' as const,
      naiss: '2004-03-12',
      lieu: 'Pointe-Noire',
      tel: '+242 06 612 34 56',
      email: 'clarisse.mavoungou@gmail.com',
      niveau: 'L1',
      parcours: p1,
      cyc: 'LN (licence normale)',
      fil: 'Informatique',
      stat: 'Normal' as const,
      tut: 'Mavoungou Paul',
      ttut: '+242 05 511 22 33',
      modp: 'Mensuel' as const,
      modr: 'Mobile money' as const,
      ech: 50000,
      cout: 150000,
    },
    {
      nom: 'Ngoma',
      prenom: 'Prince Destin',
      sexe: 'Masculin' as const,
      naiss: '2003-07-25',
      lieu: 'Brazzaville',
      tel: '+242 05 540 78 90',
      email: 'prince.ngoma@outlook.com',
      niveau: 'L1',
      parcours: p1,
      cyc: 'LN (licence normale)',
      fil: 'Informatique',
      stat: 'Normal' as const,
      tut: 'Ngoma Alphonse',
      ttut: '+242 06 940 11 22',
      modp: 'Semestriel' as const,
      modr: 'Espèces' as const,
      ech: 75000,
      cout: 150000,
    },
    {
      nom: 'Itoua',
      prenom: 'Grâce Divine',
      sexe: 'Féminin' as const,
      naiss: '2004-11-04',
      lieu: 'Dolisie',
      tel: '+242 06 820 44 55',
      email: 'grace.itoua@yahoo.fr',
      niveau: 'L1',
      parcours: p1,
      cyc: 'LN (licence normale)',
      fil: 'Informatique',
      stat: 'Boursier' as const,
      tut: 'Itoua Serge',
      ttut: '+242 05 520 88 77',
      modp: 'Annuel' as const,
      modr: 'Virement' as const,
      ech: 150000,
      cout: 150000,
    },
    {
      nom: 'Bouanga',
      prenom: 'Fabrice Vivien',
      sexe: 'Masculin' as const,
      naiss: '2002-09-18',
      lieu: 'Pointe-Noire',
      tel: '+242 05 570 33 22',
      email: 'fabrice.bouanga@gmail.com',
      niveau: 'M1',
      parcours: p2,
      cyc: 'Master',
      fil: 'Droit des Affaires',
      stat: 'Normal' as const,
      tut: 'Bouanga Henriette',
      ttut: '+242 06 630 99 88',
      modp: 'Semestriel' as const,
      modr: 'Chèque' as const,
      ech: 125000,
      cout: 250000,
    },
    {
      nom: 'Loemba',
      prenom: 'Esther Priscille',
      sexe: 'Féminin' as const,
      naiss: '2004-01-30',
      lieu: 'Pointe-Noire',
      tel: '+242 06 905 12 87',
      email: 'esther.loemba@gmail.com',
      niveau: 'L1',
      parcours: p1,
      cyc: 'LN (licence normale)',
      fil: 'Informatique',
      stat: 'Normal' as const,
      tut: 'Loemba David',
      ttut: '+242 05 588 44 11',
      modp: 'Mensuel' as const,
      modr: 'Mobile money' as const,
      ech: 50000,
      cout: 150000,
    },
    {
      nom: 'Tchicaya',
      prenom: 'Dieudonné Landry',
      sexe: 'Masculin' as const,
      naiss: '2003-05-14',
      lieu: 'Oyo',
      tel: '+242 05 515 90 40',
      email: 'dieudonne.tchicaya@gmail.com',
      niveau: 'L2',
      parcours: p1,
      cyc: 'LN (licence normale)',
      fil: 'Informatique',
      stat: 'Réduction' as const,
      tut: 'Tchicaya Blandine',
      ttut: '+242 06 601 77 44',
      modp: 'Mensuel' as const,
      modr: 'Espèces' as const,
      ech: 40000,
      cout: 120000,
    },
  ];

  const students: Student[] = studentsList.map((st, idx) => ({
    id: `etu-${idx + 1}`,
    mat: `UHL-2026-${String(idx + 1).padStart(4, '0')}`,
    nom: st.nom,
    prenom: st.prenom,
    naiss: st.naiss,
    lieu: st.lieu,
    sexe: st.sexe,
    nat: 'Congolaise',
    tel: st.tel,
    bp: 'BP 1254',
    email: st.email,
    adr: 'Quartier Mpita, Rue des Manguiers',
    ville: 'Pointe-Noire',
    cyc: st.cyc,
    annee: '2026-2027',
    parcours: st.parcours,
    fil: st.fil,
    niveau: st.niveau,
    classe: st.niveau === 'L1' ? (st.fil === 'Informatique' ? 'cls-l1-info-a' : 'cls-l1-secog') : (st.niveau === 'L2' ? 'cls-l2-info' : (st.niveau === 'M1' ? 'cls-m1-daf' : 'cls-l1-info-a')),
    dnv: 'Terminale D',
    ddip: 'Baccalauréat Scientifique',
    dan: '2025',
    etab: 'Lycée Victor Augagneur',
    dossier: 'Oui',
    pere: st.nom + ' Senior',
    telpere: '+242 06 600 00 00',
    fpere: 'Cadre administratif',
    mere: 'Mme ' + st.nom,
    telmere: '+242 05 500 00 00',
    fmere: 'Enseignante',
    adrp: 'Pointe-Noire, Congo',
    nfr: 2,
    nso: 1,
    tut: st.tut,
    ttut: st.ttut,
    ftut: 'Commerçant',
    atut: 'Pointe-Noire',
    ltut: 'Oncle',
    modp: st.modp,
    resp: st.tut,
    dins: ['2026-08-26', '2026-09-08', '2026-09-22', '2026-10-06', '2026-10-24', '2026-11-04'][idx % 6],
    ech: st.ech,
    modr: st.modr,
    cout: st.cout,
    typr: 'Inscription',
    stat: st.stat,
  }));

  const notes: Record<string, any> = {
    [`${e1}|etu-1`]: { cc: 14.5, ex: 15.0 },
    [`${e2}|etu-1`]: { cc: 16.0, ex: 15.5 },
    [`${e3}|etu-1`]: { cc: 13.0, ex: 14.0 },
    [`${e4}|etu-1`]: { cc: 12.0, ex: 13.0 },

    [`${e1}|etu-2`]: { cc: 11.0, ex: 10.5 },
    [`${e2}|etu-2`]: { cc: 12.0, ex: 11.5 },
    [`${e3}|etu-2`]: { cc: 9.5, ex: 8.0, rt: 11.0 },
    [`${e4}|etu-2`]: { cc: 10.0, ex: 10.0 },

    [`${e1}|etu-3`]: { cc: 17.0, ex: 18.0 },
    [`${e2}|etu-3`]: { cc: 18.5, ex: 17.5 },
    [`${e3}|etu-3`]: { cc: 16.0, ex: 16.5 },
    [`${e4}|etu-3`]: { cc: 15.0, ex: 16.0 },

    [`${e5}|etu-4`]: { cc: 14.0, ex: 13.5 },

    [`${e1}|etu-5`]: { cc: 10.0, ex: 9.0, rt: 12.0 },
    [`${e2}|etu-5`]: { cc: 13.5, ex: 12.0 },
    [`${e3}|etu-5`]: { cc: 11.0, ex: 10.5 },
    [`${e4}|etu-5`]: { cc: 12.5, ex: 11.0 },
  };

  const payments = [
    {
      id: uid(),
      etu: 'etu-1',
      montant: 150000,
      mode: 'Mobile money' as const,
      date: '2026-10-15',
      caissier: 'Caisse Centrale - Mme Mougany',
      ts: Date.now() - 86400000 * 10,
    },
    {
      id: uid(),
      etu: 'etu-2',
      montant: 75000,
      mode: 'Espèces' as const,
      date: '2026-10-16',
      caissier: 'Caisse Centrale - Mme Mougany',
      ts: Date.now() - 86400000 * 9,
    },
    {
      id: uid(),
      etu: 'etu-3',
      montant: 150000,
      mode: 'Virement' as const,
      date: '2026-10-18',
      caissier: 'Comptabilité - M. Mampouya',
      ts: Date.now() - 86400000 * 7,
    },
    {
      id: uid(),
      etu: 'etu-4',
      montant: 125000,
      mode: 'Chèque' as const,
      date: '2026-10-20',
      caissier: 'Comptabilité - M. Mampouya',
      ts: Date.now() - 86400000 * 5,
    },
    {
      id: uid(),
      etu: 'etu-5',
      montant: 50000,
      mode: 'Mobile money' as const,
      date: '2026-10-22',
      caissier: 'Caisse Centrale - Mme Mougany',
      ts: Date.now() - 86400000 * 3,
    },
  ];

  const todayStr = new Date().toISOString().slice(0, 10);
  const pres: Record<string, Record<string, number>> = {
    [`${e1}|${todayStr}`]: {
      'etu-1': 1,
      'etu-2': 1,
      'etu-3': 1,
      'etu-5': 1,
    },
    [`${e1}|2026-11-04`]: {
      'etu-1': 1,
      'etu-2': 0,
      'etu-3': 1,
      'etu-5': 0,
    },
    [`${e1}|2026-11-05`]: {
      'etu-1': 1,
      'etu-2': 0,
      'etu-3': 1,
      'etu-5': 0,
    },
    [`${e2}|2026-11-06`]: {
      'etu-1': 1,
      'etu-2': 0, // 3 absences for etu-2
      'etu-3': 1,
      'etu-5': 1,
    },
  };

  const exams = [
    {
      id: uid(),
      ec: e1,
      session: 'Normale' as const,
      date: '2027-01-15',
      salle: 'Amphi Nelson Mandela',
    },
    {
      id: uid(),
      ec: e2,
      session: 'Normale' as const,
      date: '2027-01-18',
      salle: 'Labo Info 1 & 2',
    },
    {
      id: uid(),
      ec: e3,
      session: 'Normale' as const,
      date: '2027-01-20',
      salle: 'Salle 104',
    },
    {
      id: uid(),
      ec: e1,
      session: 'Rattrapage' as const,
      date: '2027-02-10',
      salle: 'Salle 102',
    },
  ];

  const announcements = [
    {
      id: uid(),
      titre: 'Rentrée académique solennelle 2026-2027',
      cible: 'Tous' as const,
      msg: 'La cérémonie d’ouverture solennelle de l’année académique aura lieu dans le grand amphithéâtre en présence du Conseil de l’Université.',
      ts: Date.now() - 86400000 * 14,
    },
    {
      id: uid(),
      titre: 'Paiement de la 2ème tranche des frais de scolarité',
      cible: 'Étudiants' as const,
      msg: 'Rappel à l’attention de tous les étudiants : la date limite pour l’échéance du semestre 1 est fixée au 30 novembre.',
      ts: Date.now() - 86400000 * 4,
    },
    {
      id: uid(),
      titre: 'Dépôt des sujets de devoirs sur table',
      cible: 'Enseignants' as const,
      msg: 'Les enseignants titulaires d’EC sont priés de transmettre leurs sujets de CC au secrétariat académique avant vendredi 17h.',
      ts: Date.now() - 86400000 * 2,
    },
    {
      id: uid(),
      titre: 'Nouvelle inscription à encaisser',
      cible: 'Caisse' as const,
      etu: 'etu-5',
      msg: 'Loemba Esther Priscille (UHL-2026-0005) · Informatique · L1 : échéance 50 000 FCFA sur un coût de 150 000 FCFA.',
      ts: Date.now() - 86400000 * 1,
    },
  ];

  const now = Date.now();
  const surv = [
    {
      id: uid(),
      etu: 'etu-1',
      in: now - 3600000 * 3, // arrived 3h ago
      out: null, // still on campus
    },
    {
      id: uid(),
      etu: 'etu-2',
      in: now - 3600000 * 2.5,
      out: null,
    },
    {
      id: uid(),
      etu: 'etu-3',
      in: now - 3600000 * 4,
      out: now - 3600000 * 1, // departed 1h ago
    },
    {
      id: uid(),
      etu: 'etu-5',
      in: now - 3600000 * 6, // arrived 6h ago, class ended >1h ago -> Late alert!
      out: null,
    },
  ];

  const missions = [
    {
      id: uid(),
      titre: 'Édition des badges d’accès pour la cohorte L1',
      desc: 'Imprimer et plastifier les cartes PVC d’étudiants avec QR codes pour les nouveaux inscrits de la filière informatique.',
      to: 'r:scolarite',
      priorite: 'Haute' as const,
      delai: '2026-11-20',
      statut: 'En cours' as const,
      ts: now - 86400000 * 2,
      par: 'Direction des Études',
    },
    {
      id: uid(),
      titre: 'Contrôle renforcé des accès à la porte Principale',
      desc: 'Vérifier systématiquement le badge étudiant et l’état du règlement à la guérite Sud entre 07h30 et 08h30.',
      to: 'r:surveillant',
      priorite: 'Urgente' as const,
      delai: '2026-11-15',
      statut: 'À faire' as const,
      ts: now - 86400000 * 1,
      par: 'Secrétariat Général',
    },
    {
      id: uid(),
      titre: 'Rapprochement bancaire des paiements Mobile Money',
      desc: 'Vérifier la concordance des relevés Airtel Money et MTN Mobile Money avec le journal de caisse du mois d’octobre.',
      to: 'r:caisse',
      priorite: 'Normale' as const,
      delai: '2026-11-25',
      statut: 'À faire' as const,
      ts: now - 86400000 * 3,
      par: 'Direction Financière',
    },
  ];

  return {
    students,
    parcours: initialParcours,
    filieres: initialFilieres,
    options: initialOptions,
    niveaux: initialNiveaux,
    classes: initialClasses,
    ue: initialUe,
    ec: initialEc,
    edt: initialEdt,
    teachers: initialTeachers,
    pay: payments,
    exams,
    ann: announcements,
    pres,
    notes,
    surv,
    missions,
    seen: 0,
    seenC: 0,
    seenM: 0,
    p: DEFAULT_PARAMS,
  };
};

export const loadAppData = (): AppData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const initial = createInitialSeedData();
      // Ensure all arrays exist, newly added academic entities fall back to seed, and matricules use UHL
      const loadedStudents = (parsed.students && parsed.students.length > 0 ? parsed.students : initial.students).map((s: Student) => ({
        ...s,
        mat: s.mat?.startsWith('HLU-') ? s.mat.replace(/^HLU-/, 'UHL-') : s.mat,
      }));

      return {
        ...initial,
        ...parsed,
        students: loadedStudents,
        filieres: parsed.filieres && parsed.filieres.length > 0 ? parsed.filieres : initial.filieres,
        options: parsed.options && parsed.options.length > 0 ? parsed.options : initial.options,
        niveaux: parsed.niveaux && parsed.niveaux.length > 0 ? parsed.niveaux : initial.niveaux,
        classes: parsed.classes && parsed.classes.length > 0 ? parsed.classes : initial.classes,
        p: { ...DEFAULT_PARAMS, ...(parsed.p || {}) },
      };
    }
  } catch (e) {
    console.error('Error loading app data from storage', e);
  }
  const seeded = createInitialSeedData();
  saveAppData(seeded);
  return seeded;
};

export const saveAppData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving app data to storage', e);
  }
};

export const resetSeedData = (): AppData => {
  const fresh = createInitialSeedData();
  saveAppData(fresh);
  return fresh;
};

